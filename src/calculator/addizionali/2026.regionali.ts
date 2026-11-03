import type { AddizionaleRegionale } from './2026';

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

export const ADDIZIONALI_REGIONALI: Record<string, AddizionaleRegionale> = {
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
    // L.R. 30 marzo 2022, n. 7, art. 1, commi 2 e 3: due detrazioni cumulabili, in proporzione alla
    // percentuale e ai mesi a carico, per redditi fino a 28.000 euro
    detrazioniFigli: [
      { limiteReddito: 28_000, importo: 30, minimoFigli: 2 },
      { limiteReddito: 28_000, importo: 40, soloDisabili: true },
    ],
    redditiSostitutiviInSoglia: true,
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
    scaglioni: [{ limite: Infinity, aliquota: 0.0123 }],
    aliquotaRidotta: { limiteReddito: 15_000, aliquota: 0.007 },
  },
  LA: {
    scaglioni: [
      { limite: 15_000, aliquota: 0.0173 },
      { limite: 50_000, aliquota: 0.0333 },
      { limite: Infinity, aliquota: 0.0333 },
    ],
    aliquotaRidotta: { limiteReddito: 28_000, aliquota: 0.0173 },
    // "Tra 28.001 e 30.000 euro": l'imponibile dichiarato è arrotondato all'unità di euro
    detrazioneBase: { sogliaReddito: 28_000, limiteReddito: 30_000, importo: 60 },
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
    // L.R. 23 marzo 2022, n. 5, art. 1: aliquota unica 1,23% con figli disabili a carico, a
    // prescindere dall'età, per redditi fino a 50.000 euro
    aliquotaRidotta: { limiteReddito: 50_000, aliquota: 0.0123, requisito: 'figliDisabili' },
    redditiSostitutiviInSoglia: true,
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
    // L.R. 28 marzo 2022, n. 4, come modificata dalla L.R. 6 agosto 2025, n. 16 (dal 2026): 100 euro
    // per ciascun figlio, a partire dal primo, con più di due figli a carico (i non disabili contano
    // solo sotto i 30 anni), più 500 euro per ciascun figlio disabile. Maggiorazioni delle
    // detrazioni per carichi di famiglia, ridotte dal quoziente dell'art. 12 TUIR
    detrazioniFigli: [
      { importo: 100, minimoFigli: 3, etaMassimaNonDisabili: 30, quozienteArt12: true },
      { importo: 500, soloDisabili: true, quozienteArt12: true },
    ],
  },
  PU: {
    scaglioni: [
      { limite: 15_000, aliquota: 0.0133 },
      { limite: 28_000, aliquota: 0.0143 },
      { limite: 50_000, aliquota: 0.0163 },
      { limite: Infinity, aliquota: 0.0185 },
    ],
    // L.R. 29 dicembre 2015, n. 40, art. 3: con più di tre figli a carico, 20 euro per ciascun figlio
    // a partire dal primo, aumentati di 375 euro per ogni figlio disabile. Maggiorazione delle
    // detrazioni per carichi di famiglia, ridotta dal quoziente dell'art. 12 TUIR
    detrazioniFigli: [
      { importo: 20, maggiorazioneDisabile: 375, minimoFigli: 4, quozienteArt12: true },
    ],
  },
  SA: {
    scaglioni: [{ limite: Infinity, aliquota: 0.0123 }],
    // L.R. 48/2018, art. 2, commi 1 e 1 bis (L.R. 11 luglio 2022, n. 13): 200 euro per ciascun figlio
    // minorenne a carico, aumentati di 100 euro se disabile, per redditi fino a 50.000 euro
    detrazioniFigli: [
      { limiteReddito: 50_000, importo: 200, maggiorazioneDisabile: 100, soloMinorenni: true },
    ],
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
    esenzione: 30_000,
    detrazioniFigli: [{ limiteReddito: 50_000, importo: 246 }],
  },
  BZ: {
    scaglioni: [
      { limite: 50_000, aliquota: 0.0123 },
      { limite: Infinity, aliquota: 0.0173 },
    ],
    detrazioneBase: { limiteReddito: 90_000, importo: 430.5 },
    detrazioneSupplementare: { sogliaReddito: 50_000, intervalloReddito: 25_000, importo: 125 },
    detrazioniFigli: [{ limiteReddito: 90_000, importo: 340 }],
    redditiSostitutiviInSoglia: true,
  },
  UM: {
    scaglioni: [
      { limite: 15_000, aliquota: 0.0173 },
      { limite: 28_000, aliquota: 0.0302 },
      { limite: 50_000, aliquota: 0.0312 },
      { limite: Infinity, aliquota: 0.0333 },
    ],
    aliquotaRidotta: { limiteReddito: 28_000, aliquota: 0.0123 },
    // "Tra 28.001 e 50.000 euro": l'imponibile dichiarato è arrotondato all'unità di euro
    detrazioneBase: { sogliaReddito: 28_000, limiteReddito: 50_000, importo: 150 },
  },
  VA: {
    scaglioni: [{ limite: Infinity, aliquota: 0.0123 }],
    esenzione: 15_000,
  },
  VE: {
    scaglioni: [{ limite: Infinity, aliquota: 0.0123 }],
    // L.R. 19/2005, art. 1, c. 5 (L.R. 30/2022, art. 9): aliquota 0,90% per i contribuenti disabili o
    // con un familiare disabile a carico, per redditi fino a 50.000 euro
    aliquotaRidotta: {
      limiteReddito: 50_000,
      aliquota: 0.009,
      requisito: 'contribuenteOFigliDisabili',
    },
  },
  // Aliquota di default per regioni non specificate (aliquota base nazionale)
  DEFAULT: {
    scaglioni: [{ limite: Infinity, aliquota: 0.0123 }],
  },
};
