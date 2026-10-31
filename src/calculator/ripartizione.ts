import type { OutputCalcoloStipendio, Ripartizione, VoceEntrata, VoceTrattenuta } from './types';

export type TotaliRipartizione = Pick<
  OutputCalcoloStipendio,
  'costoAziendale' | 'totaleTrattenute' | 'totaleBonus' | 'nettoAnnuo' | 'totalePercepito'
>;

/** Tiene solo le voci con importo positivo */
export function ripartisci(entrate: VoceEntrata[], trattenute: VoceTrattenuta[]): Ripartizione {
  return {
    entrate: entrate.filter((voce) => voce.importo > 0),
    trattenute: trattenute.filter((voce) => voce.importo > 0),
  };
}

export function totali({ entrate, trattenute }: Ripartizione): TotaliRipartizione {
  const totaleTrattenute = somma(trattenute);
  const nettoAnnuo =
    somma(entrate.filter((voce) => voce.destinazione === 'netto')) - totaleTrattenute;

  return {
    costoAziendale: somma(entrate.filter((voce) => voce.pagatore === 'datore')),
    totaleTrattenute,
    totaleBonus: somma(entrate.filter((voce) => voce.categoria === 'bonus')),
    nettoAnnuo,
    totalePercepito: nettoAnnuo + somma(entrate.filter((voce) => voce.destinazione === 'esente')),
  };
}

export function somma(voci: readonly { importo: number }[]): number {
  return voci.reduce((totale, voce) => totale + voce.importo, 0);
}
