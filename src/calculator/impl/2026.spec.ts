import { Calculator2026 } from './2026';

const calc = new Calculator2026();

const CONTRIBUTO_FONDO_NEGRI_2026 = 1184.49;

describe('Fondo Mario Negri', () => {
  it('senza flag fondoMarioNegri, il campo fondoNegri deve essere null', () => {
    const result = calc.calcolaStipendioNetto({
      ral: 80_000,
      mensilita: 13,
      tipoContratto: 'indeterminato',
      annoFiscale: 2026,
      regione: 'LOMBARDIA',
      comune: 'MILANO',
    });

    expect(result.fondoNegri).toBeNull();
  });

  it('con flag fondoMarioNegri, il contributo annuo deve essere €1.184,49', () => {
    const result = calc.calcolaStipendioNetto({
      ral: 80_000,
      mensilita: 13,
      tipoContratto: 'indeterminato',
      annoFiscale: 2026,
      regione: 'LOMBARDIA',
      comune: 'MILANO',
      fondoMarioNegri: true,
    });

    expect(result.fondoNegri).not.toBeNull();
    expect(result.fondoNegri!.contributoAnnuo).toBeCloseTo(CONTRIBUTO_FONDO_NEGRI_2026, 2);
  });

  it('il contributo mensile deve essere contributoAnnuo / 12', () => {
    const result = calc.calcolaStipendioNetto({
      ral: 80_000,
      mensilita: 13,
      tipoContratto: 'indeterminato',
      annoFiscale: 2026,
      regione: 'LOMBARDIA',
      comune: 'MILANO',
      fondoMarioNegri: true,
    });

    expect(result.fondoNegri).not.toBeNull();
    expect(result.fondoNegri!.contributoMensile).toBeCloseTo(CONTRIBUTO_FONDO_NEGRI_2026 / 12, 2);
  });

  it("l'imponibile IRPEF deve essere ridotto di €1.184,49", () => {
    const resultSenza = calc.calcolaStipendioNetto({
      ral: 80_000,
      mensilita: 13,
      tipoContratto: 'indeterminato',
      annoFiscale: 2026,
      regione: 'LOMBARDIA',
      comune: 'MILANO',
    });

    const resultCon = calc.calcolaStipendioNetto({
      ral: 80_000,
      mensilita: 13,
      tipoContratto: 'indeterminato',
      annoFiscale: 2026,
      regione: 'LOMBARDIA',
      comune: 'MILANO',
      fondoMarioNegri: true,
    });

    const differenzaImponibile =
      resultSenza.irpef.imponibileIrpef - resultCon.irpef.imponibileIrpef;
    expect(differenzaImponibile).toBeCloseTo(CONTRIBUTO_FONDO_NEGRI_2026, 2);
  });

  it('il risparmio fiscale deve essere calcolato con aliquota marginale 43%', () => {
    const result = calc.calcolaStipendioNetto({
      ral: 80_000,
      mensilita: 13,
      tipoContratto: 'indeterminato',
      annoFiscale: 2026,
      regione: 'LOMBARDIA',
      comune: 'MILANO',
      fondoMarioNegri: true,
    });

    expect(result.fondoNegri).not.toBeNull();
    expect(result.fondoNegri!.risparmoFiscaleStimato).toBeCloseTo(
      CONTRIBUTO_FONDO_NEGRI_2026 * 0.43,
      2,
    );
  });

  it('il netto annuo deve essere ridotto del costo netto effettivo (~€675)', () => {
    const resultSenza = calc.calcolaStipendioNetto({
      ral: 80_000,
      mensilita: 13,
      tipoContratto: 'indeterminato',
      annoFiscale: 2026,
      regione: 'LOMBARDIA',
      comune: 'MILANO',
    });

    const resultCon = calc.calcolaStipendioNetto({
      ral: 80_000,
      mensilita: 13,
      tipoContratto: 'indeterminato',
      annoFiscale: 2026,
      regione: 'LOMBARDIA',
      comune: 'MILANO',
      fondoMarioNegri: true,
    });

    const differenzaNetto = resultSenza.nettoAnnuo - resultCon.nettoAnnuo;
    expect(differenzaNetto).toBeGreaterThan(600);
    expect(differenzaNetto).toBeLessThan(700);
  });

  it('il contributo è fisso €1.184,49 indipendentemente dalla RAL', () => {
    const rals = [40_000, 60_000, 80_000, 100_000, 150_000];

    for (const ral of rals) {
      const result = calc.calcolaStipendioNetto({
        ral,
        mensilita: 13,
        tipoContratto: 'indeterminato',
        annoFiscale: 2026,
        regione: 'LOMBARDIA',
        comune: 'MILANO',
        fondoMarioNegri: true,
      });

      expect(result.fondoNegri).not.toBeNull();
      expect(result.fondoNegri!.contributoAnnuo).toBeCloseTo(CONTRIBUTO_FONDO_NEGRI_2026, 2);
    }
  });
});
