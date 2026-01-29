/** Aliquote addizionali regionali IRPEF (esempi principali regioni) */
export const ADDIZIONALI_REGIONALI: Record<
  string,
  { scaglioni: Array<{ limite: number; aliquota: number }> }
> = {
  LOMBARDIA: {
    scaglioni: [
      { limite: 15_000, aliquota: 0.0123 },
      { limite: 28_000, aliquota: 0.0158 },
      { limite: 50_000, aliquota: 0.0172 },
      { limite: Infinity, aliquota: 0.0173 },
    ],
  },
  LAZIO: {
    scaglioni: [
      { limite: 28_000, aliquota: 0.0173 },
      { limite: Infinity, aliquota: 0.0333 },
    ],
  },
  CAMPANIA: {
    scaglioni: [
      { limite: 15_000, aliquota: 0.0173 },
      { limite: 28_000, aliquota: 0.0203 },
      { limite: 50_000, aliquota: 0.0233 },
      { limite: Infinity, aliquota: 0.0333 },
    ],
  },
  PIEMONTE: {
    scaglioni: [
      { limite: 15_000, aliquota: 0.0162 },
      { limite: 28_000, aliquota: 0.0213 },
      { limite: 50_000, aliquota: 0.027 },
      { limite: Infinity, aliquota: 0.0333 },
    ],
  },
  VENETO: {
    scaglioni: [
      { limite: 15_000, aliquota: 0.0123 },
      { limite: 28_000, aliquota: 0.0193 },
      { limite: 50_000, aliquota: 0.0203 },
      { limite: Infinity, aliquota: 0.0223 },
    ],
  },
  EMILIA_ROMAGNA: {
    scaglioni: [
      { limite: 15_000, aliquota: 0.0133 },
      { limite: 28_000, aliquota: 0.0193 },
      { limite: 50_000, aliquota: 0.0203 },
      { limite: Infinity, aliquota: 0.0223 },
    ],
  },
  TOSCANA: {
    scaglioni: [
      { limite: 15_000, aliquota: 0.0142 },
      { limite: 28_000, aliquota: 0.0177 },
      { limite: 50_000, aliquota: 0.0212 },
      { limite: Infinity, aliquota: 0.0233 },
    ],
  },
  SICILIA: {
    scaglioni: [
      { limite: 15_000, aliquota: 0.0123 },
      { limite: 28_000, aliquota: 0.0183 },
      { limite: 50_000, aliquota: 0.0203 },
      { limite: Infinity, aliquota: 0.0223 },
    ],
  },
  PUGLIA: {
    scaglioni: [
      { limite: 15_000, aliquota: 0.0133 },
      { limite: 28_000, aliquota: 0.0183 },
      { limite: 50_000, aliquota: 0.0203 },
      { limite: Infinity, aliquota: 0.0233 },
    ],
  },
  // Aliquota di default per regioni non specificate (aliquota base nazionale)
  DEFAULT: {
    scaglioni: [{ limite: Infinity, aliquota: 0.0123 }],
  },
};

/** Aliquote addizionali comunali (esempi principali città) */
export const ADDIZIONALI_COMUNALI: Record<string, { aliquota: number; esenzione?: number }> = {
  ROMA: { aliquota: 0.009, esenzione: 14_000 },
  MILANO: { aliquota: 0.008, esenzione: 21_000 },
  NAPOLI: { aliquota: 0.008 },
  TORINO: { aliquota: 0.008 },
  PALERMO: { aliquota: 0.008 },
  GENOVA: { aliquota: 0.008 },
  BOLOGNA: { aliquota: 0.008, esenzione: 12_000 },
  FIRENZE: { aliquota: 0.003 },
  BARI: { aliquota: 0.008 },
  VENEZIA: { aliquota: 0.008 },
  // Default per comuni non specificati
  DEFAULT: { aliquota: 0.008 },
};
