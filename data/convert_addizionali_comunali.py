#!/usr/bin/env python3
from __future__ import annotations

"""
Converts the MEF "Addizionale Comunale IRPEF" CSV into a TypeScript file
matching the `AddizionaleComunale` type, keyed by CODICE_CATASTALE.

Output format (TypeScript):
  { nome: string; pr: string; regione: string; aliquota: number; esenzione?: number }
  | { nome: string; pr: string; regione: string; scaglioni: Array<{ limite: number; aliquota: number }>; esenzione?: number }

Usage:
  # Generate a new .ts from a CSV:
  python convert_addizionali_comunali.py Add_comunale_irpef2025.csv -o 2025.comunali.ts

  # Update an existing .ts with new data from a CSV (rolling update):
  python convert_addizionali_comunali.py Add_comunale_irpef2026.csv --update 2025.comunali.ts -o 2026.comunali.ts
"""

import argparse
import csv
import json
import re
import sys
from pathlib import Path


# ---------------------------------------------------------------------------
# Province -> Region mapping
# Two-letter custom region codes used as keys in ADDIZIONALI_REGIONALI
# ---------------------------------------------------------------------------

PROVINCIA_TO_REGIONE: dict[str, str] = {
    # Abruzzo (AB)
    "AQ": "AB", "CH": "AB", "PE": "AB", "TE": "AB",
    # Basilicata (BA)
    "MT": "BA", "PZ": "BA",
    # Calabria (CL)
    "CS": "CL", "CZ": "CL", "KR": "CL", "RC": "CL", "VV": "CL",
    # Campania (CM)
    "AV": "CM", "BN": "CM", "CE": "CM", "NA": "CM", "SA": "CM",
    # Emilia-Romagna (ER)
    "BO": "ER", "FC": "ER", "FE": "ER",
    "MO": "ER", "PC": "ER", "PR": "ER",
    "RA": "ER", "RE": "ER", "RN": "ER",
    # Friuli Venezia Giulia (FV)
    "GO": "FV", "PN": "FV", "TS": "FV", "UD": "FV",
    # Lazio (LA)
    "FR": "LA", "LT": "LA", "RI": "LA", "RM": "LA", "VT": "LA",
    # Liguria (LI)
    "GE": "LI", "IM": "LI", "SP": "LI", "SV": "LI",
    # Lombardia (LO)
    "BG": "LO", "BS": "LO", "CO": "LO", "CR": "LO",
    "LC": "LO", "LO": "LO", "MB": "LO", "MI": "LO",
    "MN": "LO", "PV": "LO", "SO": "LO", "VA": "LO",
    # Marche (MA)
    "AN": "MA", "AP": "MA", "FM": "MA", "MC": "MA", "PU": "MA",
    # Molise (MO)
    "CB": "MO", "IS": "MO",
    # Piemonte (PI)
    "AL": "PI", "AT": "PI", "BI": "PI", "CN": "PI",
    "NO": "PI", "TO": "PI", "VB": "PI", "VC": "PI",
    # Puglia (PU)
    "BA": "PU", "BR": "PU", "BT": "PU", "FG": "PU",
    "LE": "PU", "TA": "PU",
    # Sardegna (SA)
    "CA": "SA", "NU": "SA", "OR": "SA", "SS": "SA", "SU": "SA",
    # Sicilia (SI)
    "AG": "SI", "CL": "SI", "CT": "SI", "EN": "SI",
    "ME": "SI", "PA": "SI", "RG": "SI", "SR": "SI", "TP": "SI",
    # Toscana (TO)
    "AR": "TO", "FI": "TO", "GR": "TO", "LI": "TO",
    "LU": "TO", "MS": "TO", "PI": "TO", "PO": "TO",
    "PT": "TO", "SI": "TO",
    # Trentino-Alto Adige - Province autonome
    "TN": "TN", "BZ": "BZ",
    # Umbria (UM)
    "PG": "UM", "TR": "UM",
    # Valle d'Aosta (VA)
    "AO": "VA",
    # Veneto (VE)
    "BL": "VE", "PD": "VE", "RO": "VE", "TV": "VE",
    "VE": "VE", "VI": "VE", "VR": "VE",
}


