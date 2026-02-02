/**
 * Addizionali Regionali IRPEF 2025
 * Dati aggiornati a febbraio 2026
 * Fonte: Dipartimento delle Finanze (finanze.gov.it)
 */
import { AddizionaleComunale } from './types';

export const ADDIZIONALI_REGIONALI: Record<
  string,
  { scaglioni: Array<{ limite: number; aliquota: number }>; esenzione?: number; note?: string }
> = {
  ABRUZZO: {
    scaglioni: [
      { limite: 28_000, aliquota: 0.0167 },
      { limite: 50_000, aliquota: 0.0287 },
      { limite: Infinity, aliquota: 0.0333 },
    ],
  },
  BASILICATA: {
    scaglioni: [{ limite: Infinity, aliquota: 0.0123 }],
  },
  CALABRIA: {
    scaglioni: [{ limite: Infinity, aliquota: 0.0173 }],
  },
  CAMPANIA: {
    scaglioni: [
      { limite: 15_000, aliquota: 0.0173 },
      { limite: 28_000, aliquota: 0.0296 },
      { limite: 50_000, aliquota: 0.032 },
      { limite: Infinity, aliquota: 0.0333 },
    ],
    // note: 'Detrazioni: €30/figlio (min 2 figli), €40/figlio disabile per redditi ≤€28.000',
  },
  EMILIA_ROMAGNA: {
    scaglioni: [
      { limite: 15_000, aliquota: 0.0133 },
      { limite: 28_000, aliquota: 0.0193 },
      { limite: 50_000, aliquota: 0.0293 },
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
    scaglioni: [
      { limite: 28_000, aliquota: 0.0173 },
      { limite: 50_000, aliquota: 0.0333 },
      { limite: Infinity, aliquota: 0.0333 },
    ],
    // note: 'Detrazione €60 per redditi €28.001-€35.000',
  },
  LIGURIA: {
    scaglioni: [
      { limite: 28_000, aliquota: 0.0123 },
      { limite: 50_000, aliquota: 0.0318 },
      { limite: Infinity, aliquota: 0.0323 },
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
    // note: 'Aliquota ridotta 1,23% per contribuenti con figli disabili a carico (reddito ≤€50.000)',
  },
  MOLISE: {
    scaglioni: [
      { limite: 15_000, aliquota: 0.0173 },
      { limite: 28_000, aliquota: 0.0193 },
      { limite: 50_000, aliquota: 0.0333 },
      { limite: Infinity, aliquota: 0.0333 },
    ],
  },
  PIEMONTE: {
    scaglioni: [
      { limite: 15_000, aliquota: 0.0162 },
      { limite: 28_000, aliquota: 0.0268 },
      { limite: 50_000, aliquota: 0.0331 },
      { limite: Infinity, aliquota: 0.0333 },
    ],
    // note: 'Detrazioni: €100/figlio (dal 3°), €500/figlio disabile',
  },
  PUGLIA: {
    scaglioni: [
      { limite: 15_000, aliquota: 0.0133 },
      { limite: 28_000, aliquota: 0.0143 },
      { limite: 50_000, aliquota: 0.0163 },
      { limite: Infinity, aliquota: 0.0185 },
    ],
    // note: 'Detrazioni: €20/figlio (>3 figli), €375 aggiuntivi per figli disabili',
  },
  SARDEGNA: {
    scaglioni: [{ limite: Infinity, aliquota: 0.0123 }],
    // note: 'Detrazione €200/figlio minorenne (reddito ≤€50.000), +€100 per figli disabili',
  },
  SICILIA: {
    scaglioni: [{ limite: Infinity, aliquota: 0.0123 }],
  },
  TOSCANA: {
    scaglioni: [
      { limite: 15_000, aliquota: 0.0142 },
      { limite: 28_000, aliquota: 0.0143 },
      { limite: 50_000, aliquota: 0.0332 },
      { limite: Infinity, aliquota: 0.0333 },
    ],
  },
  // Province autonome di Trento e Bolzano (gestite separatamente)
  TRENTINO_ALTO_ADIGE: {
    scaglioni: [
      { limite: 50_000, aliquota: 0.0123 },
      { limite: Infinity, aliquota: 0.0173 },
    ],
    // note: 'Vedi province autonome per deduzioni/detrazioni specifiche',
  },
  PROVINCIA_TRENTO: {
    scaglioni: [
      { limite: 50_000, aliquota: 0.0123 },
      { limite: Infinity, aliquota: 0.0173 },
    ],
    // note: 'Deduzione €30.000 per redditi ≤€30.000; detrazione €246/figlio per redditi ≤€50.000',
  },
  PROVINCIA_BOLZANO: {
    scaglioni: [
      { limite: 50_000, aliquota: 0.0123 },
      { limite: Infinity, aliquota: 0.0173 },
    ],
    // note: 'Detrazione base €430,50 per redditi ≤€90.000; €340/figlio a carico',
  },
  UMBRIA: {
    scaglioni: [
      { limite: 28_000, aliquota: 0.0123 },
      { limite: 50_000, aliquota: 0.0167 },
      { limite: Infinity, aliquota: 0.0183 },
    ],
    // note: 'Detrazione €150 per redditi €28.001-€50.000',
  },
  VALLE_AOSTA: {
    scaglioni: [{ limite: Infinity, aliquota: 0.0123 }],
    esenzione: 15_000,
  },
  VENETO: {
    scaglioni: [{ limite: Infinity, aliquota: 0.0123 }],
    // note: 'Aliquota ridotta 0,90% per soggetti disabili o con familiari disabili a carico (reddito ≤€50.000)',
  },
  // Aliquota di default per regioni non specificate (aliquota base nazionale)
  DEFAULT: {
    scaglioni: [{ limite: Infinity, aliquota: 0.0123 }],
  },
};

export const ADDIZIONALI_COMUNALI: Record<string, AddizionaleComunale> = {
  ROMA: { aliquota: 0.009, esenzione: 14_000 },
  MILANO: { aliquota: 0.008 },
  NAPOLI: { aliquota: 0.009 },
  // Torino: scaglioni progressivi con esenzione €11.790
  // Fonte: https://www.comune.torino.it/schede-informative/addizionale-comunale-irpef
  TORINO: {
    scaglioni: [
      { limite: 28_000, aliquota: 0.008 },
      { limite: 50_000, aliquota: 0.011 },
      { limite: Infinity, aliquota: 0.012 },
    ],
    esenzione: 11_790,
  },
  PALERMO: { aliquota: 0.008 },
  GENOVA: { aliquota: 0.008 },
  BOLOGNA: { aliquota: 0.008 },
  FIRENZE: { aliquota: 0.003, esenzione: 25_000 },
  BARI: { aliquota: 0.009 },
  VENEZIA: { aliquota: 0.008 },
  // Default per comuni non specificati
  DEFAULT: { aliquota: 0.008 },
};
