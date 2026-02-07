export const REGIONE_LABELS: Record<string, string> = {
  AB: 'Abruzzo',
  BA: 'Basilicata',
  BZ: 'Provincia di Bolzano',
  CL: 'Calabria',
  CM: 'Campania',
  ER: 'Emilia-Romagna',
  FV: 'Friuli Venezia Giulia',
  LA: 'Lazio',
  LI: 'Liguria',
  LO: 'Lombardia',
  MA: 'Marche',
  MO: 'Molise',
  PI: 'Piemonte',
  PU: 'Puglia',
  SA: 'Sardegna',
  SI: 'Sicilia',
  TN: 'Provincia di Trento',
  TO: 'Toscana',
  UM: 'Umbria',
  VA: "Valle d'Aosta",
  VE: 'Veneto',
};

export const ADDIZIONALI_REGIONALI: Record<
  string,
  { scaglioni: Array<{ limite: number; aliquota: number }>; esenzione?: number; note?: string }
> = {
  AB: {
    scaglioni: [
      { limite: 28_000, aliquota: 0.0167 },
      { limite: 50_000, aliquota: 0.0287 },
      { limite: Infinity, aliquota: 0.0333 },
    ],
  },
  BA: {
    scaglioni: [{ limite: Infinity, aliquota: 0.0123 }],
  },
  CL: {
    scaglioni: [{ limite: Infinity, aliquota: 0.0173 }],
  },
  CM: {
    scaglioni: [
      { limite: 15_000, aliquota: 0.0173 },
      { limite: 28_000, aliquota: 0.0296 },
      { limite: 50_000, aliquota: 0.032 },
      { limite: Infinity, aliquota: 0.0333 },
    ],
    // note: 'Detrazioni: €30/figlio (min 2 figli), €40/figlio disabile per redditi ≤€28.000',
  },
  ER: {
    scaglioni: [
      { limite: 15_000, aliquota: 0.0133 },
      { limite: 28_000, aliquota: 0.0193 },
      { limite: 50_000, aliquota: 0.0293 },
      { limite: Infinity, aliquota: 0.0333 },
    ],
  },
  FV: {
    scaglioni: [
      { limite: 15_000, aliquota: 0.007 },
      { limite: Infinity, aliquota: 0.0123 },
    ],
  },
  LA: {
    scaglioni: [
      { limite: 28_000, aliquota: 0.0173 },
      { limite: 50_000, aliquota: 0.0333 },
      { limite: Infinity, aliquota: 0.0333 },
    ],
    // note: 'Detrazione €60 per redditi €28.001-€35.000',
  },
  LI: {
    scaglioni: [
      { limite: 28_000, aliquota: 0.0123 },
      { limite: 50_000, aliquota: 0.0318 },
      { limite: Infinity, aliquota: 0.0323 },
    ],
  },
  LO: {
    scaglioni: [
      { limite: 15_000, aliquota: 0.0123 },
      { limite: 28_000, aliquota: 0.0158 },
      { limite: 50_000, aliquota: 0.0172 },
      { limite: Infinity, aliquota: 0.0173 },
    ],
  },
  MA: {
    scaglioni: [
      { limite: 15_000, aliquota: 0.0123 },
      { limite: 28_000, aliquota: 0.0153 },
      { limite: 50_000, aliquota: 0.017 },
      { limite: Infinity, aliquota: 0.0173 },
    ],
    // note: 'Aliquota ridotta 1,23% per contribuenti con figli disabili a carico (reddito ≤€50.000)',
  },
  MO: {
    scaglioni: [
      { limite: 15_000, aliquota: 0.0173 },
      { limite: 28_000, aliquota: 0.0193 },
      { limite: 50_000, aliquota: 0.0333 },
      { limite: Infinity, aliquota: 0.0333 },
    ],
  },
  PI: {
    scaglioni: [
      { limite: 15_000, aliquota: 0.0162 },
      { limite: 28_000, aliquota: 0.0268 },
      { limite: 50_000, aliquota: 0.0331 },
      { limite: Infinity, aliquota: 0.0333 },
    ],
    // note: 'Detrazioni: €100/figlio (dal 3°), €500/figlio disabile',
  },
  PU: {
    scaglioni: [
      { limite: 15_000, aliquota: 0.0133 },
      { limite: 28_000, aliquota: 0.0143 },
      { limite: 50_000, aliquota: 0.0163 },
      { limite: Infinity, aliquota: 0.0185 },
    ],
    // note: 'Detrazioni: €20/figlio (>3 figli), €375 aggiuntivi per figli disabili',
  },
  SA: {
    scaglioni: [{ limite: Infinity, aliquota: 0.0123 }],
    // note: 'Detrazione €200/figlio minorenne (reddito ≤€50.000), +€100 per figli disabili',
  },
  SI: {
    scaglioni: [{ limite: Infinity, aliquota: 0.0123 }],
  },
  TO: {
    scaglioni: [
      { limite: 15_000, aliquota: 0.0142 },
      { limite: 28_000, aliquota: 0.0143 },
      { limite: 50_000, aliquota: 0.0332 },
      { limite: Infinity, aliquota: 0.0333 },
    ],
  },
  // Province autonome di Trento e Bolzano
  TN: {
    scaglioni: [
      { limite: 50_000, aliquota: 0.0123 },
      { limite: Infinity, aliquota: 0.0173 },
    ],
    // note: 'Deduzione €30.000 per redditi ≤€30.000; detrazione €246/figlio per redditi ≤€50.000',
  },
  BZ: {
    scaglioni: [
      { limite: 50_000, aliquota: 0.0123 },
      { limite: Infinity, aliquota: 0.0173 },
    ],
    // note: 'Detrazione base €430,50 per redditi ≤€90.000; €340/figlio a carico',
  },
  UM: {
    scaglioni: [
      { limite: 28_000, aliquota: 0.0123 },
      { limite: 50_000, aliquota: 0.0167 },
      { limite: Infinity, aliquota: 0.0183 },
    ],
    // note: 'Detrazione €150 per redditi €28.001-€50.000',
  },
  VA: {
    scaglioni: [{ limite: Infinity, aliquota: 0.0123 }],
    esenzione: 15_000,
  },
  VE: {
    scaglioni: [{ limite: Infinity, aliquota: 0.0123 }],
    // note: 'Aliquota ridotta 0,90% per soggetti disabili o con familiari disabili a carico (reddito ≤€50.000)',
  },
  // Aliquota di default per regioni non specificate (aliquota base nazionale)
  DEFAULT: {
    scaglioni: [{ limite: Infinity, aliquota: 0.0123 }],
  },
};