# ---------------------------------------------------------------------------
# Parsing helpers
# ---------------------------------------------------------------------------

def parse_rate(raw: str) -> float | None:
    """Parse a comma-decimal rate string into a float (as a ratio, not %).
    Returns None if the value represents "no data".
    Examples: ",8" -> 0.008, "0,8" -> 0.008, "0*" -> None, "" -> None
    """
    raw = raw.strip()
    if not raw or raw == "0*":
        return None
    # Prepend "0" when the value starts with comma, e.g. ",8" -> "0,8"
    if raw.startswith(","):
        raw = "0" + raw
    return round(float(raw.replace(",", ".")) / 100, 6)


def parse_euro_amount(text: str) -> float | None:
    """Extract a euro amount from a FASCIA description string.
    Handles formats like:
      "fino a euro 28.000,00"
      "fino a euro 15.000,00   "
      "fino ad euro 28.000,00"
      "fino a  euro 10.000,00"
      "fino a euro 10000.00"
      "fino a euro 9.999,99"
      "da 0 a 15.000,00 euro" (bracket upper bound)
    """
    m = re.search(r"(?:fino\s+a[d]?\s+euro|superiore\s+a[d]?\s+euro)\s+([\d.,]+\d)", text, re.IGNORECASE)
    if not m:
        # Try "inferiori a euro X" pattern (number after "euro")
        m = re.search(r"inferior[ei]\s+a[d]?\s+euro\s+([\d.,]+\d)", text, re.IGNORECASE)
    if not m:
        # Try "inferiore a X euro" pattern (number before "euro")
        m = re.search(r"inferior[ei]\s+a[d]?\s+([\d.,]+\d)\s+euro", text, re.IGNORECASE)
    if not m:
        # Try "fino a X euro" / "superiore a X euro" (number before "euro")
        m = re.search(r"(?:fino|superiore)\s+a[d]?\s+([\d.,]+\d)\s+euro", text, re.IGNORECASE)
    if not m:
        # Try "da X a Y euro" bracket pattern (e.g. "da 0 a 15.000,00 euro")
        m = re.search(r"\ba\s+([\d.,]+\d)\s+euro", text, re.IGNORECASE)
    if not m:
        return None
    amount_str = m.group(1).strip().rstrip(".")
    # Normalize Italian number format to float:
    # "28.000,00" -> 28000.00  (dots = thousands, comma = decimal)
    # "10000.00"  -> 10000.00  (no thousands sep, dot = decimal)
    # "8.500"     -> 8500      (dot as thousands, no decimal - Italian format)
    # "12.000.00" -> 12000.00  (dots as thousands, missing comma - MEF typo)
    if "," in amount_str:
        amount_str = amount_str.replace(".", "").replace(",", ".")
    elif amount_str.count(".") == 1:
        # Single dot: check if it's a thousands separator (digits after dot are
        # exactly 3, e.g. "8.500") vs a decimal (e.g. "10000.00")
        parts = amount_str.split(".")
        if len(parts[1]) == 3:
            amount_str = amount_str.replace(".", "")
    if amount_str.count(".") > 1:
        # Multiple dots: last dot is decimal, others are thousands
        # e.g. "10.000.00" -> "10000.00" (MEF typo for "10.000,00")
        # or after comma normalization: "10,000,00" -> "10.000.00" -> "10000.00"
        last_dot = amount_str.rfind(".")
        integer_part = amount_str[:last_dot].replace(".", "")
        decimal_part = amount_str[last_dot:]
        amount_str = integer_part + decimal_part
    # Strip any trailing dots left over
    amount_str = amount_str.rstrip(".")
    return float(amount_str)


