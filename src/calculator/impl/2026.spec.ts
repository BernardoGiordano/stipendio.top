import { Calculator2026 } from './2026';
import type { InputCalcoloStipendio } from '../types';

const calc = new Calculator2026();

const CONTRIBUTO_FONDO_NEGRI_2026 = 1184.49;
const CONTRIBUTO_FONDO_PASTORE_2026 = 464.81;

const baseInput: InputCalcoloStipendio = {
  ral: 25_000,
  mensilita: 13,
  tipoContratto: 'indeterminato',
  annoFiscale: 2026,
  regione: 'LOMBARDIA',
  comune: 'MILANO',
};

describe('Fringe benefit auto aziendale', () => {
  describe('Scenario utente: RAL 25k, auto pre-2025, CO2 127, trattenuta 2242', () => {
    // Calcolo atteso:
    // CO2 127 → fascia 61-160 → percentuale 30%
    // Valore convenzionale = 0.542 × 15000 × 0.30 = 2439
    // Netto trattenuta = max(0, 2439 - 2242) = 197
    // 197 < soglia 1000 → esente → imponibile previdenziale = RAL
    const result = calc.calcolaStipendioNetto({
      ...baseInput,
      fringeBenefit: {
        autoAziendale: {
          costoKmAci: 0.542,
          tipoAlimentazione: 'altro',
          mesiUtilizzo: 12,
          trattenutaDipendente: 2242,
          assegnatoPre2025: true,
          emissioniCO2: 127,
        },
      },
    });

    it('il valore auto deve essere il netto della trattenuta (€197)', () => {
      expect(result.fringeBenefit.autoAziendale).not.toBeNull();
      expect(result.fringeBenefit.autoAziendale!.valore).toBeCloseTo(197, 0);
    });

    it('la percentuale applicata deve essere 30% (CO2 61-160)', () => {
      expect(result.fringeBenefit.autoAziendale!.percentualeApplicata).toBe(0.3);
    });

    it('la soglia non deve essere superata (197 < 1000)', () => {
      expect(result.fringeBenefit.sogliaSuperata).toBe(false);
    });

    it('il valore imponibile deve essere 0 (sotto soglia)', () => {
      expect(result.fringeBenefit.valoreImponibile).toBe(0);
    });

    it("l'imponibile previdenziale deve restare uguale alla RAL", () => {
      expect(result.contributiInps.imponibilePrevidenziale).toBe(25_000);
    });

    it('la trattenuta dipendente deve ridurre il netto annuo', () => {
      const resultSenza = calc.calcolaStipendioNetto(baseInput);
      expect(resultSenza.nettoAnnuo - result.nettoAnnuo).toBeCloseTo(2242, 0);
    });
  });

  describe('Auto pre-2025 senza trattenuta, fringe sopra soglia', () => {
    // CO2 127 → 30%, costoKm 0.542
    // Valore = 0.542 × 15000 × 0.30 = 2439
    // 2439 > 1000 → tassabile → imponibile = RAL + 2439
    const result = calc.calcolaStipendioNetto({
      ...baseInput,
      fringeBenefit: {
        autoAziendale: {
          costoKmAci: 0.542,
          tipoAlimentazione: 'altro',
          mesiUtilizzo: 12,
          trattenutaDipendente: 0,
          assegnatoPre2025: true,
          emissioniCO2: 127,
        },
      },
    });

    it('il valore auto deve essere €2439 (senza trattenuta)', () => {
      expect(result.fringeBenefit.autoAziendale!.valore).toBeCloseTo(2439, 0);
    });

    it('la soglia deve essere superata (2439 > 1000)', () => {
      expect(result.fringeBenefit.sogliaSuperata).toBe(true);
    });

    it("l'imponibile previdenziale deve aumentare del fringe benefit", () => {
      expect(result.contributiInps.imponibilePrevidenziale).toBeCloseTo(25_000 + 2439, 0);
    });
  });

  describe('Percentuali CO2 regime pre-2025', () => {
    const autoBase = {
      costoKmAci: 0.5,
      tipoAlimentazione: 'altro' as const,
      mesiUtilizzo: 12,
      trattenutaDipendente: 0,
      assegnatoPre2025: true,
    };

    it('CO2 ≤ 60 → 25%', () => {
      const result = calc.calcolaStipendioNetto({
        ...baseInput,
        fringeBenefit: { autoAziendale: { ...autoBase, emissioniCO2: 60 } },
      });
      expect(result.fringeBenefit.autoAziendale!.percentualeApplicata).toBe(0.25);
      // 0.5 × 15000 × 0.25 = 1875
      expect(result.fringeBenefit.autoAziendale!.valore).toBeCloseTo(1875, 0);
    });

    it('CO2 61-160 → 30%', () => {
      const result = calc.calcolaStipendioNetto({
        ...baseInput,
        fringeBenefit: { autoAziendale: { ...autoBase, emissioniCO2: 160 } },
      });
      expect(result.fringeBenefit.autoAziendale!.percentualeApplicata).toBe(0.3);
      // 0.5 × 15000 × 0.30 = 2250
      expect(result.fringeBenefit.autoAziendale!.valore).toBeCloseTo(2250, 0);
    });

    it('CO2 161-190 → 50%', () => {
      const result = calc.calcolaStipendioNetto({
        ...baseInput,
        fringeBenefit: { autoAziendale: { ...autoBase, emissioniCO2: 190 } },
      });
      expect(result.fringeBenefit.autoAziendale!.percentualeApplicata).toBe(0.5);
      // 0.5 × 15000 × 0.50 = 3750
      expect(result.fringeBenefit.autoAziendale!.valore).toBeCloseTo(3750, 0);
    });

    it('CO2 > 190 → 60%', () => {
      const result = calc.calcolaStipendioNetto({
        ...baseInput,
        fringeBenefit: { autoAziendale: { ...autoBase, emissioniCO2: 191 } },
      });
      expect(result.fringeBenefit.autoAziendale!.percentualeApplicata).toBe(0.6);
      // 0.5 × 15000 × 0.60 = 4500
      expect(result.fringeBenefit.autoAziendale!.valore).toBeCloseTo(4500, 0);
    });
  });

  describe('Percentuali regime 2026 (tipo alimentazione)', () => {
    const autoBase = {
      costoKmAci: 0.5,
      mesiUtilizzo: 12,
      trattenutaDipendente: 0,
    };

    it('elettrico → 10%', () => {
      const result = calc.calcolaStipendioNetto({
        ...baseInput,
        fringeBenefit: {
          autoAziendale: { ...autoBase, tipoAlimentazione: 'elettrico' as const },
        },
      });
      expect(result.fringeBenefit.autoAziendale!.percentualeApplicata).toBe(0.1);
      // 0.5 × 15000 × 0.10 = 750
      expect(result.fringeBenefit.autoAziendale!.valore).toBeCloseTo(750, 0);
    });

    it('ibrido plug-in → 20%', () => {
      const result = calc.calcolaStipendioNetto({
        ...baseInput,
        fringeBenefit: {
          autoAziendale: { ...autoBase, tipoAlimentazione: 'ibrido_plugin' as const },
        },
      });
      expect(result.fringeBenefit.autoAziendale!.percentualeApplicata).toBe(0.2);
      // 0.5 × 15000 × 0.20 = 1500
      expect(result.fringeBenefit.autoAziendale!.valore).toBeCloseTo(1500, 0);
    });

    it('altro (benzina, diesel, GPL, metano) → 50%', () => {
      const result = calc.calcolaStipendioNetto({
        ...baseInput,
        fringeBenefit: {
          autoAziendale: { ...autoBase, tipoAlimentazione: 'altro' as const },
        },
      });
      expect(result.fringeBenefit.autoAziendale!.percentualeApplicata).toBe(0.5);
      // 0.5 × 15000 × 0.50 = 3750
      expect(result.fringeBenefit.autoAziendale!.valore).toBeCloseTo(3750, 0);
    });
  });

  describe('Soglia esenzione con figli a carico', () => {
    it('senza figli, soglia = €1000', () => {
      const result = calc.calcolaStipendioNetto({
        ...baseInput,
        fringeBenefit: {
          autoAziendale: {
            costoKmAci: 0.1,
            tipoAlimentazione: 'elettrico',
            mesiUtilizzo: 12,
          },
        },
      });
      // 0.1 × 15000 × 0.10 = 150, sotto soglia 1000
      expect(result.fringeBenefit.sogliaEsenzione).toBe(1_000);
      expect(result.fringeBenefit.sogliaSuperata).toBe(false);
    });

    it('con figli, soglia = €2000', () => {
      const result = calc.calcolaStipendioNetto({
        ...baseInput,
        haFigliACarico: true,
        fringeBenefit: {
          autoAziendale: {
            costoKmAci: 0.3,
            tipoAlimentazione: 'elettrico',
            mesiUtilizzo: 12,
          },
        },
      });
      // 0.3 × 15000 × 0.10 = 450, sotto soglia 2000
      expect(result.fringeBenefit.sogliaEsenzione).toBe(2_000);
      expect(result.fringeBenefit.sogliaSuperata).toBe(false);
    });

    it('con figli a carico, benefit sopra 1000 ma sotto 2000 resta esente', () => {
      const result = calc.calcolaStipendioNetto({
        ...baseInput,
        haFigliACarico: true,
        fringeBenefit: {
          autoAziendale: {
            costoKmAci: 0.5,
            tipoAlimentazione: 'ibrido_plugin',
            mesiUtilizzo: 12,
          },
        },
      });
      // 0.5 × 15000 × 0.20 = 1500, sotto soglia 2000
      expect(result.fringeBenefit.autoAziendale!.valore).toBeCloseTo(1500, 0);
      expect(result.fringeBenefit.sogliaSuperata).toBe(false);
      expect(result.fringeBenefit.valoreImponibile).toBe(0);
    });
  });

  describe('Rapporto mesi utilizzo', () => {
    it('6 mesi di utilizzo dimezza il valore', () => {
      const result12 = calc.calcolaStipendioNetto({
        ...baseInput,
        fringeBenefit: {
          autoAziendale: {
            costoKmAci: 0.5,
            tipoAlimentazione: 'altro',
            mesiUtilizzo: 12,
          },
        },
      });
      const result6 = calc.calcolaStipendioNetto({
        ...baseInput,
        fringeBenefit: {
          autoAziendale: {
            costoKmAci: 0.5,
            tipoAlimentazione: 'altro',
            mesiUtilizzo: 6,
          },
        },
      });
      expect(result6.fringeBenefit.autoAziendale!.valore).toBeCloseTo(
        result12.fringeBenefit.autoAziendale!.valore / 2,
        2,
      );
    });
  });

  describe('Trattenuta non può generare valore negativo', () => {
    it('se trattenuta > valore convenzionale, il fringe benefit è 0', () => {
      const result = calc.calcolaStipendioNetto({
        ...baseInput,
        fringeBenefit: {
          autoAziendale: {
            costoKmAci: 0.1,
            tipoAlimentazione: 'elettrico',
            mesiUtilizzo: 12,
            trattenutaDipendente: 5000,
          },
        },
      });
      // 0.1 × 15000 × 0.10 = 150, trattenuta 5000 → max(0, 150-5000) = 0
      expect(result.fringeBenefit.autoAziendale!.valore).toBe(0);
      expect(result.fringeBenefit.valoreImponibile).toBe(0);
    });
  });

  describe('Effetto su imponibile e netto con RAL alta', () => {
    it('RAL 50k + auto diesel senza trattenuta: imponibile aumenta', () => {
      const resultSenza = calc.calcolaStipendioNetto({
        ...baseInput,
        ral: 50_000,
      });
      const resultCon = calc.calcolaStipendioNetto({
        ...baseInput,
        ral: 50_000,
        fringeBenefit: {
          autoAziendale: {
            costoKmAci: 0.6,
            tipoAlimentazione: 'altro',
            mesiUtilizzo: 12,
          },
        },
      });
      // 0.6 × 15000 × 0.50 = 4500, sopra soglia 1000
      const fringeAtteso = 0.6 * 15_000 * 0.5;
      expect(resultCon.contributiInps.imponibilePrevidenziale).toBeCloseTo(
        resultSenza.contributiInps.imponibilePrevidenziale + fringeAtteso,
        0,
      );
    });
  });
});

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

