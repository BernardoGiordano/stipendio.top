export const ADDIZIONALI_REGIONALI: Record<
  string,
  { scaglioni: Array<{ limite: number; aliquota: number }> }
> = {
  ABRUZZO: {
    scaglioni: [{ limite: Infinity, aliquota: 0.0173 }],
  },
  CALABRIA: {
    scaglioni: [{ limite: Infinity, aliquota: 0.0173 }],
  },
  CAMPANIA: {
    scaglioni: [
      { limite: 15_000, aliquota: 0.0173 },
      { limite: 28_000, aliquota: 0.0203 },
      { limite: 50_000, aliquota: 0.0233 },
      { limite: Infinity, aliquota: 0.0333 },
    ],
  },
  EMILIA_ROMAGNA: {
    scaglioni: [
      { limite: 15_000, aliquota: 0.0133 },
      { limite: 28_000, aliquota: 0.0193 },
      { limite: 50_000, aliquota: 0.0278 },
      { limite: Infinity, aliquota: 0.0333 },
    ],
  },
  FRIULI_VENEZIA_GIULIA: {
    scaglioni: [
      { limite: 15_000, aliquota: 0.007 },
      { limite: Infinity, aliquota: 0.0123 },
    ],
  },
  LAZIO: {
    scaglioni: [{ limite: Infinity, aliquota: 0.0173 }],
  },
  LIGURIA: {
    scaglioni: [
      { limite: 15_000, aliquota: 0.0123 },
      { limite: 28_000, aliquota: 0.0179 },
      { limite: 50_000, aliquota: 0.0231 },
      { limite: Infinity, aliquota: 0.0233 },
    ],
  },
  LOMBARDIA: {
    scaglioni: [
      { limite: 15_000, aliquota: 0.0123 },
      { limite: 28_000, aliquota: 0.0158 },
      { limite: 50_000, aliquota: 0.0172 },
      { limite: Infinity, aliquota: 0.0173 },
    ],
  },
  MARCHE: {
    scaglioni: [
      { limite: 15_000, aliquota: 0.0123 },
      { limite: 28_000, aliquota: 0.0153 },
      { limite: 50_000, aliquota: 0.017 },
      { limite: Infinity, aliquota: 0.0173 },
    ],
  },
  MOLISE: {
    scaglioni: [
      { limite: 15_000, aliquota: 0.0203 },
      { limite: 28_000, aliquota: 0.0223 },
      { limite: 50_000, aliquota: 0.0243 },
      { limite: Infinity, aliquota: 0.0263 },
    ],
  },
  PIEMONTE: {
    scaglioni: [
      { limite: 15_000, aliquota: 0.0162 },
      { limite: 28_000, aliquota: 0.0268 },
      { limite: 50_000, aliquota: 0.0331 },
      { limite: Infinity, aliquota: 0.0333 },
    ],
  },
  PUGLIA: {
    scaglioni: [
      { limite: 15_000, aliquota: 0.0133 },
      { limite: 28_000, aliquota: 0.0143 },
      { limite: 50_000, aliquota: 0.0163 },
      { limite: Infinity, aliquota: 0.0185 },
    ],
  },
  TOSCANA: {
    scaglioni: [
      { limite: 15_000, aliquota: 0.0142 },
      { limite: 28_000, aliquota: 0.0143 },
      { limite: 50_000, aliquota: 0.0168 },
      { limite: Infinity, aliquota: 0.0173 },
    ],
  },
  UMBRIA: {
    scaglioni: [
      { limite: 15_000, aliquota: 0.0123 },
      { limite: 28_000, aliquota: 0.0162 },
      { limite: 50_000, aliquota: 0.0167 },
      { limite: Infinity, aliquota: 0.0183 },
    ],
  },
  // Aliquota di default per regioni non specificate (aliquota base nazionale)
  DEFAULT: {
    scaglioni: [{ limite: Infinity, aliquota: 0.0123 }],
  },
};

export const ADDIZIONALI_COMUNALI: Record<string, { aliquota: number; esenzione?: number }> = {
  ROMA: { aliquota: 0.009, esenzione: 14_000 },
  MILANO: { aliquota: 0.008 },
  NAPOLI: { aliquota: 0.009 },
  TORINO: { aliquota: 0.008 },
  PALERMO: { aliquota: 0.008 },
  GENOVA: { aliquota: 0.008 },
  BOLOGNA: { aliquota: 0.008 },
  FIRENZE: { aliquota: 0.003, esenzione: 25_000 },
  BARI: { aliquota: 0.009 },
  VENEZIA: { aliquota: 0.008 },
  // Default per comuni non specificati
  DEFAULT: { aliquota: 0.008 },
};
