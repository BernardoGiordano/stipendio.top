"""Fixture tests for the MEF CSV parser. Run with: python3 -m unittest discover -s data"""

import contextlib
import csv
import io
import math
import unittest

from convert_addizionali_comunali import parse_bracket_limit, parse_row

HEADER = (
    "CODICE_CATASTALE;COMUNE;PR;NUMERO_DELIBERA;DATA_DELIBERA;DATA_PUBBLICAZIONE;NOTE;MULTIALIQ;"
    "ALIQUOTA;FASCIA;ALIQUOTA_2;FASCIA_2;ALIQUOTA_3;FASCIA_3;ALIQUOTA_4;FASCIA_4;"
    "ALIQUOTA_5;FASCIA_5;ALIQUOTA_6;FASCIA_6;ALIQUOTA_7;FASCIA_7;ALIQUOTA_8;FASCIA_8;"
    "ALIQUOTA_9;FASCIA_9;ALIQUOTA_10;FASCIA_10;ALIQUOTA_11;FASCIA_11;ALIQUOTA_12;FASCIA_12;"
    "FLAG_NUOVA;IMPORTO_ESENTE"
)

# Real rows from the MEF CSVs, one per FASCIA wording the parser must understand
ROWS = {
    # 2025: "da X a Y" with no currency
    "A060": "A060;ADRO;BS;48;19/12/2024;27/01/2025;DELIBERA ADOTTATA EX ART. 1, COMMA 751, L. 207/2024;SI;0,5;Applicabile a Scaglione da 0 a 15.000,00;,6;Applicabile a scaglione da 15.001,00 a 28.000,00 ;,7;Applicabile a scaglione da 28.001,00 a 50.000,00;,8;Applicabile a scaglione oltre 50.000,00;0;Esenzione per redditi imponibili fino a euro 15.000,00;;;;;;;;;;;;;;;0;0",
    # 2026: "€" instead of "euro", open-ended last bracket with only "DA"
    "A264": "A264;AMENO;NO;32;17/12/2025;30/04/2026;DELIBERA ADOTTATA EX ART. 1, COMMA 751, L. 207/2024;SI;0,2;Applicabile a  SCAGLIONE DI REDDITO FINO A € 15.000,00;,4;Applicabile a SCAGLIONE DI REDDITO DA € 15.000,01 A € 28.000,00;,6;Applicabile a SCAGLIONE DI REDDITO DA € 28.000,01 A € 50.000,00;,8;Applicabile a SCAGLIONE DI REDDITO DA € 50.000,01 ;0;Esenzione per redditi imponibili fino a euro 12.000,00;;;;;;;;;;;;;;;0;0",
    # 2025: "da euro X a euro Y"
    "E668": "E668;LONDA;FI;15;27/03/2025;18/09/2025;DELIBERA ADOTTATA EX ART. 1, COMMA 751, L. 207/2024;SI;0,69;Applicabile a scaglione di reddito fino a euro 15.000,00;,76;Applicabile a scaglione di reddito da euro 15.000,01 a euro 28.000,00;,77;Applicabile a scaglione di reddito da euro 28.000,01 a euro 50.000,00;,79;Applicabile a scaglione di reddito oltre euro 50.000,00;0;Esenzione per redditi imponibili fino a euro 10.000,00;;;;;;;;;;;;;;;0;0",
    # 2026: "oltre X fino a Y" is a closed bracket
    "A157": "A157;ALBIANO D'IVREA;TO;31;15/12/2025;10/06/2026;DELIBERA ADOTTATA EX ART. 1, COMMA 751, L. 207/2024;SI;0,58;Applicabile a  scaglione di reddito fino a euro 15.000,00;,61;Applicabile a scaglione di reddito da euro 15.000,01 fino a euro 28.000,00;,68;Applicabile a scaglione di reddito oltre euro 28.000,00 fino a euro 50.000,00;,75;Applicabile a scaglione di reddito oltre euro 50.000,00;;;;;;;;;;;;;;;;;0;0",
    # 2026: "oltre ad euro X" is open-ended despite the "ad"
    "I588": "I588;SELLERO;BS;40;29/12/2025;05/03/2026;MODIFICA;SI;0,2;Applicabile a scaglione di reddito fino a euro 15.000,00;,5;Applicabile a scaglione di reddito da euro 15.000,01 fino a euro 28.000,00;,7;Applicabile a scaglione di reddito da euro 28.000,01 fino a euro 50.000,00;,8;Applicabile a scaglione di reddito oltre ad euro 50.000,00;0;Esenzione per redditi fino ad euro 10.000,00;;;;;;;;;;;;;;;0;0",
    # 2026: the third bracket repeats the second bracket's text
    "A112": "A112;AIRUNO;LC;41;22/12/2025;13/01/2026;DELIBERA ADOTTATA EX ART. 1, COMMA 751, L. 207/2024;SI;0,33;Applicabile a scaglione di reddito fino a euro 15.000,00;,35;Applicabile a scaglione di reddito da euro 15.000,01 fino a euro 28.000,00;,5;Applicabile a scaglione di reddito da euro 15.000,01 fino a euro 28.000,00;,8;Applicabile a scaglione di reddito oltre euro 50.000,00;;;;;;;;;;;;;;;;;0;0",
    # 2025: flat rate with exemption in IMPORTO_ESENTE
    "F205": "F205;MILANO;MI;46;28/09/2020;20/12/2025;CONFERMA;SI;0;Esenzione per redditi imponibili fino a euro 23.000,00;,8;Aliquota unica;;;;;;;;;;;;;;;;;;;;;2;23000",
}


