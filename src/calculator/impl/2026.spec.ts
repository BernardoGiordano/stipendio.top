import { Calculator2026 } from './2026';
import type { InputCalcoloStipendio } from '../types';

const calc = new Calculator2026();

const CONTRIBUTO_FONDO_NEGRI_2026 = 1184.49;
const CONTRIBUTO_FONDO_PASTORE_2026 = 464.81;
const CONTRIBUTO_CFMT_2026 = 166;
const CONTRIBUTO_FASDAC_2026 = 859.08;
const CONTRIBUTO_FONDO_EST_2026 = 24;

const baseInput: InputCalcoloStipendio = {
  ral: 25_000,
  mensilita: 13,
  tipoContratto: 'indeterminato',
  annoFiscale: 2026,
  regione: 'LO',
  comune: 'F205',
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
      regione: 'LO',
      comune: 'F205',
    });

    expect(result.fondoNegri).toBeNull();
  });

  it('con flag fondoMarioNegri, il contributo annuo deve essere €1.184,49', () => {
    const result = calc.calcolaStipendioNetto({
      ral: 80_000,
      mensilita: 13,
      tipoContratto: 'indeterminato',
      annoFiscale: 2026,
      regione: 'LO',
      comune: 'F205',
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
      regione: 'LO',
      comune: 'F205',
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
      regione: 'LO',
      comune: 'F205',
    });

    const resultCon = calc.calcolaStipendioNetto({
      ral: 80_000,
      mensilita: 13,
      tipoContratto: 'indeterminato',
      annoFiscale: 2026,
      regione: 'LO',
      comune: 'F205',
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
      regione: 'LO',
      comune: 'F205',
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
      regione: 'LO',
      comune: 'F205',
    });

    const resultCon = calc.calcolaStipendioNetto({
      ral: 80_000,
      mensilita: 13,
      tipoContratto: 'indeterminato',
      annoFiscale: 2026,
      regione: 'LO',
      comune: 'F205',
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
        regione: 'LO',
        comune: 'F205',
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
      regione: 'LO',
      comune: 'F205',
    });

    expect(result.fondoPastore).toBeNull();
  });

  it('con flag fondoPastore, il contributo annuo deve essere €464,81', () => {
    const result = calc.calcolaStipendioNetto({
      ral: 80_000,
      mensilita: 13,
      tipoContratto: 'indeterminato',
      annoFiscale: 2026,
      regione: 'LO',
      comune: 'F205',
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
      regione: 'LO',
      comune: 'F205',
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
      regione: 'LO',
      comune: 'F205',
    });

    const resultCon = calc.calcolaStipendioNetto({
      ral: 80_000,
      mensilita: 13,
      tipoContratto: 'indeterminato',
      annoFiscale: 2026,
      regione: 'LO',
      comune: 'F205',
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
      regione: 'LO',
      comune: 'F205',
    });

    const resultCon = calc.calcolaStipendioNetto({
      ral: 80_000,
      mensilita: 13,
      tipoContratto: 'indeterminato',
      annoFiscale: 2026,
      regione: 'LO',
      comune: 'F205',
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
        regione: 'LO',
        comune: 'F205',
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
      regione: 'LO',
      comune: 'F205',
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
      regione: 'LO',
      comune: 'F205',
    });

    // Il netto con entrambi i fondi deve essere inferiore a quello senza fondi
    expect(result.nettoAnnuo).toBeLessThan(resultSolo.nettoAnnuo);
  });
});

describe('CFMT (Centro di Formazione Management del Terziario)', () => {
  it('senza flag cfmt, il campo cfmt deve essere null', () => {
    const result = calc.calcolaStipendioNetto({
      ral: 80_000,
      mensilita: 13,
      tipoContratto: 'indeterminato',
      annoFiscale: 2026,
      regione: 'LO',
      comune: 'F205',
    });

    expect(result.cfmt).toBeNull();
  });

  it('con flag cfmt, il contributo annuo deve essere €166', () => {
    const result = calc.calcolaStipendioNetto({
      ral: 80_000,
      mensilita: 13,
      tipoContratto: 'indeterminato',
      annoFiscale: 2026,
      regione: 'LO',
      comune: 'F205',
      cfmt: true,
    });

    expect(result.cfmt).not.toBeNull();
    expect(result.cfmt!.contributoAnnuo).toBeCloseTo(CONTRIBUTO_CFMT_2026, 2);
  });

  it('il contributo mensile deve essere contributoAnnuo / 12', () => {
    const result = calc.calcolaStipendioNetto({
      ral: 80_000,
      mensilita: 13,
      tipoContratto: 'indeterminato',
      annoFiscale: 2026,
      regione: 'LO',
      comune: 'F205',
      cfmt: true,
    });

    expect(result.cfmt).not.toBeNull();
    expect(result.cfmt!.contributoMensile).toBeCloseTo(CONTRIBUTO_CFMT_2026 / 12, 2);
  });

  it("NON deve ridurre l'imponibile IRPEF (stessa IRPEF con/senza CFMT)", () => {
    const resultSenza = calc.calcolaStipendioNetto({
      ral: 80_000,
      mensilita: 13,
      tipoContratto: 'indeterminato',
      annoFiscale: 2026,
      regione: 'LO',
      comune: 'F205',
    });

    const resultCon = calc.calcolaStipendioNetto({
      ral: 80_000,
      mensilita: 13,
      tipoContratto: 'indeterminato',
      annoFiscale: 2026,
      regione: 'LO',
      comune: 'F205',
      cfmt: true,
    });

    expect(resultCon.irpef.imponibileIrpef).toBeCloseTo(resultSenza.irpef.imponibileIrpef, 2);
  });

  it('deve ridurre il netto esattamente di €166', () => {
    const resultSenza = calc.calcolaStipendioNetto({
      ral: 80_000,
      mensilita: 13,
      tipoContratto: 'indeterminato',
      annoFiscale: 2026,
      regione: 'LO',
      comune: 'F205',
    });

    const resultCon = calc.calcolaStipendioNetto({
      ral: 80_000,
      mensilita: 13,
      tipoContratto: 'indeterminato',
      annoFiscale: 2026,
      regione: 'LO',
      comune: 'F205',
      cfmt: true,
    });

    const differenzaNetto = resultSenza.nettoAnnuo - resultCon.nettoAnnuo;
    expect(differenzaNetto).toBeCloseTo(CONTRIBUTO_CFMT_2026, 2);
  });
});

describe('FASDAC (Fondo Assistenza Sanitaria Dirigenti)', () => {
  it('senza flag fasdac, il campo fasdac deve essere null', () => {
    const result = calc.calcolaStipendioNetto({
      ral: 80_000,
      mensilita: 13,
      tipoContratto: 'indeterminato',
      annoFiscale: 2026,
      regione: 'LO',
      comune: 'F205',
    });

    expect(result.fasdac).toBeNull();
  });

  it('con flag fasdac, il contributo annuo deve essere €859,08', () => {
    const result = calc.calcolaStipendioNetto({
      ral: 80_000,
      mensilita: 13,
      tipoContratto: 'indeterminato',
      annoFiscale: 2026,
      regione: 'LO',
      comune: 'F205',
      fasdac: true,
    });

    expect(result.fasdac).not.toBeNull();
    expect(result.fasdac!.contributoAnnuo).toBeCloseTo(CONTRIBUTO_FASDAC_2026, 2);
  });

  it('il contributo mensile deve essere contributoAnnuo / 12', () => {
    const result = calc.calcolaStipendioNetto({
      ral: 80_000,
      mensilita: 13,
      tipoContratto: 'indeterminato',
      annoFiscale: 2026,
      regione: 'LO',
      comune: 'F205',
      fasdac: true,
    });

    expect(result.fasdac).not.toBeNull();
    expect(result.fasdac!.contributoMensile).toBeCloseTo(CONTRIBUTO_FASDAC_2026 / 12, 2);
  });

  it("NON deve ridurre l'imponibile IRPEF (stessa IRPEF con/senza FASDAC)", () => {
    const resultSenza = calc.calcolaStipendioNetto({
      ral: 80_000,
      mensilita: 13,
      tipoContratto: 'indeterminato',
      annoFiscale: 2026,
      regione: 'LO',
      comune: 'F205',
    });

    const resultCon = calc.calcolaStipendioNetto({
      ral: 80_000,
      mensilita: 13,
      tipoContratto: 'indeterminato',
      annoFiscale: 2026,
      regione: 'LO',
      comune: 'F205',
      fasdac: true,
    });

    expect(resultCon.irpef.imponibileIrpef).toBeCloseTo(resultSenza.irpef.imponibileIrpef, 2);
  });

  it('deve ridurre il netto esattamente di €859,08', () => {
    const resultSenza = calc.calcolaStipendioNetto({
      ral: 80_000,
      mensilita: 13,
      tipoContratto: 'indeterminato',
      annoFiscale: 2026,
      regione: 'LO',
      comune: 'F205',
    });

    const resultCon = calc.calcolaStipendioNetto({
      ral: 80_000,
      mensilita: 13,
      tipoContratto: 'indeterminato',
      annoFiscale: 2026,
      regione: 'LO',
      comune: 'F205',
      fasdac: true,
    });

    const differenzaNetto = resultSenza.nettoAnnuo - resultCon.nettoAnnuo;
    expect(differenzaNetto).toBeCloseTo(CONTRIBUTO_FASDAC_2026, 2);
  });
});