def is_exemption_fascia(fascia: str) -> bool:
    """Check if a FASCIA description describes an exemption."""
    return "esenzione" in fascia.lower()


def is_generic_exemption(fascia: str) -> bool:
    """Check if this is a generic income-based exemption (modelable)
    vs a per-category exemption (pensionati, lavoratori, etc.) which is not.
    """
    lower = fascia.lower()
    if "esenzione" not in lower:
        return False
    # Generic: "Esenzione per redditi imponibili fino a euro X"
    if "redditi imponibili" in lower:
        return True
    # Generic: "Esenzione per reddito complessivo"
    if "reddito complessivo" in lower and "lavoro autonomo" not in lower:
        return True
    return False


def is_bracket_fascia(fascia: str) -> bool:
    """Check if a FASCIA description describes a tax bracket (scaglione)."""
    return "scaglione" in fascia.lower()


def capitalize_nome(nome: str) -> str:
    """Capitalize each word's first letter, lowercase the rest.
    Handles apostrophes: "ACI SANT'ANTONIO" -> "Aci Sant'Antonio"
    """
    def cap_word(word: str) -> str:
        parts = word.split("'")
        return "'".join(p.capitalize() for p in parts)

    return " ".join(cap_word(w) for w in nome.split())


# ---------------------------------------------------------------------------
# Row parsing
# ---------------------------------------------------------------------------

def collect_aliquota_fascia_pairs(row: dict) -> list[tuple[float | None, str]]:
    """Collect all (aliquota, fascia) pairs from a CSV row, filtering empties."""
    pairs = []
    # First pair is in ALIQUOTA / FASCIA columns
    rate = parse_rate(row.get("ALIQUOTA", ""))
    fascia = row.get("FASCIA", "").strip()
    if rate is not None or fascia:
        pairs.append((rate, fascia))

    # Subsequent pairs: ALIQUOTA_2/FASCIA_2 through ALIQUOTA_12/FASCIA_12
    for i in range(2, 13):
        rate = parse_rate(row.get(f"ALIQUOTA_{i}", ""))
        fascia = row.get(f"FASCIA_{i}", "").strip()
        if rate is not None or fascia:
            pairs.append((rate, fascia))

    return pairs


def parse_row(row: dict) -> tuple[str, dict] | None:
    """Parse a single CSV row into a (key, entry) tuple.
    Returns None if the row has no usable data (e.g. "0*" placeholder).
    """
    codice = row.get("CODICE_CATASTALE", "").strip()
    nome_raw = row.get("COMUNE", "").strip()
    pr = row.get("PR", "").strip()
    regione = PROVINCIA_TO_REGIONE.get(pr, "")
    if not codice or not nome_raw:
        return None

    nome = capitalize_nome(nome_raw)

    pairs = collect_aliquota_fascia_pairs(row)
    if not pairs:
        return None

    # Separate exemptions from rate/bracket entries
    esenzione: float | None = None
    bracket_pairs: list[tuple[float, str]] = []

    # First: check IMPORTO_ESENTE column
    importo_esente_raw = row.get("IMPORTO_ESENTE", "0").strip()
    if importo_esente_raw:
        importo_esente_raw = importo_esente_raw.replace(",", ".")
        try:
            importo_val = float(importo_esente_raw)
            if importo_val > 0:
                esenzione = importo_val
        except ValueError:
            pass

    for rate, fascia in pairs:
        if is_exemption_fascia(fascia):
            if esenzione is None and is_generic_exemption(fascia):
                # Parse exemption amount from text as fallback
                parsed = parse_euro_amount(fascia)
                if parsed is not None:
                    esenzione = parsed
            # Skip exemption entries - they are not rate/bracket data
            continue

        if rate is not None and rate > 0:
            bracket_pairs.append((rate, fascia))
        elif rate == 0 and fascia and not is_exemption_fascia(fascia):
            # Rate is 0 with a non-exemption description: skip (noise)
            continue

    if not bracket_pairs:
        # No usable rate data found
        return None

    # Determine if this is a flat rate or progressive brackets
    has_brackets = any(is_bracket_fascia(f) for _, f in bracket_pairs)

    if has_brackets:
        scaglioni = []
        for rate, fascia in bracket_pairs:
            if "oltre" in fascia.lower():
                scaglioni.append({"limite": None, "aliquota": rate})
            else:
                limite = parse_euro_amount(fascia)
                if limite is not None:
                    scaglioni.append({"limite": limite, "aliquota": rate})
                else:
                    scaglioni.append({"limite": None, "aliquota": rate})

        # Sort by limite (None = Infinity goes last)
        scaglioni.sort(key=lambda s: s["limite"] if s["limite"] is not None else float("inf"))

        result = {"nome": nome, "pr": pr, "regione": regione, "scaglioni": scaglioni}
        if esenzione is not None:
            result["esenzione"] = esenzione
        return codice, result
    else:
        rate = bracket_pairs[0][0]
        result = {"nome": nome, "pr": pr, "regione": regione, "aliquota": rate}
        if esenzione is not None:
            result["esenzione"] = esenzione
        return codice, result