def parse(codice: str) -> dict:
    row = next(csv.DictReader(io.StringIO(HEADER + "\n" + ROWS[codice]), delimiter=";"))
    with contextlib.redirect_stderr(io.StringIO()):
        parsed = parse_row(row)
    assert parsed is not None
    return parsed[1]


def limits(codice: str) -> list[float | None]:
    return [s["l"] for s in parse(codice)["s"]]


def rates(codice: str) -> list[float]:
    return [s["a"] for s in parse(codice)["s"]]


class BracketLimitTest(unittest.TestCase):
    def test_wordings(self):
        cases = {
            "Applicabile a scaglione di reddito fino a euro 15.000,00": 15_000,
            "Applicabile a scaglione di reddito fino a € 15.000,00": 15_000,
            "Applicabile a scaglione di reddito fino a €. 15.000,00": 15_000,
            "Applicabile a scaglione di reddito fino a euro15.000,00": 15_000,
            "Applicabile a scaglione di reddito fino a 15.000 ,00": 15_000,
            "Applicabile a scaglione di reddito a euro 15.000,00": 15_000,
            "Applicabile a scaglione da 0 a 15.000,00": 15_000,
            "Applicabile a scaglione di reddito da €15.000,01 a €28.000,00": 28_000,
            "Applicabile a scaglione di reddito da euro 15.000,01 ad euro 28.000,00": 28_000,
            "Applicabile a scaglione di reddito da euro 15.000,01 e fino a €euro 28.000,00": 28_000,
            "Applicabile a scaglione di reddito tra euro 15.000,01 ed euro 28.000,00": 28_000,
            "Applicabile a scaglione di reddito oltre euro 28.000,00 fino a euro 50.000,00": 50_000,
            "applicabile a scaglione di reddito da a euro 28.000,01 fino a euro 50.000,00": 50_000,
            "Applicabile a 2 scaglione da  15.001,00 ad  28.000,00": 28_000,
            "Applicabile a scaglione di reddito da euro 0 ad euro 15.000,00 (per redditi superiori a euro 10.000,00)": 15_000,
            "Applicabile a scaglione di reddito oltre euro 50.000,00": None,
            "Applicabile a scaglione di reddito oltre ad euro 50.000,00": None,
            "Applicabile a scaglione di reddito oltre i 75.000,00 euro": None,
            "Applicabile a scaglione di reddito superiore a euro 75.000,00": None,
            "Applicabile a scaglione di reddito da euro 75.000,01": None,
            "Applicabile a scaglione di reddito da 75.001,00 euro": None,
        }
        for fascia, expected in cases.items():
            with self.subTest(fascia=fascia):
                self.assertEqual(parse_bracket_limit(fascia), expected)


class ParseRowTest(unittest.TestCase):
    def test_brackets_without_currency(self):
        self.assertEqual(limits("A060"), [15_000, 28_000, 50_000, None])
        self.assertEqual(rates("A060"), [0.005, 0.006, 0.007, 0.008])
        self.assertEqual(parse("A060")["e"], 15_000)

    def test_brackets_with_euro_sign(self):
        self.assertEqual(limits("A264"), [15_000, 28_000, 50_000, None])
        self.assertEqual(rates("A264"), [0.002, 0.004, 0.006, 0.008])

    def test_brackets_da_euro_a_euro(self):
        self.assertEqual(limits("E668"), [15_000, 28_000, 50_000, None])

    def test_oltre_with_upper_bound_is_closed(self):
        self.assertEqual(limits("A157"), [15_000, 28_000, 50_000, None])
        self.assertEqual(rates("A157"), [0.0058, 0.0061, 0.0068, 0.0075])

    def test_oltre_ad_is_open(self):
        self.assertEqual(limits("I588"), [15_000, 28_000, 50_000, None])

    def test_repeated_bracket_ends_where_next_starts(self):
        self.assertEqual(limits("A112"), [15_000, 28_000, 50_000, None])
        self.assertEqual(rates("A112"), [0.0033, 0.0035, 0.005, 0.008])

    def test_flat_rate(self):
        entry = parse("F205")
        self.assertEqual(entry["a"], 0.008)
        self.assertEqual(entry["e"], 23_000)
        self.assertNotIn("s", entry)

    def test_scaglioni_ascend_with_one_open_bracket(self):
        for codice in ROWS:
            entry = parse(codice)
            if "s" not in entry:
                continue
            with self.subTest(codice=codice):
                bounds = [math.inf if l is None else l for l in limits(codice)]
                self.assertEqual(bounds[-1], math.inf)
                self.assertTrue(all(a < b for a, b in zip(bounds, bounds[1:])))


if __name__ == "__main__":
    unittest.main()
