import { Calculator2026 } from '../impl/2026';
import type { InputCalcoloStipendio } from '../types';
import {
  calcolaFondi,
  dettagliFondi,
  FONDI_CONTRATTUALI,
  PLAFOND_PREVIDENZA_COMPLEMENTARE,
  type InputFondi,
} from './2026';

const nessunFondo: InputFondi = { contributoVolontario: 0, mensilita: 13 };

const fondiDeducibili = FONDI_CONTRATTUALI.filter((fondo) => fondo.deducibile);
const contributoDeducibile = fondiDeducibili.reduce(
  (totale, fondo) => totale + fondo.contributoLavoratore,
  0,
);

describe('Tabella fondi contrattuali', () => {
  it('ha id univoci', () => {
    const ids = FONDI_CONTRATTUALI.map((fondo) => fondo.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('ha contributi positivi', () => {
    const errori = FONDI_CONTRATTUALI.filter(
      (fondo) => !(fondo.contributoLavoratore > 0) || !(fondo.contributoDatore > 0),
    ).map((fondo) => fondo.id);
    expect(errori).toEqual([]);
  });
});

describe('calcolaFondi', () => {
  it('senza fondi non ha effetti', () => {
    expect(calcolaFondi(nessunFondo)).toEqual({
      fondiContrattuali: [],
      fondoPensioneIntegrativo: null,
      redditoFondoPensione: 0,
      deduzione: 0,
      trattenute: 0,
      costoDatoreFondiContrattuali: 0,
      costoDatoreFondoPensione: 0,
      isDirigente: false,
    });
  });

  describe.each(FONDI_CONTRATTUALI)('$nome da solo', (fondo) => {
    const calcolo = calcolaFondi({ ...nessunFondo, [fondo.id]: true });

    it('trattiene il contributo lavoratore', () => {
      expect(calcolo.trattenute).toBe(fondo.contributoLavoratore);
    });

    it('addebita il contributo datore al costo aziendale', () => {
      expect(calcolo.costoDatoreFondiContrattuali).toBe(fondo.contributoDatore);
    });

    it('deduce il contributo solo se deducibile', () => {
      expect(calcolo.deduzione).toBe(fondo.deducibile ? fondo.contributoLavoratore : 0);
    });

    it('rende dirigente solo un fondo dirigenti', () => {
      expect(calcolo.isDirigente).toBe(fondo.categoria === 'dirigentiTerziario');
    });

    it('compare nel dettaglio', () => {
      expect(calcolo.fondiContrattuali).toEqual([
        {
          id: fondo.id,
          nome: fondo.nome,
          contributoAnnuo: fondo.contributoLavoratore,
          contributoMensile: fondo.contributoLavoratore / 12,
          contributoDatore: fondo.contributoDatore,
          deducibile: fondo.deducibile,
        },
      ]);
    });
  });

  it('somma i contributi di tutti i fondi selezionati', () => {
    const tutti = Object.fromEntries(FONDI_CONTRATTUALI.map((fondo) => [fondo.id, true]));
    const calcolo = calcolaFondi({ ...nessunFondo, ...tutti });

    expect(calcolo.fondiContrattuali.map((fondo) => fondo.id)).toEqual(
      FONDI_CONTRATTUALI.map((fondo) => fondo.id),
    );
    expect(calcolo.trattenute).toBeCloseTo(
      FONDI_CONTRATTUALI.reduce((totale, fondo) => totale + fondo.contributoLavoratore, 0),
      6,
    );
    expect(calcolo.costoDatoreFondiContrattuali).toBeCloseTo(
      FONDI_CONTRATTUALI.reduce((totale, fondo) => totale + fondo.contributoDatore, 0),
      6,
    );
    expect(calcolo.deduzione).toBeCloseTo(contributoDeducibile, 6);
  });
});

describe('Plafond previdenza complementare', () => {
  // 10% di 100.000 = 10.000, oltre il plafond
  const fondoPensioneAlto: InputFondi = {
    ...nessunFondo,
    fondoPensioneIntegrativo: { contributoLavoratore: 10, ralLavoratore: 100_000 },
  };

  it('limita la deduzione al plafond', () => {
    const previdenza = calcolaFondi(fondoPensioneAlto).fondoPensioneIntegrativo!;

    expect(previdenza.deduzioneEffettiva).toBe(PLAFOND_PREVIDENZA_COMPLEMENTARE);
    expect(previdenza.eccedenzaNonDeducibile).toBe(10_000 - PLAFOND_PREVIDENZA_COMPLEMENTARE);
  });

  it.each(fondiDeducibili)('si riduce del contributo $nome', (fondo) => {
    const calcolo = calcolaFondi({ ...fondoPensioneAlto, [fondo.id]: true });

    expect(calcolo.fondoPensioneIntegrativo!.deduzioneEffettiva).toBeCloseTo(
      PLAFOND_PREVIDENZA_COMPLEMENTARE - fondo.contributoLavoratore,
      6,
    );
    // Fondo deducibile e previdenza insieme deducono esattamente il plafond
    expect(calcolo.deduzione).toBeCloseTo(PLAFOND_PREVIDENZA_COMPLEMENTARE, 6);
  });

  it('include datore, EBITEMP e contributo volontario', () => {
    const calcolo = calcolaFondi({
      contributoVolontario: 500,
      mensilita: 14,
      fondoPensioneIntegrativo: {
        contributoLavoratore: 1,
        ralLavoratore: 30_000,
        contributoDatoreLavoro: 2,
        ralDatoreLavoro: 30_000,
        contributoEbitemp: 1,
        ralEbitemp: 30_000,
        ripartizionePerMensilita: true,
      },
    });
    const previdenza = calcolo.fondoPensioneIntegrativo!;

    expect(previdenza.totaleContributi).toBeCloseTo(300 + 600 + 300 + 500, 6);
    expect(previdenza.contributoLavoratoreMensile).toBeCloseTo(300 / 14, 6);
    expect(calcolo.deduzione).toBeCloseTo(1_700, 6);
    expect(calcolo.redditoFondoPensione).toBeCloseTo(900, 6);
    expect(calcolo.trattenute).toBeCloseTo(800, 6);
    expect(calcolo.costoDatoreFondoPensione).toBeCloseTo(600, 6);
  });

  it('esiste anche con il solo contributo volontario', () => {
    const calcolo = calcolaFondi({ ...nessunFondo, contributoVolontario: 1_000 });

    expect(calcolo.fondoPensioneIntegrativo?.deduzioneEffettiva).toBe(1_000);
    expect(calcolo.trattenute).toBe(1_000);
  });
});

describe('dettagliFondi', () => {
  it('stima il risparmio fiscale solo sulle deduzioni', () => {
    const tutti = Object.fromEntries(FONDI_CONTRATTUALI.map((fondo) => [fondo.id, true]));
    const calcolo = calcolaFondi({ ...nessunFondo, ...tutti, contributoVolontario: 1_000 });
    const dettagli = dettagliFondi(calcolo, 0.33);

    for (const fondo of dettagli.fondiContrattuali) {
      expect(fondo.risparmioFiscaleStimato).toBeCloseTo(
        fondo.deducibile ? fondo.contributoAnnuo * 0.33 : 0,
        6,
      );
    }
    expect(dettagli.fondoPensioneIntegrativo!.risparmoFiscaleStimato).toBeCloseTo(
      calcolo.fondoPensioneIntegrativo!.deduzioneEffettiva * 0.33,
      6,
    );
  });
});

describe('Fondi nel calcolo dello stipendio', () => {
  const calc = new Calculator2026();
  const base: InputCalcoloStipendio = {
    ral: 60_000,
    mensilita: 13,
    tipoContratto: 'indeterminato',
    annoFiscale: 2026,
    regione: 'LO',
    comune: 'F205',
  };
  const senzaFondi = calc.calcolaStipendioNetto(base);

  it.each(FONDI_CONTRATTUALI.filter((fondo) => !fondo.deducibile))(
    '$nome riduce il netto esattamente del contributo',
    (fondo) => {
      const conFondo = calc.calcolaStipendioNetto({ ...base, [fondo.id]: true });

      expect(senzaFondi.nettoAnnuo - conFondo.nettoAnnuo).toBeCloseTo(
        fondo.contributoLavoratore,
        6,
      );
    },
  );

  it.each(fondiDeducibili)('$nome riduce il netto meno del contributo', (fondo) => {
    const conFondo = calc.calcolaStipendioNetto({ ...base, [fondo.id]: true });
    const riduzione = senzaFondi.nettoAnnuo - conFondo.nettoAnnuo;

    expect(riduzione).toBeGreaterThan(0);
    expect(riduzione).toBeLessThan(fondo.contributoLavoratore);
  });

  it.each(FONDI_CONTRATTUALI)('$nome entra nel costo aziendale', (fondo) => {
    const conFondo = calc.calcolaStipendioNetto({ ...base, [fondo.id]: true });

    expect(conFondo.costoAziendale.fondiContrattualiDatore).toBe(fondo.contributoDatore);
    expect(conFondo.fondiContrattuali.map((dettaglio) => dettaglio.id)).toEqual([fondo.id]);
  });
});