# ---------------------------------------------------------------------------
# CSV parsing
# ---------------------------------------------------------------------------

def parse_csv(csv_path: Path) -> dict[str, dict]:
    """Parse the full CSV and return a dict keyed by CODICE_CATASTALE."""
    entries: dict[str, dict] = {}
    with open(csv_path, encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f, delimiter=";")
        for row in reader:
            parsed = parse_row(row)
            if parsed is not None:
                key, entry = parsed
                entries[key] = entry
    return entries


# ---------------------------------------------------------------------------
# TypeScript output
# ---------------------------------------------------------------------------

def format_ts_number(value: float) -> str:
    """Format a number for TypeScript output.
    Integers >= 1000 get underscore separators: 15000 -> 15_000
    Decimals are kept as-is: 0.008 -> 0.008, 9999.99 -> 9_999.99
    """
    if value == int(value):
        n = int(value)
        if n >= 1_000:
            # Format with underscore thousands separators
            s = str(n)
            # Insert underscores from right every 3 digits
            parts = []
            while s:
                parts.append(s[-3:])
                s = s[:-3]
            return "_".join(reversed(parts))
        return str(n)
    else:
        # Has decimals: split integer and decimal parts
        int_part = int(value)
        dec_str = f"{value:.10g}"
        if int_part >= 1_000:
            # Format integer part with underscores
            int_formatted = format_ts_number(float(int_part))
            # Get decimal part from the string
            dot_idx = dec_str.index(".")
            return int_formatted + dec_str[dot_idx:]
        return dec_str


def entry_to_ts(entry: dict) -> str:
    """Convert a single entry dict to a TypeScript object literal string."""
    nome = entry["nome"].replace("'", "\\'")
    pr = entry.get("pr", "")
    regione = entry.get("regione", "")
    parts = [f"nome: '{nome}'", f"pr: '{pr}'", f"regione: '{regione}'"]

    if "scaglioni" in entry:
        scaglioni_strs = []
        for s in entry["scaglioni"]:
            limite = s["limite"]
            aliquota = format_ts_number(s["aliquota"])
            if limite is None:
                scaglioni_strs.append(f"{{ limite: Infinity, aliquota: {aliquota} }}")
            else:
                scaglioni_strs.append(f"{{ limite: {format_ts_number(limite)}, aliquota: {aliquota} }}")
        parts.append(f"scaglioni: [{', '.join(scaglioni_strs)}]")
    else:
        parts.append(f"aliquota: {format_ts_number(entry['aliquota'])}")

    if "esenzione" in entry:
        parts.append(f"esenzione: {format_ts_number(entry['esenzione'])}")

    return "{ " + ", ".join(parts) + " }"