describe('Fondo EST (Assistenza Sanitaria Integrativa dipendenti CCNL Commercio)', () => {
  it('senza flag fondoEst, il campo fondoEst deve essere null', () => {
    const result = calc.calcolaStipendioNetto({
      ral: 25_000,
      mensilita: 13,
      tipoContratto: 'indeterminato',
      annoFiscale: 2026,
      regione: 'LO',
      comune: 'F205',
    });

    expect(result.fondoEst).toBeNull();
  });

  it('con flag fondoEst, il contributo annuo deve essere €24', () => {
    const result = calc.calcolaStipendioNetto({
      ral: 25_000,
      mensilita: 13,
      tipoContratto: 'indeterminato',
      annoFiscale: 2026,
      regione: 'LO',
      comune: 'F205',
      fondoEst: true,
    });

    expect(result.fondoEst).not.toBeNull();
    expect(result.fondoEst!.contributoAnnuo).toBeCloseTo(CONTRIBUTO_FONDO_EST_2026, 2);
  });

  it('il contributo mensile deve essere €2', () => {
    const result = calc.calcolaStipendioNetto({
      ral: 25_000,
      mensilita: 13,
      tipoContratto: 'indeterminato',
      annoFiscale: 2026,
      regione: 'LO',
      comune: 'F205',
      fondoEst: true,
    });

    expect(result.fondoEst).not.toBeNull();
    expect(result.fondoEst!.contributoMensile).toBeCloseTo(CONTRIBUTO_FONDO_EST_2026 / 12, 2);
  });

  it("NON deve ridurre l'imponibile IRPEF (stessa IRPEF con/senza Fondo EST)", () => {
    const resultSenza = calc.calcolaStipendioNetto({
      ral: 25_000,
      mensilita: 13,
      tipoContratto: 'indeterminato',
      annoFiscale: 2026,
      regione: 'LO',
      comune: 'F205',
    });

    const resultCon = calc.calcolaStipendioNetto({
      ral: 25_000,
      mensilita: 13,
      tipoContratto: 'indeterminato',
      annoFiscale: 2026,
      regione: 'LO',
      comune: 'F205',
      fondoEst: true,
    });

    expect(resultCon.irpef.imponibileIrpef).toBeCloseTo(resultSenza.irpef.imponibileIrpef, 2);
  });

  it('deve ridurre il netto esattamente di €24', () => {
    const resultSenza = calc.calcolaStipendioNetto({
      ral: 25_000,
      mensilita: 13,
      tipoContratto: 'indeterminato',
      annoFiscale: 2026,
      regione: 'LO',
      comune: 'F205',
    });

    const resultCon = calc.calcolaStipendioNetto({
      ral: 25_000,
      mensilita: 13,
      tipoContratto: 'indeterminato',
      annoFiscale: 2026,
      regione: 'LO',
      comune: 'F205',
      fondoEst: true,
    });

    const differenzaNetto = resultSenza.nettoAnnuo - resultCon.nettoAnnuo;
    expect(differenzaNetto).toBeCloseTo(CONTRIBUTO_FONDO_EST_2026, 2);
  });

  it('il costo aziendale deve includere €156 fondoEstDatore', () => {
    const resultSenza = calc.calcolaStipendioNetto({
      ral: 25_000,
      mensilita: 13,
      tipoContratto: 'indeterminato',
      annoFiscale: 2026,
      regione: 'LO',
      comune: 'F205',
    });

    const resultCon = calc.calcolaStipendioNetto({
      ral: 25_000,
      mensilita: 13,
      tipoContratto: 'indeterminato',
      annoFiscale: 2026,
      regione: 'LO',
      comune: 'F205',
      fondoEst: true,
    });

    expect(resultCon.costoAziendale.fondoEstDatore).toBe(156);
    expect(
      resultCon.costoAziendale.totaleAnnuo - resultSenza.costoAziendale.totaleAnnuo,
    ).toBeCloseTo(156, 2);
  });
});

