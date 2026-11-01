import { Calculator2026 } from '../impl/2026';
import { somma } from '../ripartizione';
import type { InputCalcoloStipendio } from '../types';
import {
  calcolaFondi,
  dettagliFondi,
  FONDI_CONTRATTUALI,
  PLAFOND_PREVIDENZA_COMPLEMENTARE,
  type InputFondi,
} from './2026';

const nessunFondo: InputFondi = { contributoWelfare: 0, mensilita: 13 };

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
      entrate: [],
      trattenute: [],
      isDirigente: false,
    });
  });

  describe.each(FONDI_CONTRATTUALI)('$nome da solo', (fondo) => {
    const calcolo = calcolaFondi({ ...nessunFondo, [fondo.id]: true });

    it('trattiene il contributo lavoratore', () => {
      expect(calcolo.trattenute).toEqual([
        { descrizione: fondo.nome, importo: fondo.contributoLavoratore, categoria: 'fondi' },
      ]);
    });

    it('addebita il contributo datore al costo aziendale', () => {
      expect(calcolo.entrate).toEqual([
        {
          descrizione: `${fondo.nome} (azienda)`,
          importo: fondo.contributoDatore,
          categoria: 'fondi',
          pagatore: 'datore',
          destinazione: 'accantonata',
        },
      ]);
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
    expect(somma(calcolo.trattenute)).toBeCloseTo(
      FONDI_CONTRATTUALI.reduce((totale, fondo) => totale + fondo.contributoLavoratore, 0),
      6,
    );
    expect(somma(calcolo.entrate)).toBeCloseTo(
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

  it('include datore, EBITEMP e contributo welfare', () => {
    const calcolo = calcolaFondi({
      contributoWelfare: 500,
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
    // Datore, EBITEMP e welfare sono reddito del dipendente
    expect(calcolo.redditoFondoPensione).toBeCloseTo(1_400, 6);
    // Solo il contributo lavoratore è trattenuto dal netto
    expect(somma(calcolo.trattenute)).toBeCloseTo(300, 6);
    // Datore e welfare sono pagati dall'azienda
    expect(somma(calcolo.entrate)).toBeCloseTo(1_100, 6);
  });

  it('esiste anche con il solo contributo welfare, senza trattenute', () => {
    const calcolo = calcolaFondi({ ...nessunFondo, contributoWelfare: 1_000 });

    expect(calcolo.fondoPensioneIntegrativo?.deduzioneEffettiva).toBe(1_000);
    expect(calcolo.redditoFondoPensione).toBe(1_000);
    expect(somma(calcolo.trattenute)).toBe(0);
    expect(somma(calcolo.entrate)).toBe(1_000);
  });
});

describe('dettagliFondi', () => {
  it('ripartisce il risparmio fiscale tra le sole deduzioni, in proporzione', () => {
    const tutti = Object.fromEntries(FONDI_CONTRATTUALI.map((fondo) => [fondo.id, true]));
    const calcolo = calcolaFondi({ ...nessunFondo, ...tutti, contributoWelfare: 1_000 });
    const risparmio = 900;
    const dettagli = dettagliFondi(calcolo, risparmio);

    for (const fondo of dettagli.fondiContrattuali) {
      expect(fondo.risparmioFiscaleStimato).toBeCloseTo(
        fondo.deducibile ? (risparmio * fondo.contributoAnnuo) / calcolo.deduzione : 0,
        6,
      );
    }
    expect(dettagli.fondoPensioneIntegrativo!.risparmoFiscaleStimato).toBeCloseTo(
      (risparmio * calcolo.fondoPensioneIntegrativo!.deduzioneEffettiva) / calcolo.deduzione,
      6,
    );
    expect(
      somma(dettagli.fondiContrattuali.map((f) => ({ importo: f.risparmioFiscaleStimato }))) +
        dettagli.fondoPensioneIntegrativo!.risparmoFiscaleStimato,
    ).toBeCloseTo(risparmio, 6);
  });

  it('senza deduzioni il risparmio è zero', () => {
    const calcolo = calcolaFondi({ ...nessunFondo, fondoPastore: true });
    const dettagli = dettagliFondi(calcolo, 0);
    expect(dettagli.fondiContrattuali[0].risparmioFiscaleStimato).toBe(0);
    expect(dettagli.fondoPensioneIntegrativo).toBeNull();
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

    const fondiDatore = conFondo.ripartizione.entrate.filter((voce) => voce.categoria === 'fondi');

    expect(somma(fondiDatore)).toBe(fondo.contributoDatore);
    expect(conFondo.fondiContrattuali.map((dettaglio) => dettaglio.id)).toEqual([fondo.id]);
  });
});
