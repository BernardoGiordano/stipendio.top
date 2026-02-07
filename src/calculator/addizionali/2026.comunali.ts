import { AddizionaleComunale } from '../types';

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