describe('Fondo Antonio Pastore', () => {
  it('senza flag fondoPastore, il campo fondoPastore deve essere null', () => {
    const result = calc.calcolaStipendioNetto({
      ral: 80_000,
      mensilita: 13,
      tipoContratto: 'indeterminato',
      annoFiscale: 2026,
      regione: 'LOMBARDIA',
      comune: 'MILANO',
    });

    expect(result.fondoPastore).toBeNull();
  });

  it('con flag fondoPastore, il contributo annuo deve essere €464,81', () => {
    const result = calc.calcolaStipendioNetto({
      ral: 80_000,
      mensilita: 13,
      tipoContratto: 'indeterminato',
      annoFiscale: 2026,
      regione: 'LOMBARDIA',
      comune: 'MILANO',
      fondoPastore: true,
    });

    expect(result.fondoPastore).not.toBeNull();
    expect(result.fondoPastore!.contributoAnnuo).toBeCloseTo(CONTRIBUTO_FONDO_PASTORE_2026, 2);
  });

  it('il contributo mensile deve essere contributoAnnuo / 12', () => {
    const result = calc.calcolaStipendioNetto({
      ral: 80_000,
      mensilita: 13,
      tipoContratto: 'indeterminato',
      annoFiscale: 2026,
      regione: 'LOMBARDIA',
      comune: 'MILANO',
      fondoPastore: true,
    });

    expect(result.fondoPastore).not.toBeNull();
    expect(result.fondoPastore!.contributoMensile).toBeCloseTo(
      CONTRIBUTO_FONDO_PASTORE_2026 / 12,
      2,
    );
  });

  it("l'imponibile IRPEF NON deve essere ridotto (non deducibile)", () => {
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
      fondoPastore: true,
    });

    expect(resultCon.irpef.imponibileIrpef).toBeCloseTo(resultSenza.irpef.imponibileIrpef, 2);
  });

  it('il netto annuo deve essere ridotto esattamente di €464,81', () => {
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
      fondoPastore: true,
    });

    const differenzaNetto = resultSenza.nettoAnnuo - resultCon.nettoAnnuo;
    expect(differenzaNetto).toBeCloseTo(CONTRIBUTO_FONDO_PASTORE_2026, 2);
  });

  it('il contributo è fisso €464,81 indipendentemente dalla RAL', () => {
    const rals = [40_000, 60_000, 80_000, 100_000, 150_000];

    for (const ral of rals) {
      const result = calc.calcolaStipendioNetto({
        ral,
        mensilita: 13,
        tipoContratto: 'indeterminato',
        annoFiscale: 2026,
        regione: 'LOMBARDIA',
        comune: 'MILANO',
        fondoPastore: true,
      });

      expect(result.fondoPastore).not.toBeNull();
      expect(result.fondoPastore!.contributoAnnuo).toBeCloseTo(CONTRIBUTO_FONDO_PASTORE_2026, 2);
    }
  });

  it('può coesistere con Fondo Mario Negri', () => {
    const result = calc.calcolaStipendioNetto({
      ral: 80_000,
      mensilita: 13,
      tipoContratto: 'indeterminato',
      annoFiscale: 2026,
      regione: 'LOMBARDIA',
      comune: 'MILANO',
      fondoMarioNegri: true,
      fondoPastore: true,
    });

    expect(result.fondoNegri).not.toBeNull();
    expect(result.fondoPastore).not.toBeNull();
    expect(result.fondoNegri!.contributoAnnuo).toBeCloseTo(CONTRIBUTO_FONDO_NEGRI_2026, 2);
    expect(result.fondoPastore!.contributoAnnuo).toBeCloseTo(CONTRIBUTO_FONDO_PASTORE_2026, 2);

    // Verifica che entrambi i contributi siano inclusi nelle trattenute
    const resultSolo = calc.calcolaStipendioNetto({
      ral: 80_000,
      mensilita: 13,
      tipoContratto: 'indeterminato',
      annoFiscale: 2026,
      regione: 'LOMBARDIA',
      comune: 'MILANO',
    });

    // Il netto con entrambi i fondi deve essere inferiore a quello senza fondi
    expect(result.nettoAnnuo).toBeLessThan(resultSolo.nettoAnnuo);
  });
});