def write_ts(entries: dict[str, dict], output_path: Path) -> None:
    """Write the entries dict as a TypeScript file."""
    lines = [
        "// prettier-ignore-file",
        "import { AddizionaleComunale } from '../types';",
        "",
        "export const ADDIZIONALE_DEFAULT = 0.008; // Default 0.8% when data is missing",
        "export const ADDIZIONALI_COMUNALI: Record<string, AddizionaleComunale> = {",
    ]

    for key in sorted(entries.keys()):
        entry = entries[key]
        ts_obj = entry_to_ts(entry)
        lines.append(f"  {key}: {ts_obj},")

    lines.append("};")
    lines.append("")

    with open(output_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))


def parse_ts(ts_path: Path) -> dict[str, dict]:
    """Parse a previously generated .ts file back into a dict.
    Uses a pragmatic regex approach since we control the output format.
    """
    content = ts_path.read_text(encoding="utf-8")

    entries: dict[str, dict] = {}

    # Match each entry: KEY: { ... },
    pattern = re.compile(r"^\s+([A-Z0-9]+): (\{.+\}),\s*$", re.MULTILINE)
    for m in pattern.finditer(content):
        key = m.group(1)
        obj_str = m.group(2)

        # Convert TS syntax to JSON-parseable string
        json_str = obj_str
        # Temporarily replace escaped apostrophes (\') with a placeholder
        json_str = json_str.replace("\\'", "@@APO@@")
        # Replace single quotes with double quotes
        json_str = json_str.replace("'", '"')
        # Restore apostrophes inside strings (safe inside double quotes in JSON)
        json_str = json_str.replace("@@APO@@", "'")
        # Replace Infinity with null (we'll restore it later)
        json_str = json_str.replace("Infinity", "null")
        # Remove underscore numeric separators
        json_str = re.sub(r"(\d)_(\d)", r"\1\2", json_str)
        # Add quotes around keys: { nome: -> { "nome":
        json_str = re.sub(r"(\{|,)\s*(\w+):", r'\1 "\2":', json_str)

        try:
            entry = json.loads(json_str)
            entries[key] = entry
        except json.JSONDecodeError as e:
            print(f"Warning: could not parse entry {key}: {e}", file=sys.stderr)
            continue

    return entries


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(
        description="Convert MEF Addizionale Comunale IRPEF CSV to TypeScript."
    )
    parser.add_argument(
        "csv_file",
        type=Path,
        help="Path to the source CSV file",
    )
    parser.add_argument(
        "-o", "--output",
        type=Path,
        required=True,
        help="Path for the output .ts file",
    )
    parser.add_argument(
        "--update",
        type=Path,
        default=None,
        help="Path to an existing .ts file to update (rolling update mode). "
             "Only entries with non-empty data in the CSV will overwrite.",
    )

    args = parser.parse_args()

    if not args.csv_file.exists():
        print(f"Error: CSV file not found: {args.csv_file}", file=sys.stderr)
        sys.exit(1)

    # Parse new data from CSV
    new_entries = parse_csv(args.csv_file)
    print(f"Parsed {len(new_entries)} entries with data from {args.csv_file.name}")

    if args.update:
        if not args.update.exists():
            print(f"Error: Base .ts file not found: {args.update}", file=sys.stderr)
            sys.exit(1)

        base_entries = parse_ts(args.update)
        print(f"Loaded {len(base_entries)} entries from {args.update.name}")

        base_count = len(base_entries)
        updated_count = 0
        added_count = 0

        for key, entry in new_entries.items():
            if key in base_entries:
                updated_count += 1
            else:
                added_count += 1
            base_entries[key] = entry

        print(f"Update mode: {base_count} in base, "
              f"{updated_count} updated, {added_count} added, "
              f"{len(base_entries)} total")

        result = base_entries
    else:
        result = new_entries

    write_ts(result, args.output)
    print(f"Written {len(result)} entries to {args.output}")


if __name__ == "__main__":
    main()
