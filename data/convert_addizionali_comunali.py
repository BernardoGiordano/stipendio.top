#!/usr/bin/env python3
from __future__ import annotations

"""
Converts the MEF "Addizionale Comunale IRPEF" CSV into a JSON file
matching the TypeScript `AddizionaleComunale` type:

  { id: string; aliquota: number; esenzione?: number; nome: string }
  | { id: string; scaglioni: Array<{ limite: number; aliquota: number }>; esenzione?: number; nome: string }

Usage:
  # Generate a new JSON from a CSV:
  python convert_addizionali_comunali.py Add_comunale_irpef2025.csv -o comunali_2025.json

  # Update an existing JSON with new data from a CSV (rolling update):
  python convert_addizionali_comunali.py Add_comunale_irpef2026.csv --update comunali_2025.json -o comunali_2026.json
"""

import argparse
import csv
import json
import re
import sys
from pathlib import Path


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
    """
    m = re.search(r"(?:fino\s+a[d]?\s+euro|superiore\s+a[d]?\s+euro)\s+([\d.,]+)", text, re.IGNORECASE)
    if not m:
        # Try "inferiori a euro X" pattern
        m = re.search(r"inferiori?\s+a[d]?\s+euro\s+([\d.,]+)", text, re.IGNORECASE)
    if not m:
        return None
    amount_str = m.group(1).strip().rstrip(".")
    # Normalize Italian number format to float:
    # "28.000,00" -> 28000.00  (dots = thousands, comma = decimal)
    # "10000.00"  -> 10000.00  (no thousands sep, dot = decimal)
    # "12.000.00" -> 12000.00  (dots as thousands, missing comma - MEF typo)
    if "," in amount_str:
        amount_str = amount_str.replace(".", "").replace(",", ".")
    elif amount_str.count(".") > 1:
        # Multiple dots with no comma: dots are thousands separators
        amount_str = amount_str.replace(".", "")
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


def is_flat_rate_fascia(fascia: str) -> bool:
    """Check if a FASCIA description describes a flat rate."""
    return "aliquota unica" in fascia.lower()


def capitalize_nome(nome: str) -> str:
    """Capitalize each word's first letter, lowercase the rest.
    Handles apostrophes: "ACI SANT'ANTONIO" -> "Aci Sant'Antonio"
    """
    def cap_word(word: str) -> str:
        # Handle words with apostrophes: "SANT'ANTONIO" -> "Sant'Antonio"
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


def parse_row(row: dict) -> dict | None:
    """Parse a single CSV row into a JSON-compatible dict.
    Returns None if the row has no usable data (e.g. "0*" placeholder).
    """
    codice = row.get("CODICE_CATASTALE", "").strip()
    nome_raw = row.get("COMUNE", "").strip()
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
                    # Fallback: treat as flat if we can't parse the limit
                    scaglioni.append({"limite": None, "aliquota": rate})

        # Sort by limite (None = Infinity goes last)
        scaglioni.sort(key=lambda s: s["limite"] if s["limite"] is not None else float("inf"))

        # Replace None with null (will become Infinity in TS)
        for s in scaglioni:
            if s["limite"] is None:
                s["limite"] = None  # JSON null -> Infinity in TS

        result = {"id": codice, "nome": nome, "scaglioni": scaglioni}
        if esenzione is not None:
            result["esenzione"] = esenzione
        return result
    else:
        # Flat rate: use the first (and typically only) rate
        rate = bracket_pairs[0][0]
        result = {"id": codice, "nome": nome, "aliquota": rate}
        if esenzione is not None:
            result["esenzione"] = esenzione
        return result


# ---------------------------------------------------------------------------
# Main logic
# ---------------------------------------------------------------------------

def parse_csv(csv_path: Path) -> dict[str, dict]:
    """Parse the full CSV and return a dict keyed by CODICE_CATASTALE."""
    entries: dict[str, dict] = {}
    with open(csv_path, encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f, delimiter=";")
        for row in reader:
            entry = parse_row(row)
            if entry is not None:
                entries[entry["id"]] = entry
    return entries


def main():
    parser = argparse.ArgumentParser(
        description="Convert MEF Addizionale Comunale IRPEF CSV to JSON."
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
        help="Path for the output JSON file",
    )
    parser.add_argument(
        "--update",
        type=Path,
        default=None,
        help="Path to an existing JSON file to update (rolling update mode). "
             "Only entries with non-empty data in the CSV will overwrite the existing ones.",
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
            print(f"Error: Base JSON file not found: {args.update}", file=sys.stderr)
            sys.exit(1)

        with open(args.update, encoding="utf-8") as f:
            base_entries = json.load(f)

        base_count = len(base_entries)
        updated_count = 0
        added_count = 0

        for key, entry in new_entries.items():
            if key in base_entries:
                updated_count += 1
            else:
                added_count += 1
            base_entries[key] = entry

        print(f"Update mode: {base_count} entries in base, "
              f"{updated_count} updated, {added_count} added, "
              f"{len(base_entries)} total in output")

        result = base_entries
    else:
        result = new_entries

    # Sort by key (CODICE_CATASTALE) for stable output
    result = dict(sorted(result.items()))

    with open(args.output, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    print(f"Written {len(result)} entries to {args.output}")


if __name__ == "__main__":
    main()