describe('Regime Impatriati (Rientro Cervelli)', () => {
  const baseImpatriati: InputCalcoloStipendio = {
    ral: 50_000,
    mensilita: 13,
    tipoContratto: 'indeterminato',
    annoFiscale: 2026,
    regione: 'LOMBARDIA',
    comune: 'MILANO',
  };

  it('senza flag regimeImpatriati, il campo regimeImpatriati deve essere null', () => {
    const result = calc.calcolaStipendioNetto(baseImpatriati);
    expect(result.regimeImpatriati).toBeNull();
  });

  it('con flag regimeImpatriati, il dettaglio deve essere presente con esenzione 50%', () => {
    const result = calc.calcolaStipendioNetto({
      ...baseImpatriati,
      regimeImpatriati: true,
    });

    expect(result.regimeImpatriati).not.toBeNull();
    expect(result.regimeImpatriati!.percentualeEsenzione).toBe(0.5);
    expect(result.regimeImpatriati!.haFigliMinorenni).toBe(false);
  });

  it('con figli minorenni, esenzione deve essere 60%', () => {
    const result = calc.calcolaStipendioNetto({
      ...baseImpatriati,
      regimeImpatriati: true,
      regimeImpatriatiMinorenni: true,
    });

    expect(result.regimeImpatriati).not.toBeNull();
    expect(result.regimeImpatriati!.percentualeEsenzione).toBe(0.6);
    expect(result.regimeImpatriati!.haFigliMinorenni).toBe(true);
  });

  it("l'imponibile IRPEF deve essere ridotto del 50% (standard)", () => {
    const resultSenza = calc.calcolaStipendioNetto(baseImpatriati);
    const resultCon = calc.calcolaStipendioNetto({
      ...baseImpatriati,
      regimeImpatriati: true,
    });

    // L'imponibile IRPEF senza regime = imponibilePrevidenziale - INPS
    // Con regime: solo il 50% di quel reddito entra nell'imponibile IRPEF
    const redditoLavoro =
      resultSenza.contributiInps.imponibilePrevidenziale -
      resultSenza.contributiInps.totaleContributi;

    expect(resultCon.irpef.imponibileIrpef).toBeCloseTo(redditoLavoro * 0.5, 0);
  });

  it("l'imponibile IRPEF deve essere ridotto del 60% (figli minorenni)", () => {
    const resultSenza = calc.calcolaStipendioNetto(baseImpatriati);
    const resultCon = calc.calcolaStipendioNetto({
      ...baseImpatriati,
      regimeImpatriati: true,
      regimeImpatriatiMinorenni: true,
    });

    const redditoLavoro =
      resultSenza.contributiInps.imponibilePrevidenziale -
      resultSenza.contributiInps.totaleContributi;

    // Solo il 40% del reddito entra nell'imponibile (60% esente)
    expect(resultCon.irpef.imponibileIrpef).toBeCloseTo(redditoLavoro * 0.4, 0);
  });

  it('i contributi INPS NON devono essere ridotti dal regime', () => {
    const resultSenza = calc.calcolaStipendioNetto(baseImpatriati);
    const resultCon = calc.calcolaStipendioNetto({
      ...baseImpatriati,
      regimeImpatriati: true,
    });

    expect(resultCon.contributiInps.totaleContributi).toBeCloseTo(
      resultSenza.contributiInps.totaleContributi,
      2,
    );
    expect(resultCon.contributiInps.imponibilePrevidenziale).toBe(
      resultSenza.contributiInps.imponibilePrevidenziale,
    );
  });

  it('le addizionali devono essere ridotte dal regime', () => {
    const resultSenza = calc.calcolaStipendioNetto(baseImpatriati);
    const resultCon = calc.calcolaStipendioNetto({
      ...baseImpatriati,
      regimeImpatriati: true,
    });

    expect(resultCon.addizionali.totaleAddizionali).toBeLessThan(
      resultSenza.addizionali.totaleAddizionali,
    );
  });

  it('il netto annuo deve aumentare significativamente con il regime', () => {
    const resultSenza = calc.calcolaStipendioNetto(baseImpatriati);
    const resultCon = calc.calcolaStipendioNetto({
      ...baseImpatriati,
      regimeImpatriati: true,
    });

    // Con RAL 50k e regime 50%, il risparmio fiscale è molto significativo
    expect(resultCon.nettoAnnuo).toBeGreaterThan(resultSenza.nettoAnnuo);
    const differenza = resultCon.nettoAnnuo - resultSenza.nettoAnnuo;
    // Il risparmio deve essere nell'ordine di migliaia di euro
    expect(differenza).toBeGreaterThan(3_000);
  });

  it('il tetto di €600.000 deve limitare il reddito agevolabile', () => {
    const resultAlto = calc.calcolaStipendioNetto({
      ...baseImpatriati,
      ral: 800_000,
      regimeImpatriati: true,
    });

    expect(resultAlto.regimeImpatriati).not.toBeNull();
    // Il reddito agevolabile è capped al reddito di lavoro dipendente (< 800k post INPS),
    // ma in ogni caso non più di €600.000
    expect(resultAlto.regimeImpatriati!.redditoAgevolabile).toBeLessThanOrEqual(600_000);
  });

  it('il regime è compatibile con Fondo Mario Negri', () => {
    const result = calc.calcolaStipendioNetto({
      ...baseImpatriati,
      ral: 80_000,
      regimeImpatriati: true,
      fondoMarioNegri: true,
    });

    expect(result.regimeImpatriati).not.toBeNull();
    expect(result.fondoNegri).not.toBeNull();

    // Il Fondo Negri riduce il reddito PRIMA della riduzione impatriati
    const redditoLavoroPre =
      result.contributiInps.imponibilePrevidenziale -
      result.contributiInps.totaleContributi -
      result.fondoNegri!.contributoAnnuo;

    expect(result.regimeImpatriati!.redditoAgevolabile).toBeCloseTo(redditoLavoroPre, 0);
    expect(result.irpef.imponibileIrpef).toBeCloseTo(redditoLavoroPre * 0.5, 0);
  });

  it("l'esenzione 60% con figli produce netto superiore alla 50%", () => {
    const result50 = calc.calcolaStipendioNetto({
      ...baseImpatriati,
      regimeImpatriati: true,
    });
    const result60 = calc.calcolaStipendioNetto({
      ...baseImpatriati,
      regimeImpatriati: true,
      regimeImpatriatiMinorenni: true,
    });

    expect(result60.nettoAnnuo).toBeGreaterThan(result50.nettoAnnuo);
  });

  it("l'importo esente deve essere coerente con percentuale e reddito", () => {
    const result = calc.calcolaStipendioNetto({
      ...baseImpatriati,
      regimeImpatriati: true,
    });

    expect(result.regimeImpatriati).not.toBeNull();
    const atteso =
      result.regimeImpatriati!.redditoAgevolabile * result.regimeImpatriati!.percentualeEsenzione;
    expect(result.regimeImpatriati!.importoEsente).toBeCloseTo(atteso, 2);
  });
});