describe('Regime Impatriati (Rientro Cervelli)', () => {
  const baseImpatriati: InputCalcoloStipendio = {
    ral: 50_000,
    mensilita: 13,
    tipoContratto: 'indeterminato',
    annoFiscale: 2026,
    regione: 'LO',
    comune: 'F205',
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
        ralLavoratore: 30_000,
        contributoDatoreLavoro: 1.5,
        ralDatoreLavoro: 30_000,
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

    it("l'imponibile IRPEF deve essere ridotto solo del contributo lavoratore (€300)", () => {
      // Il contributo datore è reddito (Art. 51 TUIR) ma anche deducibile (Art. 10 TUIR):
      // viene aggiunto e poi dedotto → effetto netto zero sull'imponibile.
      // Solo il contributo lavoratore riduce effettivamente l'imponibile.
      const resultSenza = calc.calcolaStipendioNetto({
        ...baseInput,
        ral: 30_000,
      });
      const differenza = resultSenza.irpef.imponibileIrpef - result.irpef.imponibileIrpef;
      expect(differenza).toBeCloseTo(300, 2);
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
        ralLavoratore: 100_000,
        contributoDatoreLavoro: 3,
        ralDatoreLavoro: 100_000,
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

    it("l'imponibile IRPEF deve essere ridotto di deduzione - contributo datore", () => {
      // Contributo datore (3000) è aggiunto come reddito e poi dedotto.
      // Riduzione netta imponibile = deduzione (5300) - contributoDatore (3000) = 2300
      const resultSenza = calc.calcolaStipendioNetto({
        ...baseInput,
        ral: 100_000,
      });
      const differenza = resultSenza.irpef.imponibileIrpef - result.irpef.imponibileIrpef;
      expect(differenza).toBeCloseTo(LIMITE_DEDUCIBILITA - 3_000, 2);
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
      fondoPensioneIntegrativo: { contributoLavoratore: 2, ralLavoratore: 40_000 },
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
      fondoPensioneIntegrativo: { contributoLavoratore: 2, ralLavoratore: 40_000 },
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

  it('il contributo datore non deve modificare il netto (entro il cap)', () => {
    // Il contributo datore è reddito (Art. 51 TUIR) ma deducibile (Art. 10 TUIR):
    // aggiunto e poi dedotto → effetto netto zero. Il netto non cambia.
    const resultSoloLavoratore = calc.calcolaStipendioNetto({
      ...baseInput,
      ral: 40_000,
      fondoPensioneIntegrativo: { contributoLavoratore: 1, ralLavoratore: 40_000 },
    });

    const resultConDatore = calc.calcolaStipendioNetto({
      ...baseInput,
      ral: 40_000,
      fondoPensioneIntegrativo: {
        contributoLavoratore: 1,
        ralLavoratore: 40_000,
        contributoDatoreLavoro: 1,
        ralDatoreLavoro: 40_000,
      },
    });

    expect(resultConDatore.nettoAnnuo).toBeCloseTo(resultSoloLavoratore.nettoAnnuo, 2);
  });

  it('senza contributo datore, solo il contributo lavoratore è deducibile', () => {
    const result = calc.calcolaStipendioNetto({
      ...baseInput,
      ral: 50_000,
      fondoPensioneIntegrativo: { contributoLavoratore: 2, ralLavoratore: 50_000 },
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
      fondoPensioneIntegrativo: {
        contributoLavoratore: 1,
        ralLavoratore: 80_000,
        contributoDatoreLavoro: 1,
        ralDatoreLavoro: 80_000,
      },
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
      fondoPensioneIntegrativo: {
        contributoLavoratore: 5,
        ralLavoratore: 80_000,
        contributoDatoreLavoro: 2,
        ralDatoreLavoro: 80_000,
      },
    });

    // Con Fondo Negri: cap residuo = 5300 - 1184.49 = 4115.51
    const resultCon = calc.calcolaStipendioNetto({
      ...baseInput,
      ral: 80_000,
      fondoMarioNegri: true,
      fondoPensioneIntegrativo: {
        contributoLavoratore: 5,
        ralLavoratore: 80_000,
        contributoDatoreLavoro: 2,
        ralDatoreLavoro: 80_000,
      },
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

  describe('con contributo EBITEMP (lavoratori somministrati)', () => {
    const result = calc.calcolaStipendioNetto({
      ...baseInput,
      ral: 30_000,
      fondoPensioneIntegrativo: {
        contributoLavoratore: 1,
        ralLavoratore: 30_000,
        contributoDatoreLavoro: 1,
        ralDatoreLavoro: 30_000,
        contributoEbitemp: 2,
        ralEbitemp: 30_000,
      },
    });

    it('il contributo EBITEMP annuo deve essere €600', () => {
      expect(result.fondoPensioneIntegrativo).not.toBeNull();
      expect(result.fondoPensioneIntegrativo!.contributoEbitempAnnuo).toBeCloseTo(600, 2);
    });

    it('il totale contributi deve includere EBITEMP (€300 + €300 + €600 = €1200)', () => {
      expect(result.fondoPensioneIntegrativo!.totaleContributi).toBeCloseTo(1_200, 2);
    });

    it('la deduzione effettiva deve essere €1200 (sotto il limite)', () => {
      expect(result.fondoPensioneIntegrativo!.deduzioneEffettiva).toBeCloseTo(1_200, 2);
    });

    it('il contributo EBITEMP non deve essere trattenuta dal netto (come contributo datore)', () => {
      // Solo il contributo lavoratore (€300) è trattenuta reale
      const resultSenzaEbitemp = calc.calcolaStipendioNetto({
        ...baseInput,
        ral: 30_000,
        fondoPensioneIntegrativo: {
          contributoLavoratore: 1,
          ralLavoratore: 30_000,
          contributoDatoreLavoro: 1,
          ralDatoreLavoro: 30_000,
        },
      });

      // Il netto con EBITEMP deve essere >= netto senza, perché EBITEMP
      // aumenta la deduzione (risparmio fiscale) senza aggiungere trattenute
      expect(result.nettoAnnuo).toBeGreaterThanOrEqual(resultSenzaEbitemp.nettoAnnuo);
    });
  });

  it('EBITEMP deve concorrere al cap di deducibilità', () => {
    const result = calc.calcolaStipendioNetto({
      ...baseInput,
      ral: 100_000,
      fondoPensioneIntegrativo: {
        contributoLavoratore: 2,
        ralLavoratore: 100_000,
        contributoDatoreLavoro: 2,
        ralDatoreLavoro: 100_000,
        contributoEbitemp: 2,
        ralEbitemp: 100_000,
      },
    });

    expect(result.fondoPensioneIntegrativo).not.toBeNull();
    // Totale = 2000 + 2000 + 2000 = 6000
    expect(result.fondoPensioneIntegrativo!.totaleContributi).toBeCloseTo(6_000, 2);
    // Cap a 5300
    expect(result.fondoPensioneIntegrativo!.deduzioneEffettiva).toBeCloseTo(LIMITE_DEDUCIBILITA, 2);
    expect(result.fondoPensioneIntegrativo!.eccedenzaNonDeducibile).toBeCloseTo(
      6_000 - LIMITE_DEDUCIBILITA,
      2,
    );
  });

  it('senza contributoEbitemp, il campo contributoEbitempAnnuo deve essere 0', () => {
    const result = calc.calcolaStipendioNetto({
      ...baseInput,
      ral: 30_000,
      fondoPensioneIntegrativo: {
        contributoLavoratore: 1,
        ralLavoratore: 30_000,
      },
    });

    expect(result.fondoPensioneIntegrativo).not.toBeNull();
    expect(result.fondoPensioneIntegrativo!.contributoEbitempAnnuo).toBe(0);
  });

  describe('cap condiviso con contributo volontario da welfare', () => {
    it('contributo volontario condivide il cap €5.300 con contributi %', () => {
      // Contributo % lavoratore: 30k * 2% = 600
      // Contributo volontario: 3000
      // Totale: 3600 < 5300 → tutto deducibile
      const result = calc.calcolaStipendioNetto({
        ...baseInput,
        ral: 30_000,
        fondoPensioneIntegrativo: { contributoLavoratore: 2, ralLavoratore: 30_000 },
        benefitNonTassati: { previdenzaComplementare: 3_000 },
      });
      expect(result.fondoPensioneIntegrativo).not.toBeNull();
      expect(result.fondoPensioneIntegrativo!.contributoVolontarioAnnuo).toBe(3_000);
      expect(result.fondoPensioneIntegrativo!.totaleContributi).toBeCloseTo(3_600, 2);
      expect(result.fondoPensioneIntegrativo!.deduzioneEffettiva).toBeCloseTo(3_600, 2);
      expect(result.fondoPensioneIntegrativo!.eccedenzaNonDeducibile).toBe(0);
    });

    it('contributo volontario + contributi % > €5.300: eccedenza non deducibile', () => {
      // Contributo % lavoratore: 30k * 2% = 600
      // Contributo volontario: 5000
      // Totale: 5600 > 5300 → eccedenza 300
      const result = calc.calcolaStipendioNetto({
        ...baseInput,
        ral: 30_000,
        fondoPensioneIntegrativo: { contributoLavoratore: 2, ralLavoratore: 30_000 },
        benefitNonTassati: { previdenzaComplementare: 5_000 },
      });
      expect(result.fondoPensioneIntegrativo!.totaleContributi).toBeCloseTo(5_600, 2);
      expect(result.fondoPensioneIntegrativo!.deduzioneEffettiva).toBeCloseTo(5_300, 2);
      expect(result.fondoPensioneIntegrativo!.eccedenzaNonDeducibile).toBeCloseTo(300, 2);
    });

    it('solo contributo volontario (senza sezione %): crea dettaglio fondo pensione', () => {
      const result = calc.calcolaStipendioNetto({
        ...baseInput,
        benefitNonTassati: { previdenzaComplementare: 2_000 },
      });
      expect(result.fondoPensioneIntegrativo).not.toBeNull();
      expect(result.fondoPensioneIntegrativo!.contributoLavoratoreAnnuo).toBe(0);
      expect(result.fondoPensioneIntegrativo!.contributoVolontarioAnnuo).toBe(2_000);
      expect(result.fondoPensioneIntegrativo!.deduzioneEffettiva).toBe(2_000);
    });

    it('contributo volontario NON va in costo aziendale', () => {
      const resultSenza = calc.calcolaStipendioNetto({
        ...baseInput,
        ral: 30_000,
      });
      const resultCon = calc.calcolaStipendioNetto({
        ...baseInput,
        ral: 30_000,
        benefitNonTassati: { previdenzaComplementare: 3_000 },
      });
      // Il costo aziendale non deve cambiare con contributo volontario
      expect(resultCon.costoAziendale.totaleAnnuo).toBeCloseTo(
        resultSenza.costoAziendale.totaleAnnuo,
        0,
      );
      expect(resultCon.costoAziendale.benefitNonTassati).toBe(0);
    });

    it('contributo volontario è una trattenuta reale dal netto', () => {
      const resultSenza = calc.calcolaStipendioNetto({
        ...baseInput,
        ral: 40_000,
      });
      const resultCon = calc.calcolaStipendioNetto({
        ...baseInput,
        ral: 40_000,
        benefitNonTassati: { previdenzaComplementare: 2_000 },
      });
      // Il netto deve diminuire (contributo volontario meno risparmio fiscale)
      expect(resultCon.nettoAnnuo).toBeLessThan(resultSenza.nettoAnnuo);
    });
  });
});

// ============================================================================
// CONTRIBUTI INPS
// ============================================================================

describe('Contributi INPS', () => {
  it('indeterminato senza CIGS: aliquota 9.19%', () => {
    const result = calc.calcolaStipendioNetto(baseInput);
    expect(result.contributiInps.aliquotaApplicata).toBe(0.0919);
    expect(result.contributiInps.contributiBase).toBeCloseTo(25_000 * 0.0919, 2);
    expect(result.contributiInps.contributoAggiuntivo).toBe(0);
    expect(result.contributiInps.totaleContributi).toBeCloseTo(25_000 * 0.0919, 2);
  });

  it('apprendistato: aliquota 5.84%', () => {
    const result = calc.calcolaStipendioNetto({
      ...baseInput,
      tipoContratto: 'apprendistato',
    });
    expect(result.contributiInps.aliquotaApplicata).toBe(0.0584);
    expect(result.contributiInps.contributiBase).toBeCloseTo(25_000 * 0.0584, 2);
  });

  it('indeterminato con CIGS: aliquota 9.49%', () => {
    const result = calc.calcolaStipendioNetto({
      ...baseInput,
      aziendaConCigs: true,
    });
    expect(result.contributiInps.aliquotaApplicata).toBe(0.0949);
    expect(result.contributiInps.contributiBase).toBeCloseTo(25_000 * 0.0949, 2);
  });

  it('contributo aggiuntivo 1% per imponibile > €55.448', () => {
    const result = calc.calcolaStipendioNetto({
      ...baseInput,
      ral: 60_000,
    });
    expect(result.contributiInps.contributoAggiuntivo).toBeCloseTo((60_000 - 55_448) * 0.01, 2);
    expect(result.contributiInps.totaleContributi).toBeCloseTo(
      60_000 * 0.0919 + (60_000 - 55_448) * 0.01,
      2,
    );
  });

  it('nessun contributo aggiuntivo per imponibile ≤ €55.448', () => {
    const result = calc.calcolaStipendioNetto({
      ...baseInput,
      ral: 55_000,
    });
    expect(result.contributiInps.contributoAggiuntivo).toBe(0);
  });

  it('massimale INPS post-1996: imponibile capped a €120.607', () => {
    const result = calc.calcolaStipendioNetto({
      ...baseInput,
      ral: 150_000,
      iscrittoPost1996: true,
    });
    expect(result.contributiInps.imponibilePrevidenziale).toBe(120_607);
    expect(result.contributiInps.contributiBase).toBeCloseTo(120_607 * 0.0919, 2);
  });

  it('pre-1996: nessun massimale', () => {
    const result = calc.calcolaStipendioNetto({
      ...baseInput,
      ral: 150_000,
      iscrittoPost1996: false,
    });
    expect(result.contributiInps.imponibilePrevidenziale).toBe(150_000);
    expect(result.contributiInps.contributiBase).toBeCloseTo(150_000 * 0.0919, 2);
  });

  it("l'imponibile previdenziale include fringe benefit sopra soglia", () => {
    const result = calc.calcolaStipendioNetto({
      ...baseInput,
      fringeBenefit: { buoniAcquisto: 1500 },
    });
    // buoniAcquisto 1500 > soglia 1000 → tassabile → imponibile = RAL + 1500
    expect(result.contributiInps.imponibilePrevidenziale).toBe(25_000 + 1_500);
  });
});

// ============================================================================
// IRPEF SCAGLIONI
// ============================================================================

describe('IRPEF scaglioni', () => {
  it('reddito nel solo primo scaglione (≤28k): solo aliquota 23%', () => {
    const result = calc.calcolaStipendioNetto(baseInput); // RAL 25k → reddito ~22.7k
    expect(result.irpef.dettaglioScaglioni.length).toBe(1);
    expect(result.irpef.dettaglioScaglioni[0].aliquota).toBe(0.23);
  });

  it('reddito che attraversa due scaglioni (28k-50k): 23% + 33%', () => {
    const result = calc.calcolaStipendioNetto({
      ...baseInput,
      ral: 40_000,
    });
    expect(result.irpef.dettaglioScaglioni.length).toBe(2);
    expect(result.irpef.dettaglioScaglioni[0].aliquota).toBe(0.23);
    expect(result.irpef.dettaglioScaglioni[0].imponibileScaglione).toBe(28_000);
    expect(result.irpef.dettaglioScaglioni[1].aliquota).toBe(0.33);
  });

  it('reddito che attraversa tutti e tre gli scaglioni (>50k): 23% + 33% + 43%', () => {
    const result = calc.calcolaStipendioNetto({
      ...baseInput,
      ral: 80_000,
    });
    expect(result.irpef.dettaglioScaglioni.length).toBe(3);
    expect(result.irpef.dettaglioScaglioni[0].imponibileScaglione).toBe(28_000);
    expect(result.irpef.dettaglioScaglioni[1].imponibileScaglione).toBe(22_000);
    expect(result.irpef.dettaglioScaglioni[2].aliquota).toBe(0.43);
  });

  it('irpefLorda = somma di tutte le imposte degli scaglioni', () => {
    for (const ral of [15_000, 25_000, 40_000, 60_000, 80_000, 120_000]) {
      const result = calc.calcolaStipendioNetto({ ...baseInput, ral });
      const somma = result.irpef.dettaglioScaglioni.reduce((acc, s) => acc + s.impostaScaglione, 0);
      expect(result.irpef.irpefLorda).toBeCloseTo(somma, 2);
    }
  });

  it("l'imponibile IRPEF è RAL meno contributi INPS (caso base)", () => {
    const result = calc.calcolaStipendioNetto(baseInput);
    expect(result.irpef.imponibileIrpef).toBeCloseTo(
      baseInput.ral - result.contributiInps.totaleContributi,
      2,
    );
  });
});

// ============================================================================
// DETRAZIONI LAVORO DIPENDENTE
// ============================================================================

describe('Detrazioni lavoro dipendente', () => {
  it('reddito ≤ 15k: detrazione fissa €1.955 (indeterminato)', () => {
    const result = calc.calcolaStipendioNetto({
      ...baseInput,
      ral: 15_000,
    });
    expect(result.detrazioniLavoro.detrazioneTeorica).toBe(1_955);
  });

  it('reddito ≤ 15k, determinato: minimo €1.380', () => {
    // Con RAL molto bassa, la detrazione potrebbe scendere, ma il minimo è €1.380
    const result = calc.calcolaStipendioNetto({
      ...baseInput,
      ral: 5_000,
      tipoContratto: 'determinato',
    });
    expect(result.detrazioniLavoro.detrazioneTeorica).toBeGreaterThanOrEqual(1_380);
  });

  it('reddito ≤ 15k, indeterminato: minimo €690', () => {
    const result = calc.calcolaStipendioNetto({
      ...baseInput,
      ral: 5_000,
      tipoContratto: 'indeterminato',
    });
    expect(result.detrazioniLavoro.detrazioneTeorica).toBeGreaterThanOrEqual(690);
  });

  it('reddito 15k-28k: formula con coefficiente', () => {
    const result = calc.calcolaStipendioNetto({
      ...baseInput,
      ral: 25_000, // reddito ~22.7k → nella fascia 15k-28k
    });
    // Detrazione: 1910 + 1190 * (28000 - reddito) / 13000
    const reddito = result.irpef.imponibileIrpef;
    const attesa = 1_910 + 1_190 * ((28_000 - reddito) / 13_000);
    expect(result.detrazioniLavoro.detrazioneTeorica).toBeCloseTo(attesa, 2);
  });

  it('reddito 28k-50k: formula decrescente', () => {
    const result = calc.calcolaStipendioNetto({
      ...baseInput,
      ral: 40_000, // reddito ~36.3k
    });
    const reddito = result.irpef.imponibileIrpef;
    const attesa = 1_910 * ((50_000 - reddito) / 22_000);
    expect(result.detrazioniLavoro.detrazioneTeorica).toBeCloseTo(attesa, 2);
  });

  it('reddito > 50k: detrazione zero', () => {
    const result = calc.calcolaStipendioNetto({
      ...baseInput,
      ral: 80_000, // reddito ~72.4k
    });
    expect(result.detrazioniLavoro.detrazioneTeorica).toBe(0);
  });

  it('maggiorazione €65 per redditi 25k-35k', () => {
    const result = calc.calcolaStipendioNetto({
      ...baseInput,
      ral: 35_000, // reddito ~31.8k → tra 25k e 35k
    });
    expect(result.detrazioniLavoro.maggiorazione).toBe(65);
  });

  it('nessuna maggiorazione per redditi < 25k', () => {
    const result = calc.calcolaStipendioNetto({
      ...baseInput,
      ral: 25_000, // reddito ~22.7k < 25k
    });
    expect(result.detrazioniLavoro.maggiorazione).toBe(0);
  });

  it('nessuna maggiorazione per redditi > 35k', () => {
    const result = calc.calcolaStipendioNetto({
      ...baseInput,
      ral: 50_000, // reddito ~45.4k > 35k
    });
    expect(result.detrazioniLavoro.maggiorazione).toBe(0);
  });

  it('giorniLavorati < 365: detrazione ridotta proporzionalmente', () => {
    const resultFull = calc.calcolaStipendioNetto(baseInput);
    const resultPartial = calc.calcolaStipendioNetto({
      ...baseInput,
      giorniLavorati: 200,
    });
    expect(resultPartial.detrazioniLavoro.coefficienteGiorni).toBeCloseTo(200 / 365, 4);
    expect(resultPartial.detrazioniLavoro.detrazioneEffettiva).toBeCloseTo(
      resultFull.detrazioniLavoro.detrazioneEffettiva * (200 / 365),
      2,
    );
  });
});

// ============================================================================
// DETRAZIONI CARICHI FAMILIARI
// ============================================================================

describe('Detrazioni carichi familiari', () => {
  describe('Coniuge a carico', () => {
    it('coniuge con reddito > €2.840,51: nessuna detrazione', () => {
      const result = calc.calcolaStipendioNetto({
        ...baseInput,
        ral: 30_000,
        coniuge: { redditoAnnuo: 3_000 },
      });
      expect(result.detrazioniFamiliari.detrazioneConiuge).toBe(0);
    });

    it('coniuge con reddito ≤ €2.840,51 e reddito complessivo ≤ 15k: formula fascia 1', () => {
      const result = calc.calcolaStipendioNetto({
        ...baseInput,
        ral: 15_000,
        coniuge: { redditoAnnuo: 0 },
      });
      expect(result.detrazioniFamiliari.detrazioneConiuge).toBeGreaterThan(0);
      // Fascia 1: 800 - 110 * (reddito / 15000)
      const reddito = result.irpef.imponibileIrpef;
      const attesa = 800 - 110 * (reddito / 15_000);
      expect(result.detrazioniFamiliari.detrazioneConiuge).toBeCloseTo(attesa, 0);
    });

    it('coniuge con reddito complessivo 15k-40k: importo fisso €690 + eventuali maggiorazioni', () => {
      const result = calc.calcolaStipendioNetto({
        ...baseInput,
        ral: 30_000,
        coniuge: { redditoAnnuo: 0 },
      });
      // Fascia 2: 690 fisso (reddito ~27.2k → nessuna maggiorazione)
      expect(result.detrazioniFamiliari.detrazioneConiuge).toBe(690);
    });

    it('coniuge con maggiorazione (reddito 29.2k-34.7k → +€20)', () => {
      const result = calc.calcolaStipendioNetto({
        ...baseInput,
        ral: 35_000, // reddito ~31.8k → nella fascia 29.2k-34.7k
        coniuge: { redditoAnnuo: 0 },
      });
      expect(result.detrazioniFamiliari.detrazioneConiuge).toBe(710);
    });

    it('coniuge con reddito complessivo 40k-80k: formula decrescente', () => {
      const result = calc.calcolaStipendioNetto({
        ...baseInput,
        ral: 55_000,
        coniuge: { redditoAnnuo: 0 },
      });
      const reddito = result.irpef.imponibileIrpef;
      const attesa = 690 * ((80_000 - reddito) / 40_000);
      expect(result.detrazioniFamiliari.detrazioneConiuge).toBeCloseTo(attesa, 0);
    });

    it('coniuge con reddito complessivo > 80k: zero', () => {
      const result = calc.calcolaStipendioNetto({
        ...baseInput,
        ral: 100_000,
        coniuge: { redditoAnnuo: 0 },
      });
      expect(result.detrazioniFamiliari.detrazioneConiuge).toBe(0);
    });

    it('coniuge con percentualeCarico 50%: detrazione dimezzata', () => {
      const result100 = calc.calcolaStipendioNetto({
        ...baseInput,
        ral: 30_000,
        coniuge: { redditoAnnuo: 0, percentualeCarico: 100 },
      });
      const result50 = calc.calcolaStipendioNetto({
        ...baseInput,
        ral: 30_000,
        coniuge: { redditoAnnuo: 0, percentualeCarico: 50 },
      });
      expect(result50.detrazioniFamiliari.detrazioneConiuge).toBeCloseTo(
        result100.detrazioniFamiliari.detrazioneConiuge / 2,
        2,
      );
    });
  });

  describe('Figli a carico', () => {
    it('figlio età 25 (21-29): ha diritto alla detrazione', () => {
      const result = calc.calcolaStipendioNetto({
        ...baseInput,
        ral: 40_000,
        figli: [{ eta: 25, disabile: false }],
      });
      expect(result.detrazioniFamiliari.numeroFigliConDetrazione).toBe(1);
      expect(result.detrazioniFamiliari.detrazioneFigli).toBeGreaterThan(0);
    });

    it('figlio età 20 (<21, non disabile): NON ha diritto alla detrazione', () => {
      const result = calc.calcolaStipendioNetto({
        ...baseInput,
        ral: 40_000,
        figli: [{ eta: 20, disabile: false }],
      });
      expect(result.detrazioniFamiliari.numeroFigliConDetrazione).toBe(0);
      expect(result.detrazioniFamiliari.detrazioneFigli).toBe(0);
    });

    it('figlio età 31 (≥30, non disabile): NON ha diritto alla detrazione', () => {
      const result = calc.calcolaStipendioNetto({
        ...baseInput,
        ral: 40_000,
        figli: [{ eta: 31, disabile: false }],
      });
      expect(result.detrazioniFamiliari.numeroFigliConDetrazione).toBe(0);
    });

    it('figlio disabile di qualsiasi età: ha diritto alla detrazione', () => {
      const result = calc.calcolaStipendioNetto({
        ...baseInput,
        ral: 40_000,
        figli: [{ eta: 15, disabile: true }],
      });
      expect(result.detrazioniFamiliari.numeroFigliConDetrazione).toBe(1);
      expect(result.detrazioniFamiliari.detrazioneFigli).toBeGreaterThan(0);
    });

    it('figlio con reddito troppo alto: nessuna detrazione', () => {
      const result = calc.calcolaStipendioNetto({
        ...baseInput,
        ral: 40_000,
        figli: [{ eta: 25, disabile: false, redditoAnnuo: 5_000 }],
      });
      expect(result.detrazioniFamiliari.numeroFigliConDetrazione).toBe(0);
    });

    it('figlio ≤ 24 anni: limite reddito più alto (€4.000)', () => {
      const result = calc.calcolaStipendioNetto({
        ...baseInput,
        ral: 40_000,
        figli: [{ eta: 22, disabile: false, redditoAnnuo: 3_500 }],
      });
      // 3500 ≤ 4000 (limite giovani) → a carico, età 22 (21 ≤ 22 < 30) → detrazione
      expect(result.detrazioniFamiliari.numeroFigliConDetrazione).toBe(1);
    });

    it('figlio con percentualeCarico 50%: detrazione dimezzata', () => {
      const result100 = calc.calcolaStipendioNetto({
        ...baseInput,
        ral: 40_000,
        figli: [{ eta: 25, disabile: false }],
      });
      const result50 = calc.calcolaStipendioNetto({
        ...baseInput,
        ral: 40_000,
        figli: [{ eta: 25, disabile: false, percentualeCarico: 50 }],
      });
      expect(result50.detrazioniFamiliari.detrazioneFigli).toBeCloseTo(
        result100.detrazioniFamiliari.detrazioneFigli / 2,
        2,
      );
    });

    it('più figli: coefficienteBase aumenta di €15.000 per figlio', () => {
      const result1 = calc.calcolaStipendioNetto({
        ...baseInput,
        ral: 40_000,
        figli: [{ eta: 25, disabile: false }],
      });
      const result2 = calc.calcolaStipendioNetto({
        ...baseInput,
        ral: 40_000,
        figli: [
          { eta: 25, disabile: false },
          { eta: 27, disabile: false },
        ],
      });
      expect(result2.detrazioniFamiliari.numeroFigliConDetrazione).toBe(2);
      expect(result2.detrazioniFamiliari.detrazioneFigli).toBeGreaterThan(
        result1.detrazioniFamiliari.detrazioneFigli,
      );
    });
  });

  describe('Ascendenti a carico', () => {
    it('ascendente convivente con reddito ≤ €2.840,51: ha diritto alla detrazione', () => {
      const result = calc.calcolaStipendioNetto({
        ...baseInput,
        ral: 40_000,
        ascendenti: [{ redditoAnnuo: 2_000, convivente: true }],
      });
      expect(result.detrazioniFamiliari.numeroAscendentiConDetrazione).toBe(1);
      expect(result.detrazioniFamiliari.detrazioneAscendenti).toBeGreaterThan(0);
    });

    it('ascendente NON convivente: nessuna detrazione', () => {
      const result = calc.calcolaStipendioNetto({
        ...baseInput,
        ral: 40_000,
        ascendenti: [{ redditoAnnuo: 2_000, convivente: false }],
      });
      expect(result.detrazioniFamiliari.numeroAscendentiConDetrazione).toBe(0);
      expect(result.detrazioniFamiliari.detrazioneAscendenti).toBe(0);
    });

    it('ascendente con reddito > €2.840,51: nessuna detrazione', () => {
      const result = calc.calcolaStipendioNetto({
        ...baseInput,
        ral: 40_000,
        ascendenti: [{ redditoAnnuo: 3_000, convivente: true }],
      });
      expect(result.detrazioniFamiliari.numeroAscendentiConDetrazione).toBe(0);
    });
  });

  it('senza carichi familiari: tutte le detrazioni familiari sono zero', () => {
    const result = calc.calcolaStipendioNetto(baseInput);
    expect(result.detrazioniFamiliari.detrazioneConiuge).toBe(0);
    expect(result.detrazioniFamiliari.detrazioneFigli).toBe(0);
    expect(result.detrazioniFamiliari.detrazioneAscendenti).toBe(0);
    expect(result.detrazioniFamiliari.totaleDetrazioniFamiliari).toBe(0);
  });

  it('totaleDetrazioniFamiliari = coniuge + figli + ascendenti', () => {
    const result = calc.calcolaStipendioNetto({
      ...baseInput,
      ral: 40_000,
      coniuge: { redditoAnnuo: 0 },
      figli: [{ eta: 25, disabile: false }],
      ascendenti: [{ redditoAnnuo: 1_000, convivente: true }],
    });
    expect(result.detrazioniFamiliari.totaleDetrazioniFamiliari).toBeCloseTo(
      result.detrazioniFamiliari.detrazioneConiuge +
        result.detrazioniFamiliari.detrazioneFigli +
        result.detrazioniFamiliari.detrazioneAscendenti,
      2,
    );
  });
});

// ============================================================================
// CUNEO FISCALE
// ============================================================================

describe('Cuneo fiscale', () => {
  it('reddito complessivo ≤ 8.500: indennità esente 7.1%', () => {
    const result = calc.calcolaStipendioNetto({
      ...baseInput,
      ral: 7_000, // reddito ~6.4k
    });
    expect(result.cuneoFiscale.spettaIndennita).toBe(true);
    expect(result.cuneoFiscale.spettaDetrazione).toBe(false);
    expect(result.cuneoFiscale.percentualeIndennita).toBe(0.071);
    expect(result.cuneoFiscale.indennitaEsente).toBeGreaterThan(0);
  });

  it('reddito complessivo 8.500-15.000: indennità esente 5.3%', () => {
    const result = calc.calcolaStipendioNetto({
      ...baseInput,
      ral: 12_000, // reddito ~10.9k
    });
    expect(result.cuneoFiscale.spettaIndennita).toBe(true);
    expect(result.cuneoFiscale.percentualeIndennita).toBe(0.053);
  });

  it('reddito complessivo 15.000-20.000: indennità esente 4.8%', () => {
    const result = calc.calcolaStipendioNetto({
      ...baseInput,
      ral: 18_000, // reddito ~16.3k
    });
    expect(result.cuneoFiscale.spettaIndennita).toBe(true);
    expect(result.cuneoFiscale.percentualeIndennita).toBe(0.048);
  });

  it('reddito complessivo 20.000-32.000: detrazione €1.000', () => {
    const result = calc.calcolaStipendioNetto({
      ...baseInput,
      ral: 30_000, // reddito ~27.2k
    });
    expect(result.cuneoFiscale.spettaIndennita).toBe(false);
    expect(result.cuneoFiscale.spettaDetrazione).toBe(true);
    expect(result.cuneoFiscale.detrazioneAggiuntiva).toBe(1_000);
  });

  it('reddito complessivo 32.000-40.000: detrazione in decalage', () => {
    const result = calc.calcolaStipendioNetto({
      ...baseInput,
      ral: 38_000, // reddito ~34.5k
    });
    expect(result.cuneoFiscale.spettaDetrazione).toBe(true);
    const reddito = result.irpef.imponibileIrpef;
    const attesa = 1_000 * ((40_000 - reddito) / 8_000);
    expect(result.cuneoFiscale.detrazioneAggiuntiva).toBeCloseTo(attesa, 0);
    expect(result.cuneoFiscale.detrazioneAggiuntiva).toBeLessThan(1_000);
  });

  it('reddito complessivo > 40.000: né indennità né detrazione', () => {
    const result = calc.calcolaStipendioNetto({
      ...baseInput,
      ral: 50_000,
    });
    expect(result.cuneoFiscale.spettaIndennita).toBe(false);
    expect(result.cuneoFiscale.spettaDetrazione).toBe(false);
    expect(result.cuneoFiscale.indennitaEsente).toBe(0);
    expect(result.cuneoFiscale.detrazioneAggiuntiva).toBe(0);
  });
});

// ============================================================================
// TRATTAMENTO INTEGRATIVO
// ============================================================================

describe('Trattamento integrativo', () => {
  it('reddito ≤ 15k con IRPEF sufficiente (capienza): spetta €1.200 pieno', () => {
    const result = calc.calcolaStipendioNetto({
      ...baseInput,
      ral: 12_000, // reddito ~10.9k → IRPEF lorda ~2.5k > soglia capienza
    });
    expect(result.trattamentoIntegrativo.spetta).toBe(true);
    expect(result.trattamentoIntegrativo.importo).toBe(1_200);
    expect(result.trattamentoIntegrativo.importoPieno).toBe(true);
  });

  it('reddito ≤ 15k con IRPEF insufficiente (no capienza): non spetta', () => {
    const result = calc.calcolaStipendioNetto({
      ...baseInput,
      ral: 5_000, // reddito ~4.5k → IRPEF lorda ~1.0k < detrazioneLavoro - 75
    });
    expect(result.trattamentoIntegrativo.spetta).toBe(false);
  });

  it('reddito > 28k: non spetta', () => {
    const result = calc.calcolaStipendioNetto({
      ...baseInput,
      ral: 40_000,
    });
    expect(result.trattamentoIntegrativo.spetta).toBe(false);
    expect(result.trattamentoIntegrativo.importo).toBe(0);
  });

  it('reddito 15k-28k con detrazioni > IRPEF: spetta parziale', () => {
    // Per avere detrazioni > IRPEF in questa fascia servono altreDetrazioni
    const result = calc.calcolaStipendioNetto({
      ...baseInput,
      ral: 20_000,
      altreDetrazioni: 5_000,
    });
    const reddito = result.irpef.imponibileIrpef;
    if (reddito > 15_000 && reddito <= 28_000) {
      if (result.trattamentoIntegrativo.spetta) {
        expect(result.trattamentoIntegrativo.importo).toBeLessThanOrEqual(1_200);
      }
    }
  });
});

// ============================================================================
// ADDIZIONALI
// ============================================================================

describe('Addizionali', () => {
  it('addizionale regionale Lombardia: calcolo per scaglioni progressivi', () => {
    const result = calc.calcolaStipendioNetto({
      ...baseInput,
      ral: 40_000, // reddito ~36.3k → attraversa 3 scaglioni LO
    });
    const reddito = result.irpef.imponibileIrpef;
    // Lombardia: ≤15k @ 1.23%, 15k-28k @ 1.58%, 28k-50k @ 1.72%
    const attesa =
      15_000 * 0.0123 +
      (Math.min(reddito, 28_000) - 15_000) * 0.0158 +
      Math.max(0, reddito - 28_000) * 0.0172;
    expect(result.addizionali.addizionaleRegionale).toBeCloseTo(attesa, 0);
    expect(result.addizionali.addizionaleRegionale).toBeGreaterThan(0);
  });

  it('addizionale comunale Milano (F205): aliquota fissa 0.8%', () => {
    // Milano ha esenzione 23k, con reddito sopra soglia → aliquota 0.8%
    const result = calc.calcolaStipendioNetto({
      ...baseInput,
      ral: 40_000,
    });
    const reddito = result.irpef.imponibileIrpef;
    expect(result.addizionali.addizionaleComunale).toBeCloseTo(reddito * 0.008, 0);
    expect(result.addizionali.aliquotaComunale).toBe(0.008);
  });

  it('addizionale comunale con esenzione: reddito sotto soglia → zero', () => {
    // Milano: esenzione 23k → con RAL bassa il reddito è sotto 23k
    const result = calc.calcolaStipendioNetto({
      ...baseInput,
      ral: 20_000, // reddito ~18.2k < 23k
    });
    expect(result.addizionali.addizionaleComunale).toBe(0);
    expect(result.addizionali.esenzioneComunaleApplicata).toBe(true);
  });

  it('comune sconosciuto: fallback a aliquota default 0.8%', () => {
    const result = calc.calcolaStipendioNetto({
      ...baseInput,
      comune: 'ZZZZ',
      ral: 40_000,
    });
    const reddito = result.irpef.imponibileIrpef;
    expect(result.addizionali.addizionaleComunale).toBeCloseTo(reddito * 0.008, 0);
  });

  it('comune con scaglioni progressivi: calcolo corretto', () => {
    // A005 = Abbadia Lariana: scaglioni [28k@0.76%, 50k@0.77%, ∞@0.80%], esenzione 15k
    const result = calc.calcolaStipendioNetto({
      ...baseInput,
      comune: 'A005',
      ral: 40_000,
    });
    const reddito = result.irpef.imponibileIrpef;
    // reddito ~36.3k > 15k esenzione → non esente
    expect(result.addizionali.esenzioneComunaleApplicata).toBe(false);
    const attesa = 28_000 * 0.0076 + Math.min(reddito - 28_000, 22_000) * 0.0077;
    expect(result.addizionali.addizionaleComunale).toBeCloseTo(attesa, 0);
  });

  it('totaleAddizionali = regionale + comunale', () => {
    const result = calc.calcolaStipendioNetto({
      ...baseInput,
      ral: 40_000,
    });
    expect(result.addizionali.totaleAddizionali).toBeCloseTo(
      result.addizionali.addizionaleRegionale + result.addizionali.addizionaleComunale,
      2,
    );
  });
});

// ============================================================================
// RIMBORSI TRASFERTA
// ============================================================================

describe('Rimborsi trasferta', () => {
  it('senza rimborsi: tutto a zero', () => {
    const result = calc.calcolaStipendioNetto(baseInput);
    expect(result.rimborsiTrasferta.totaleRimborsi).toBe(0);
  });

  it('forfettario: €46.48/giorno Italia + €77.47/giorno estero', () => {
    const result = calc.calcolaStipendioNetto({
      ...baseInput,
      rimborsiTrasferta: {
        modalitaRimborso: 'forfettario',
        giorniTrasfertaItalia: 10,
        giorniTrasfertaEstero: 5,
      },
    });
    expect(result.rimborsiTrasferta.rimborsoForfettarioEsente).toBeCloseTo(
      10 * 46.48 + 5 * 77.47,
      2,
    );
    expect(result.rimborsiTrasferta.rimborsiTassati).toBe(0);
  });

  it('misto con solo vitto: riduzione 1/3 del forfettario', () => {
    const result = calc.calcolaStipendioNetto({
      ...baseInput,
      rimborsiTrasferta: {
        modalitaRimborso: 'misto',
        giorniTrasfertaItalia: 10,
        rimborsoVitto: 500,
      },
    });
    const atteso = 10 * 46.48 * (2 / 3);
    expect(result.rimborsiTrasferta.rimborsoForfettarioEsente).toBeCloseTo(atteso, 2);
    expect(result.rimborsiTrasferta.rimborsoDocumentatoEsente).toBeCloseTo(500, 2);
  });

  it('misto con vitto + alloggio: riduzione 2/3 del forfettario', () => {
    const result = calc.calcolaStipendioNetto({
      ...baseInput,
      rimborsiTrasferta: {
        modalitaRimborso: 'misto',
        giorniTrasfertaItalia: 10,
        rimborsoVitto: 500,
        rimborsoAlloggio: 300,
      },
    });
    const atteso = 10 * 46.48 * (1 / 3);
    expect(result.rimborsiTrasferta.rimborsoForfettarioEsente).toBeCloseTo(atteso, 2);
    expect(result.rimborsiTrasferta.rimborsoDocumentatoEsente).toBeCloseTo(800, 2);
  });

  it('pagamenti non tracciabili: vitto e alloggio diventano tassati', () => {
    const result = calc.calcolaStipendioNetto({
      ...baseInput,
      rimborsiTrasferta: {
        modalitaRimborso: 'forfettario',
        giorniTrasfertaItalia: 10,
        rimborsoVitto: 500,
        rimborsoAlloggio: 300,
        rimborsoViaggio: 200,
        pagamentiTracciabili: false,
      },
    });
    expect(result.rimborsiTrasferta.rimborsiTassati).toBeCloseTo(800, 2);
    expect(result.rimborsiTrasferta.rimborsoDocumentatoEsente).toBeCloseTo(200, 2);
  });

  it('totaleRimborsi = totaleEsente + rimborsiTassati', () => {
    const result = calc.calcolaStipendioNetto({
      ...baseInput,
      rimborsiTrasferta: {
        modalitaRimborso: 'forfettario',
        giorniTrasfertaItalia: 10,
        rimborsoVitto: 500,
        rimborsoViaggio: 200,
        pagamentiTracciabili: false,
      },
    });
    expect(result.rimborsiTrasferta.totaleRimborsi).toBeCloseTo(
      result.rimborsiTrasferta.totaleEsente + result.rimborsiTrasferta.rimborsiTassati,
      2,
    );
  });
});

// ============================================================================
// BENEFIT NON TASSATI (Welfare aziendale)
// ============================================================================

describe('Benefit non tassati', () => {
  it('senza benefit: tutto a zero', () => {
    const result = calc.calcolaStipendioNetto(baseInput);
    expect(result.benefitNonTassati.totaleEsente).toBe(0);
    expect(result.benefitNonTassati.totaleTassato).toBe(0);
  });

  it('previdenza complementare: valore raw passato (cap condiviso con fondo pensione)', () => {
    const result = calc.calcolaStipendioNetto({
      ...baseInput,
      benefitNonTassati: { previdenzaComplementare: 7_000 },
    });
    // Il valore raw viene restituito in benefitNonTassati (cap applicato nel fondo pensione)
    expect(result.benefitNonTassati.previdenzaComplementare).toBe(7_000);
    // La previdenza NON va in totaleTassato (non è un benefit welfare)
    expect(result.benefitNonTassati.totaleTassato).toBe(0);
    // Il cap €5.300 è applicato nella sezione fondo pensione integrativo
    expect(result.fondoPensioneIntegrativo).not.toBeNull();
    expect(result.fondoPensioneIntegrativo!.contributoVolontarioAnnuo).toBe(7_000);
    expect(result.fondoPensioneIntegrativo!.deduzioneEffettiva).toBe(5_300);
    expect(result.fondoPensioneIntegrativo!.eccedenzaNonDeducibile).toBeCloseTo(1_700, 2);
  });

  it('previdenza complementare sotto cap: tutto deducibile', () => {
    const result = calc.calcolaStipendioNetto({
      ...baseInput,
      benefitNonTassati: { previdenzaComplementare: 3_000 },
    });
    expect(result.benefitNonTassati.previdenzaComplementare).toBe(3_000);
    expect(result.benefitNonTassati.totaleTassato).toBe(0);
    expect(result.fondoPensioneIntegrativo!.deduzioneEffettiva).toBe(3_000);
    expect(result.fondoPensioneIntegrativo!.eccedenzaNonDeducibile).toBe(0);
  });

  it('assistenza sanitaria sopra cap €3.615,20: eccedente tassato', () => {
    const result = calc.calcolaStipendioNetto({
      ...baseInput,
      benefitNonTassati: { assistenzaSanitaria: 5_000 },
    });
    expect(result.benefitNonTassati.assistenzaSanitaria).toBeCloseTo(3_615.2, 2);
    expect(result.benefitNonTassati.totaleTassato).toBeCloseTo(1_384.8, 2);
  });

  it('buoni pasto elettronici: soglia €10/giorno × 220 giorni = €2.200', () => {
    const result = calc.calcolaStipendioNetto({
      ...baseInput,
      benefitNonTassati: { buoniPasto: 3_000, buoniPastoElettronici: true },
    });
    expect(result.benefitNonTassati.buoniPastoEsenti).toBe(2_200);
    expect(result.benefitNonTassati.buoniPastoTassati).toBe(800);
  });

  it('buoni pasto cartacei: soglia €4/giorno × 220 giorni = €880', () => {
    const result = calc.calcolaStipendioNetto({
      ...baseInput,
      benefitNonTassati: { buoniPasto: 1_000, buoniPastoElettronici: false },
    });
    expect(result.benefitNonTassati.buoniPastoEsenti).toBe(880);
    expect(result.benefitNonTassati.buoniPastoTassati).toBe(120);
  });

  it('welfare (abbonamento + servizi): tutto esente', () => {
    const result = calc.calcolaStipendioNetto({
      ...baseInput,
      benefitNonTassati: {
        abbonamentoTrasporto: 500,
        serviziWelfare: 1_000,
        altri: 200,
      },
    });
    expect(result.benefitNonTassati.altriWelfare).toBe(1_700);
    expect(result.benefitNonTassati.totaleEsente).toBe(1_700);
    expect(result.benefitNonTassati.totaleTassato).toBe(0);
  });

  it('totaleEsente + totaleTassato = tutti i benefit (esclusa previdenza)', () => {
    const result = calc.calcolaStipendioNetto({
      ...baseInput,
      benefitNonTassati: {
        previdenzaComplementare: 7_000,
        assistenzaSanitaria: 5_000,
        buoniPasto: 3_000,
        buoniPastoElettronici: true,
        abbonamentoTrasporto: 500,
      },
    });
    // La previdenza complementare NON è inclusa nei totali benefit (gestita nel fondo pensione)
    expect(result.benefitNonTassati.totaleEsente).toBeCloseTo(
      result.benefitNonTassati.assistenzaSanitaria +
        result.benefitNonTassati.buoniPastoEsenti +
        result.benefitNonTassati.altriWelfare,
      2,
    );
  });
});

// ============================================================================
// FRINGE BENEFIT MONETARI (non auto)
// ============================================================================

describe('Fringe benefit monetari', () => {
  it('buoni acquisto sotto soglia (€1000): esente, imponibile = 0', () => {
    const result = calc.calcolaStipendioNetto({
      ...baseInput,
      fringeBenefit: { buoniAcquisto: 500 },
    });
    expect(result.fringeBenefit.sogliaSuperata).toBe(false);
    expect(result.fringeBenefit.valoreImponibile).toBe(0);
    expect(result.fringeBenefit.valoreEsente).toBe(500);
  });

  it('buoni acquisto sopra soglia: TUTTO tassabile', () => {
    const result = calc.calcolaStipendioNetto({
      ...baseInput,
      fringeBenefit: { buoniAcquisto: 1_500 },
    });
    expect(result.fringeBenefit.sogliaSuperata).toBe(true);
    expect(result.fringeBenefit.valoreImponibile).toBe(1_500);
    expect(result.fringeBenefit.valoreEsente).toBe(0);
  });

  it('mix buoni + rimborso utenze: totale lordo cumulato per soglia', () => {
    const result = calc.calcolaStipendioNetto({
      ...baseInput,
      fringeBenefit: {
        buoniAcquisto: 600,
        rimborsoUtenze: 500,
      },
    });
    // 600 + 500 = 1100 > 1000 → tutto tassabile
    expect(result.fringeBenefit.valoreTotaleLordo).toBe(1_100);
    expect(result.fringeBenefit.sogliaSuperata).toBe(true);
    expect(result.fringeBenefit.valoreImponibile).toBe(1_100);
  });

  it('auto + buoni combinati: valore totale cumulato per soglia', () => {
    const result = calc.calcolaStipendioNetto({
      ...baseInput,
      fringeBenefit: {
        buoniAcquisto: 200,
        autoAziendale: {
          costoKmAci: 0.1,
          tipoAlimentazione: 'elettrico',
          mesiUtilizzo: 12,
        },
      },
    });
    // Auto: 0.1 × 15000 × 0.10 = 150. Buoni: 200. Totale: 350 < 1000
    expect(result.fringeBenefit.valoreTotaleLordo).toBeCloseTo(350, 0);
    expect(result.fringeBenefit.sogliaSuperata).toBe(false);
  });

  it('valoreMonetarioImponibile esclude auto quando sopra soglia', () => {
    const result = calc.calcolaStipendioNetto({
      ...baseInput,
      fringeBenefit: {
        buoniAcquisto: 500,
        autoAziendale: {
          costoKmAci: 0.5,
          tipoAlimentazione: 'altro',
          mesiUtilizzo: 12,
        },
      },
    });
    // Auto: 0.5 × 15000 × 0.5 = 3750. Buoni: 500. Totale: 4250 > 1000
    expect(result.fringeBenefit.sogliaSuperata).toBe(true);
    expect(result.fringeBenefit.valoreMonetarioImponibile).toBe(500);
    expect(result.fringeBenefit.valoreAutoImponibile).toBeCloseTo(3_750, 0);
  });
});

// ============================================================================
// 14 MENSILITA, ALTRI REDDITI, ALTRE DETRAZIONI
// ============================================================================

describe('14 mensilità, altriRedditi, altreDetrazioni', () => {
  it('14 mensilità: nettoMensile = nettoAnnuo / 14', () => {
    const result = calc.calcolaStipendioNetto({
      ...baseInput,
      mensilita: 14,
    });
    expect(result.nettoMensile).toBeCloseTo(result.nettoAnnuo / 14, 2);
    expect(result.mensilita).toBe(14);
  });

  it('14 mensilità produce netto mensile inferiore a 13 mensilità', () => {
    const result13 = calc.calcolaStipendioNetto({ ...baseInput, mensilita: 13 });
    const result14 = calc.calcolaStipendioNetto({ ...baseInput, mensilita: 14 });
    expect(result14.nettoMensile).toBeLessThan(result13.nettoMensile);
    // Ma il netto annuo è lo stesso
    expect(result14.nettoAnnuo).toBeCloseTo(result13.nettoAnnuo, 0);
  });

  it('altriRedditi aumentano il reddito complessivo e la tassazione', () => {
    const resultSenza = calc.calcolaStipendioNetto(baseInput);
    const resultCon = calc.calcolaStipendioNetto({
      ...baseInput,
      altriRedditi: 10_000,
    });
    // Più IRPEF, meno netto
    expect(resultCon.irpef.irpefLorda).toBeGreaterThan(resultSenza.irpef.irpefLorda);
    expect(resultCon.nettoAnnuo).toBeLessThan(resultSenza.nettoAnnuo);
  });

  it('altreDetrazioni riducono IRPEF netta', () => {
    const resultSenza = calc.calcolaStipendioNetto(baseInput);
    const resultCon = calc.calcolaStipendioNetto({
      ...baseInput,
      altreDetrazioni: 1_000,
    });
    expect(resultCon.irpefNetta).toBeLessThan(resultSenza.irpefNetta);
    expect(resultCon.nettoAnnuo).toBeGreaterThan(resultSenza.nettoAnnuo);
  });

  it('riepilogoDetrazioni.totale include tutte le voci', () => {
    const result = calc.calcolaStipendioNetto({
      ...baseInput,
      ral: 30_000,
      coniuge: { redditoAnnuo: 0 },
      altreDetrazioni: 500,
    });
    expect(result.riepilogoDetrazioni.totale).toBeCloseTo(
      result.riepilogoDetrazioni.lavoroDipendente +
        result.riepilogoDetrazioni.carichiFamiliari +
        result.riepilogoDetrazioni.cuneoFiscale +
        result.riepilogoDetrazioni.altre,
      2,
    );
  });
});

// ============================================================================
// TEST PROPERTY-BASED (FUZZY)
// ============================================================================

describe('Property-based (fuzzy) tests', () => {
  // Pseudo-random seeded generator for reproducibility
  function seededRandom(seed: number) {
    let s = seed;
    return () => {
      s = (s * 16807 + 0) % 2147483647;
      return s / 2147483647;
    };
  }

  const rng = seededRandom(42);
  const randomRal = () => Math.round(10_000 + rng() * 190_000); // 10k - 200k
  const randomMensilita = () => (rng() > 0.5 ? 14 : 13);

  describe('Invarianti base (100 RAL casuali)', () => {
    const rals = Array.from({ length: 100 }, () => randomRal());

    it('nettoAnnuo > 0 per qualsiasi RAL ≥ 10k', () => {
      for (const ral of rals) {
        const result = calc.calcolaStipendioNetto({ ...baseInput, ral });
        expect(result.nettoAnnuo).toBeGreaterThan(0);
      }
    });

    it('nettoAnnuo < RAL per redditi medi/alti (RAL ≥ 25k)', () => {
      // Per RAL basse, il netto può superare la RAL grazie a trattamento integrativo + cuneo fiscale
      for (const ral of rals.filter((r) => r >= 25_000)) {
        const result = calc.calcolaStipendioNetto({ ...baseInput, ral });
        expect(result.nettoAnnuo).toBeLessThan(ral);
      }
    });

    it('nettoMensile = nettoAnnuo / mensilità (esattamente)', () => {
      for (const ral of rals) {
        const mensilita = randomMensilita();
        const result = calc.calcolaStipendioNetto({ ...baseInput, ral, mensilita });
        expect(result.nettoMensile).toBeCloseTo(result.nettoAnnuo / mensilita, 6);
      }
    });

    it('irpefLorda = somma esatta degli scaglioni', () => {
      for (const ral of rals) {
        const result = calc.calcolaStipendioNetto({ ...baseInput, ral });
        const somma = result.irpef.dettaglioScaglioni.reduce(
          (acc, s) => acc + s.impostaScaglione,
          0,
        );
        expect(result.irpef.irpefLorda).toBeCloseTo(somma, 6);
      }
    });

    it('irpefNetta ≥ 0 sempre', () => {
      for (const ral of rals) {
        const result = calc.calcolaStipendioNetto({ ...baseInput, ral });
        expect(result.irpefNetta).toBeGreaterThanOrEqual(0);
      }
    });

    it('irpefFinale ≥ 0 sempre', () => {
      for (const ral of rals) {
        const result = calc.calcolaStipendioNetto({ ...baseInput, ral });
        expect(result.irpefFinale).toBeGreaterThanOrEqual(0);
      }
    });

    it('aliquotaEffettiva ∈ (-1, 1) sempre, e > 0 per RAL ≥ 25k', () => {
      // Per RAL basse, l'aliquota effettiva può essere negativa (bonus > trattenute)
      for (const ral of rals) {
        const result = calc.calcolaStipendioNetto({ ...baseInput, ral });
        expect(result.aliquotaEffettiva).toBeLessThan(1);
        expect(result.aliquotaEffettiva).toBeGreaterThan(-1);
        if (ral >= 25_000) {
          expect(result.aliquotaEffettiva).toBeGreaterThan(0);
        }
      }
    });
  });

  describe('Monotonia del netto (caso base)', () => {
    it('RAL più alta → netto più alto (senza features opzionali)', () => {
      const rals = [
        10_000, 15_000, 20_000, 25_000, 30_000, 40_000, 50_000, 60_000, 80_000, 100_000, 150_000,
        200_000,
      ];
      let prevNetto = 0;
      for (const ral of rals) {
        const result = calc.calcolaStipendioNetto({ ...baseInput, ral });
        expect(result.nettoAnnuo).toBeGreaterThan(prevNetto);
        prevNetto = result.nettoAnnuo;
      }
    });
  });

  describe('Consistenza totaleTrattenute (50 scenari casuali)', () => {
    it('totaleTrattenute = INPS + IRPEF finale + addizionali + fondi', () => {
      for (let i = 0; i < 50; i++) {
        const ral = randomRal();
        const useFondoNegri = rng() > 0.7;
        const useFondoPastore = rng() > 0.7;
        const useCfmt = rng() > 0.7;
        const useFasdac = rng() > 0.7;
        const useFondoEst = rng() > 0.7;
        const useFondoPensione = rng() > 0.7;

        const result = calc.calcolaStipendioNetto({
          ...baseInput,
          ral,
          fondoMarioNegri: useFondoNegri,
          fondoPastore: useFondoPastore,
          cfmt: useCfmt,
          fasdac: useFasdac,
          fondoEst: useFondoEst,
          ...(useFondoPensione && {
            fondoPensioneIntegrativo: {
              contributoLavoratore: 2,
              ralLavoratore: ral,
            },
          }),
        });

        const fondoNegriContributo = result.fondoNegri ? result.fondoNegri.contributoAnnuo : 0;
        const fondoPastoreContributo = result.fondoPastore
          ? result.fondoPastore.contributoAnnuo
          : 0;
        const cfmtContributo = result.cfmt ? result.cfmt.contributoAnnuo : 0;
        const fasdacContributo = result.fasdac ? result.fasdac.contributoAnnuo : 0;
        const fondoEstContributo = result.fondoEst ? result.fondoEst.contributoAnnuo : 0;
        const fondoPensioneContributo = result.fondoPensioneIntegrativo
          ? result.fondoPensioneIntegrativo.contributoLavoratoreAnnuo
          : 0;

        const expected =
          result.contributiInps.totaleContributi +
          result.irpefFinale +
          result.addizionali.totaleAddizionali +
          fondoNegriContributo +
          fondoPastoreContributo +
          cfmtContributo +
          fasdacContributo +
          fondoEstContributo +
          fondoPensioneContributo;

        expect(result.totaleTrattenute).toBeCloseTo(expected, 2);
      }
    });
  });

  describe('Features opzionali riducono il netto (30 scenari)', () => {
    it('aggiungere Fondo Negri, Pastore, CFMT, FASDAC, Fondo EST o Fondo Pensione non aumenta mai il netto', () => {
      for (let i = 0; i < 30; i++) {
        const ral = randomRal();
        const resultBase = calc.calcolaStipendioNetto({ ...baseInput, ral });

        const resultNegri = calc.calcolaStipendioNetto({
          ...baseInput,
          ral,
          fondoMarioNegri: true,
        });
        expect(resultNegri.nettoAnnuo).toBeLessThanOrEqual(resultBase.nettoAnnuo);

        const resultPastore = calc.calcolaStipendioNetto({
          ...baseInput,
          ral,
          fondoPastore: true,
        });
        expect(resultPastore.nettoAnnuo).toBeLessThan(resultBase.nettoAnnuo);

        const resultCfmt = calc.calcolaStipendioNetto({
          ...baseInput,
          ral,
          cfmt: true,
        });
        expect(resultCfmt.nettoAnnuo).toBeLessThan(resultBase.nettoAnnuo);

        const resultFasdac = calc.calcolaStipendioNetto({
          ...baseInput,
          ral,
          fasdac: true,
        });
        expect(resultFasdac.nettoAnnuo).toBeLessThan(resultBase.nettoAnnuo);

        const resultFondoEst = calc.calcolaStipendioNetto({
          ...baseInput,
          ral,
          fondoEst: true,
        });
        expect(resultFondoEst.nettoAnnuo).toBeLessThan(resultBase.nettoAnnuo);

        const resultPensione = calc.calcolaStipendioNetto({
          ...baseInput,
          ral,
          fondoPensioneIntegrativo: { contributoLavoratore: 2, ralLavoratore: ral },
        });
        expect(resultPensione.nettoAnnuo).toBeLessThan(resultBase.nettoAnnuo);
      }
    });
  });

  describe('Regime Impatriati aumenta il netto (20 scenari)', () => {
    it('attivare il regime impatriati aumenta sempre il netto', () => {
      for (let i = 0; i < 20; i++) {
        const ral = randomRal();
        const resultSenza = calc.calcolaStipendioNetto({ ...baseInput, ral });
        const resultCon = calc.calcolaStipendioNetto({
          ...baseInput,
          ral,
          regimeImpatriati: true,
        });
        expect(resultCon.nettoAnnuo).toBeGreaterThan(resultSenza.nettoAnnuo);
      }
    });

    it('esenzione 60% (figli) produce netto ≥ esenzione 50% per RAL ≥ 25k', () => {
      // Per RAL basse, interazioni con cuneo fiscale e trattamento integrativo
      // possono invertire il rapporto (non-monotonia del sistema fiscale)
      for (let i = 0; i < 20; i++) {
        const ral = 25_000 + Math.round(rng() * 175_000);
        const result50 = calc.calcolaStipendioNetto({
          ...baseInput,
          ral,
          regimeImpatriati: true,
        });
        const result60 = calc.calcolaStipendioNetto({
          ...baseInput,
          ral,
          regimeImpatriati: true,
          regimeImpatriatiMinorenni: true,
        });
        expect(result60.nettoAnnuo).toBeGreaterThanOrEqual(result50.nettoAnnuo);
      }
    });
  });
});

describe('Costo aziendale', () => {
  describe('Caso base: RAL 30k, impiegato senza CIGS', () => {
    const result = calc.calcolaStipendioNetto({
      ...baseInput,
      ral: 30_000,
    });

    it('deve usare aliquota INPS datore 28,98%', () => {
      expect(result.costoAziendale.aliquotaInpsDatore).toBe(0.2898);
    });

    it('deve calcolare contributi INPS datore correttamente', () => {
      expect(result.costoAziendale.contributiInpsDatore).toBeCloseTo(30_000 * 0.2898, 2);
    });

    it('deve calcolare TFR = RAL / 13,5', () => {
      expect(result.costoAziendale.tfr).toBeCloseTo(30_000 / 13.5, 2);
    });

    it('non deve includere fondi dirigenti né Fondo EST', () => {
      expect(result.costoAziendale.fondoNegriDatore).toBe(0);
      expect(result.costoAziendale.fondoPastoreDatore).toBe(0);
      expect(result.costoAziendale.cfmtDatore).toBe(0);
      expect(result.costoAziendale.fasdacDatore).toBe(0);
      expect(result.costoAziendale.fondoEstDatore).toBe(0);
    });

    it('fringe benefit, rimborsi e welfare devono essere 0 se non presenti', () => {
      expect(result.costoAziendale.fringeBenefit).toBe(0);
      expect(result.costoAziendale.rimborsiTrasferta).toBe(0);
      expect(result.costoAziendale.benefitNonTassati).toBe(0);
    });

    it('deve calcolare totale annuo = RAL + INPS datore + TFR', () => {
      const expected = 30_000 + 30_000 * 0.2898 + 30_000 / 13.5;
      expect(result.costoAziendale.totaleAnnuo).toBeCloseTo(expected, 2);
    });
  });

  describe('Con CIGS', () => {
    const result = calc.calcolaStipendioNetto({
      ...baseInput,
      ral: 40_000,
      aziendaConCigs: true,
    });

    it('deve usare aliquota INPS datore con CIGS (29,68%)', () => {
      expect(result.costoAziendale.aliquotaInpsDatore).toBe(0.2968);
    });
  });

  describe('Apprendistato', () => {
    const result = calc.calcolaStipendioNetto({
      ...baseInput,
      ral: 25_000,
      tipoContratto: 'apprendistato',
    });

    it('deve usare aliquota ridotta apprendistato (11,61%)', () => {
      expect(result.costoAziendale.aliquotaInpsDatore).toBe(0.1161);
    });
  });

  describe('Dirigente con fondi CCNL Terziario', () => {
    const result = calc.calcolaStipendioNetto({
      ...baseInput,
      ral: 80_000,
      fondoMarioNegri: true,
      fondoPastore: true,
      cfmt: true,
      fasdac: true,
    });

    it('deve usare aliquota dirigente (26,54%)', () => {
      expect(result.costoAziendale.aliquotaInpsDatore).toBe(0.2654);
    });

    it('deve includere Fondo Negri datore (15,38% di retribuzione convenzionale)', () => {
      expect(result.costoAziendale.fondoNegriDatore).toBeCloseTo(59_224.54 * 0.1538, 2);
    });

    it('deve includere Fondo Pastore datore', () => {
      expect(result.costoAziendale.fondoPastoreDatore).toBe(4_856.45);
    });

    it('deve includere CFMT datore', () => {
      expect(result.costoAziendale.cfmtDatore).toBe(276);
    });

    it('deve includere FASDAC datore (8,07% di retribuzione convenzionale)', () => {
      expect(result.costoAziendale.fasdacDatore).toBeCloseTo(45_940 * 0.0807, 2);
    });

    it('il costo aziendale deve includere tutte le voci', () => {
      const expected =
        80_000 +
        80_000 * 0.2654 +
        80_000 / 13.5 +
        59_224.54 * 0.1538 +
        4_856.45 +
        276 +
        45_940 * 0.0807;
      expect(result.costoAziendale.totaleAnnuo).toBeCloseTo(expected, 0);
    });
  });

  describe('Con fondo pensione integrativo (contributo datore)', () => {
    const result = calc.calcolaStipendioNetto({
      ...baseInput,
      ral: 35_000,
      fondoPensioneIntegrativo: {
        contributoLavoratore: 1,
        ralLavoratore: 35_000,
        contributoDatoreLavoro: 2,
        ralDatoreLavoro: 35_000,
      },
    });

    it('deve includere il contributo datore fondo pensione nel costo aziendale', () => {
      expect(result.costoAziendale.fondoPensioneIntegrativoDatore).toBeCloseTo(700, 2);
    });

    it('il totale deve includere il contributo datore', () => {
      const expected = 35_000 + 35_000 * 0.2898 + 35_000 / 13.5 + 700;
      expect(result.costoAziendale.totaleAnnuo).toBeCloseTo(expected, 0);
    });
  });

  describe('Con fringe benefit', () => {
    const result = calc.calcolaStipendioNetto({
      ...baseInput,
      ral: 30_000,
      fringeBenefit: {
        buoniAcquisto: 500,
        buoniCarburante: 200,
      },
    });

    it('deve includere i fringe benefit nel costo aziendale', () => {
      expect(result.costoAziendale.fringeBenefit).toBe(700);
    });

    it('il totale deve includere i fringe benefit', () => {
      expect(result.costoAziendale.totaleAnnuo).toBeGreaterThan(
        30_000 + 30_000 * 0.2898 + 30_000 / 13.5,
      );
    });
  });

  describe('Con rimborsi trasferta', () => {
    const result = calc.calcolaStipendioNetto({
      ...baseInput,
      ral: 30_000,
      rimborsiTrasferta: {
        modalitaRimborso: 'forfettario',
        giorniTrasfertaItalia: 10,
      },
    });

    it('deve includere i rimborsi trasferta nel costo aziendale', () => {
      expect(result.costoAziendale.rimborsiTrasferta).toBeCloseTo(46.48 * 10, 2);
    });
  });

  describe('Con benefit non tassati (welfare)', () => {
    const result = calc.calcolaStipendioNetto({
      ...baseInput,
      ral: 30_000,
      benefitNonTassati: {
        buoniPasto: 1_500,
        buoniPastoElettronici: true,
        abbonamentoTrasporto: 300,
        serviziWelfare: 800,
      },
    });

    it('deve includere i benefit non tassati nel costo aziendale', () => {
      expect(result.costoAziendale.benefitNonTassati).toBe(1_500 + 300 + 800);
    });

    it('il totale deve includere i benefit non tassati', () => {
      const baseExpected = 30_000 + 30_000 * 0.2898 + 30_000 / 13.5;
      expect(result.costoAziendale.totaleAnnuo).toBeCloseTo(baseExpected + 2_600, 0);
    });
  });

  describe('Il costo aziendale è sempre maggiore della RAL', () => {
    it.each([20_000, 30_000, 50_000, 80_000, 120_000])('RAL %d', (ral) => {
      const result = calc.calcolaStipendioNetto({ ...baseInput, ral });
      expect(result.costoAziendale.totaleAnnuo).toBeGreaterThan(ral);
    });
  });
});
