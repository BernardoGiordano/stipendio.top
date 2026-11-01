import { calcolaStipendioNetto } from '../../../calculator/calculator';
import type { InputCalcoloStipendio } from '../../../calculator/types';
import { ripartizioneRal } from './breakdown';

const base: InputCalcoloStipendio = {
  ral: 35_000,
  mensilita: 13,
  tipoContratto: 'indeterminato',
  annoFiscale: 2026,
  regione: 'BA',
  comune: 'DEFAULT',
};

const sum = (values: number[]) => values.reduce((s, v) => s + v, 0);

describe('ripartizioneRal', () => {
  it('splits the RAL into netto and trattenute that add back up to it', () => {
    const result = calcolaStipendioNetto(base);
    const { base: totale, quote } = ripartizioneRal(result);
    expect(totale).toBe(35_000);
    expect(quote[0]).toMatchObject({ id: 'netto', importo: result.nettoAnnuo });
    expect(sum(quote.map((q) => q.importo))).toBeCloseTo(totale, 2);
    expect(sum(quote.map((q) => q.quota))).toBeCloseTo(1, 6);
  });

  it('groups trattenute by category, largest first', () => {
    const result = calcolaStipendioNetto(base);
    const trattenute = ripartizioneRal(result).quote.slice(1);
    expect(trattenute.map((q) => q.id)).toEqual(['irpef', 'contributi', 'addizionali']);
    const addizionali = trattenute.find((q) => q.id === 'addizionali')!;
    expect(addizionali.importo).toBeCloseTo(result.addizionali.totaleAddizionali, 2);
  });

  it('names the fondi group after the pension fund when it is the only fund', () => {
    const fondoPensione = {
      ...base,
      fondoPensioneIntegrativo: { contributoLavoratore: 1, ralLavoratore: 35_000 },
    };
    const soloFondo = ripartizioneRal(calcolaStipendioNetto(fondoPensione)).quote;
    expect(soloFondo.find((q) => q.id === 'fondi')?.label).toBe('Fondo pensione');

    const conNegri = ripartizioneRal(
      calcolaStipendioNetto({ ...fondoPensione, ral: 80_000, fondoMarioNegri: true }),
    ).quote;
    expect(conNegri.find((q) => q.id === 'fondi')?.label).toBe('Fondi');
  });

  it('uses the borsa as the base of a borsa di studio contract', () => {
    const result = calcolaStipendioNetto({
      ...base,
      ral: 16_243,
      mensilita: 12,
      tipoContratto: 'borsaDiStudio',
    });
    const { base: totale, quote } = ripartizioneRal(result);
    expect(totale).toBe(16_243);
    expect(quote.map((q) => q.id)).toEqual(['netto', 'contributi']);
  });
});