describe('Fondo Pensione Integrativo (Previdenza Complementare)', () => {
  const LIMITE_DEDUCIBILITA = 5_300;

  it('senza fondoPensioneIntegrativo, il campo deve essere null', () => {
    const result = calc.calcolaStipendioNetto(baseInput);
    expect(result.fondoPensioneIntegrativo).toBeNull();
  });

  describe('Scenario: RAL 30k, contributo lavoratore 1%, datore 1.5%', () => {
    // Contributo lavoratore = 30000 * 1% = 300
    // Contributo datore = 30000 * 1.5% = 450
    // Totale = 750, sotto il limite → deduzione = 750
    const result = calc.calcolaStipendioNetto({
      ...baseInput,
      ral: 30_000,
      fondoPensioneIntegrativo: {
        contributoLavoratore: 1,
        contributoDatoreLavoro: 1.5,
      },
    });

    it('il contributo lavoratore annuo deve essere €300', () => {
      expect(result.fondoPensioneIntegrativo).not.toBeNull();
      expect(result.fondoPensioneIntegrativo!.contributoLavoratoreAnnuo).toBeCloseTo(300, 2);
    });

    it('il contributo lavoratore mensile deve essere €25', () => {
      expect(result.fondoPensioneIntegrativo!.contributoLavoratoreMensile).toBeCloseTo(25, 2);
    });

    it('il contributo datore annuo deve essere €450', () => {
      expect(result.fondoPensioneIntegrativo!.contributoDatoreLavoroAnnuo).toBeCloseTo(450, 2);
    });

    it('il totale contributi deve essere €750', () => {
      expect(result.fondoPensioneIntegrativo!.totaleContributi).toBeCloseTo(750, 2);
    });

    it('la deduzione effettiva deve essere €750 (sotto il limite)', () => {
      expect(result.fondoPensioneIntegrativo!.deduzioneEffettiva).toBeCloseTo(750, 2);
    });

    it("l'eccedenza non deducibile deve essere 0", () => {
      expect(result.fondoPensioneIntegrativo!.eccedenzaNonDeducibile).toBe(0);
    });

    it("l'imponibile IRPEF deve essere ridotto di €750", () => {
      const resultSenza = calc.calcolaStipendioNetto({
        ...baseInput,
        ral: 30_000,
      });
      const differenza = resultSenza.irpef.imponibileIrpef - result.irpef.imponibileIrpef;
      expect(differenza).toBeCloseTo(750, 2);
    });
  });

  describe('Scenario: RAL 100k, contributo lavoratore 3%, datore 3% (eccede il limite)', () => {
    // Contributo lavoratore = 100000 * 3% = 3000
    // Contributo datore = 100000 * 3% = 3000
    // Totale = 6000 > 5164.57 → deduzione = 5164.57, eccedenza = 835.43
    const result = calc.calcolaStipendioNetto({
      ...baseInput,
      ral: 100_000,
      fondoPensioneIntegrativo: {
        contributoLavoratore: 3,
        contributoDatoreLavoro: 3,
      },
    });

    it('il totale contributi deve essere €6000', () => {
      expect(result.fondoPensioneIntegrativo).not.toBeNull();
      expect(result.fondoPensioneIntegrativo!.totaleContributi).toBeCloseTo(6_000, 2);
    });

    it('la deduzione effettiva deve essere limitata a €5.164,57', () => {
      expect(result.fondoPensioneIntegrativo!.deduzioneEffettiva).toBeCloseTo(
        LIMITE_DEDUCIBILITA,
        2,
      );
    });

    it("l'eccedenza non deducibile deve essere €835,43", () => {
      expect(result.fondoPensioneIntegrativo!.eccedenzaNonDeducibile).toBeCloseTo(
        6_000 - LIMITE_DEDUCIBILITA,
        2,
      );
    });

    it("l'imponibile IRPEF deve essere ridotto solo di €5.164,57", () => {
      const resultSenza = calc.calcolaStipendioNetto({
        ...baseInput,
        ral: 100_000,
      });
      const differenza = resultSenza.irpef.imponibileIrpef - result.irpef.imponibileIrpef;
      expect(differenza).toBeCloseTo(LIMITE_DEDUCIBILITA, 2);
    });
  });

  it("l'imponibile previdenziale INPS non deve essere ridotto", () => {
    const resultSenza = calc.calcolaStipendioNetto({
      ...baseInput,
      ral: 40_000,
    });
    const resultCon = calc.calcolaStipendioNetto({
      ...baseInput,
      ral: 40_000,
      fondoPensioneIntegrativo: { contributoLavoratore: 2 },
    });

    expect(resultCon.contributiInps.imponibilePrevidenziale).toBe(
      resultSenza.contributiInps.imponibilePrevidenziale,
    );
  });

  it('il risparmio fiscale deve usare aliquota marginale IRPEF', () => {
    // RAL 40k → imponibile IRPEF ~36k → aliquota marginale 33%
    const result = calc.calcolaStipendioNetto({
      ...baseInput,
      ral: 40_000,
      fondoPensioneIntegrativo: { contributoLavoratore: 2 },
    });

    expect(result.fondoPensioneIntegrativo).not.toBeNull();
    const deduzione = result.fondoPensioneIntegrativo!.deduzioneEffettiva;
    const aliquotaMarginale =
      result.irpef.dettaglioScaglioni[result.irpef.dettaglioScaglioni.length - 1].aliquota;
    expect(result.fondoPensioneIntegrativo!.risparmoFiscaleStimato).toBeCloseTo(
      deduzione * aliquotaMarginale,
      2,
    );
  });

  it('solo il contributo lavoratore deve ridurre il netto (non il datore)', () => {
    const resultSoloLavoratore = calc.calcolaStipendioNetto({
      ...baseInput,
      ral: 40_000,
      fondoPensioneIntegrativo: { contributoLavoratore: 1 },
    });

    const resultConDatore = calc.calcolaStipendioNetto({
      ...baseInput,
      ral: 40_000,
      fondoPensioneIntegrativo: { contributoLavoratore: 1, contributoDatoreLavoro: 1 },
    });

    // Con il contributo datore, la deduzione IRPEF è maggiore → netto più alto
    expect(resultConDatore.nettoAnnuo).toBeGreaterThan(resultSoloLavoratore.nettoAnnuo);
  });

  it('senza contributo datore, solo il contributo lavoratore è deducibile', () => {
    const result = calc.calcolaStipendioNetto({
      ...baseInput,
      ral: 50_000,
      fondoPensioneIntegrativo: { contributoLavoratore: 2 },
    });

    expect(result.fondoPensioneIntegrativo).not.toBeNull();
    expect(result.fondoPensioneIntegrativo!.contributoDatoreLavoroAnnuo).toBe(0);
    // Contributo lavoratore = 50000 * 2% = 1000 (sotto il limite)
    expect(result.fondoPensioneIntegrativo!.deduzioneEffettiva).toBeCloseTo(1_000, 2);
  });

  it('può coesistere con Fondo Mario Negri', () => {
    const result = calc.calcolaStipendioNetto({
      ...baseInput,
      ral: 80_000,
      fondoMarioNegri: true,
      fondoPensioneIntegrativo: { contributoLavoratore: 1, contributoDatoreLavoro: 1 },
    });

    expect(result.fondoNegri).not.toBeNull();
    expect(result.fondoPensioneIntegrativo).not.toBeNull();

    // Entrambe le deduzioni devono ridurre l'imponibile
    const resultSenza = calc.calcolaStipendioNetto({
      ...baseInput,
      ral: 80_000,
    });

    expect(result.irpef.imponibileIrpef).toBeLessThan(resultSenza.irpef.imponibileIrpef);
  });

  it('il Fondo Negri (fondo in squilibrio) riduce il plafond di deducibilità', () => {
    // Senza Fondo Negri: cap pieno = €5.300
    const resultSenza = calc.calcolaStipendioNetto({
      ...baseInput,
      ral: 80_000,
      fondoPensioneIntegrativo: { contributoLavoratore: 5, contributoDatoreLavoro: 2 },
    });

    // Con Fondo Negri: cap residuo = 5300 - 1184.49 = 4115.51
    const resultCon = calc.calcolaStipendioNetto({
      ...baseInput,
      ral: 80_000,
      fondoMarioNegri: true,
      fondoPensioneIntegrativo: { contributoLavoratore: 5, contributoDatoreLavoro: 2 },
    });

    expect(resultSenza.fondoPensioneIntegrativo).not.toBeNull();
    expect(resultCon.fondoPensioneIntegrativo).not.toBeNull();

    // Senza Negri: contributi = 80000 * 7% = 5600, deduzione = min(5600, 5300) = 5300
    expect(resultSenza.fondoPensioneIntegrativo!.deduzioneEffettiva).toBeCloseTo(
      LIMITE_DEDUCIBILITA,
      2,
    );

    // Con Negri: contributi = 5600, cap residuo = 5300 - 1184.49 = 4115.51
    const capResiduo = LIMITE_DEDUCIBILITA - CONTRIBUTO_FONDO_NEGRI_2026;
    expect(resultCon.fondoPensioneIntegrativo!.deduzioneEffettiva).toBeCloseTo(capResiduo, 2);

    // L'eccedenza con Negri deve essere maggiore
    expect(resultCon.fondoPensioneIntegrativo!.eccedenzaNonDeducibile).toBeGreaterThan(
      resultSenza.fondoPensioneIntegrativo!.eccedenzaNonDeducibile,
    );
  });
});
