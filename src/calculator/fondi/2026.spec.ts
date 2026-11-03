import { Calculator2026 } from '../impl/2026';
import { somma } from '../ripartizione';
import type { FondoPersonalizzato, InputCalcoloStipendio } from '../types';
import {
  calcolaFondi,
  dettagliFondi,
  FONDI_CONTRATTUALI,
  GRUPPI_FONDI,
  LIMITE_ASSISTENZA_SANITARIA,
  PLAFOND_PREVIDENZA_COMPLEMENTARE,
  PRESET_FONDI_PENSIONE,
  soggettoSolidarieta,
  type InputFondi,
} from './2026';

const nessunFondo: InputFondi = {
  contributoWelfare: 0,
  assistenzaSanitariaWelfare: 0,
  mensilita: 13,
};

const fondiSenzaLimite = FONDI_CONTRATTUALI.filter(
  (fondo) => fondo.trattamento === 'deducibileSenzaLimite',
);
const fondiSanitari = FONDI_CONTRATTUALI.filter(
  (fondo) => fondo.trattamento === 'assistenzaSanitaria',
);
const fondiNonDeducibili = FONDI_CONTRATTUALI.filter(
  (fondo) => fondo.trattamento === 'nonDeducibile',
);

/** Quota del contributo datore che concorre al limite di esenzione sanitaria */
function datoreNelLimite(fondo: (typeof FONDI_CONTRATTUALI)[number]): number {
  return fondo.contributoDatore - (fondo.contributoDatoreSolidale ?? 0);
}

describe('Tabella fondi contrattuali', () => {
  it('ha id univoci', () => {
    const ids = FONDI_CONTRATTUALI.map((fondo) => fondo.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('ha contributi non negativi e almeno un contributo per fondo', () => {
    const errori = FONDI_CONTRATTUALI.filter(
      (fondo) =>
        fondo.contributoLavoratore < 0 ||
        fondo.contributoDatore < 0 ||
        fondo.contributoLavoratore + fondo.contributoDatore <= 0,
    ).map((fondo) => fondo.id);
    expect(errori).toEqual([]);
  });

  it('ogni fondo appartiene a un gruppo della form', () => {
    const gruppi = GRUPPI_FONDI.map((gruppo) => gruppo.id);
    const orfani = FONDI_CONTRATTUALI.filter((fondo) => !gruppi.includes(fondo.gruppo));
    expect(orfani).toEqual([]);
  });

  it('la quota solidale del contributo datore non supera il contributo', () => {
    const errori = FONDI_CONTRATTUALI.filter(
      (fondo) => (fondo.contributoDatoreSolidale ?? 0) > fondo.contributoDatore,
    );
    expect(errori).toEqual([]);
  });

  it('riporta gli importi 2026 dei fondi del CCNL Terziario', () => {
    const importi = Object.fromEntries(
      FONDI_CONTRATTUALI.map((fondo) => [
        fondo.id,
        [+fondo.contributoLavoratore.toFixed(2), +fondo.contributoDatore.toFixed(2)],
      ]),
    );
    expect(importi['fondoEst']).toEqual([24, 156]);
    expect(importi['quas']).toEqual([56, 390]);
    expect(importi['quadrifor']).toEqual([25, 50]);
    expect(importi['sanimpresa']).toEqual([0, 168]);
    expect(importi['fondoFast']).toEqual([24, 120]);
    expect(importi['fondoMarioNegri']).toEqual([1_184.49, 9_108.73]);
    expect(importi['fondoPastore']).toEqual([464.81, 4_856.45]);
    expect(importi['fasdac']).toEqual([859.08, 3_707.36]);
    expect(importi['metasalute']).toEqual([0, 156]);
    expect(importi['fasi']).toEqual([1_120, 2_180]);
    expect(importi['gsFasi']).toEqual([0, 100]);
  });

  it('solo i fondi dei dirigenti portano alle aliquote INPS dirigenti', () => {
    const dirigenti = FONDI_CONTRATTUALI.filter((fondo) => fondo.dirigente).map((f) => f.id);
    expect(dirigenti).toEqual([
      'fondoMarioNegri',
      'fondoPastore',
      'cfmt',
      'fasdac',
      'fasi',
      'gsFasi',
    ]);
  });

  it('i preset dei fondi pensione hanno percentuali positive', () => {
    for (const preset of PRESET_FONDI_PENSIONE) {
      expect(preset.contributoLavoratore).toBeGreaterThan(0);
      expect(preset.contributoDatore).toBeGreaterThan(0);
    }
    expect(PRESET_FONDI_PENSIONE.map((p) => p.id)).toEqual(['cometa', 'fonte', 'previndai']);
  });
});

describe('calcolaFondi', () => {
  it('senza fondi non ha effetti', () => {
    expect(calcolaFondi(nessunFondo)).toEqual({
      fondiContrattuali: [],
      fondoPensioneIntegrativo: null,
      assistenzaSanitaria: null,
      redditoFondoPensione: 0,
      redditoAssistenzaSanitaria: 0,
      assistenzaSanitariaWelfareEsente: 0,
      deduzione: 0,
      baseContributoSolidarieta: 0,
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

    it('deduce il contributo lavoratore secondo il trattamento', () => {
      const attesa =
        fondo.trattamento === 'nonDeducibile'
          ? 0
          : fondo.trattamento === 'deducibileSenzaLimite'
            ? fondo.contributoLavoratore
            : Math.min(
                fondo.contributoLavoratore,
                Math.max(0, LIMITE_ASSISTENZA_SANITARIA - datoreNelLimite(fondo)),
              );
      expect(calcolo.deduzione).toBeCloseTo(attesa, 6);
      expect(calcolo.fondiContrattuali[0].deduzione).toBeCloseTo(attesa, 6);
    });

    it('da solo non supera il limite sanitario', () => {
      expect(calcolo.redditoAssistenzaSanitaria).toBe(0);
      expect(calcolo.fondiContrattuali[0].contributoDatoreImponibile).toBe(0);
    });

    it('rende dirigente solo un fondo dirigenti', () => {
      expect(calcolo.isDirigente).toBe(fondo.dirigente);
    });

    it('assoggetta a solidarietà il contributo datore solo se previdenziale o sanitario', () => {
      expect(calcolo.baseContributoSolidarieta).toBe(
        soggettoSolidarieta(fondo.trattamento) ? fondo.contributoDatore : 0,
      );
    });

    it('compare nel dettaglio', () => {
      expect(calcolo.fondiContrattuali).toEqual([
        {
          id: fondo.id,
          nome: fondo.nome,
          contributoAnnuo: fondo.contributoLavoratore,
          contributoMensile: fondo.contributoLavoratore / 12,
          contributoDatore: fondo.contributoDatore,
          trattamento: fondo.trattamento,
          deduzione: calcolo.deduzione,
          contributoDatoreImponibile: 0,
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
  });
});

describe('Limite di esenzione dei contributi sanitari', () => {
  it('è di €3.615,20 (art. 51, c. 2, lett. a, TUIR)', () => {
    expect(LIMITE_ASSISTENZA_SANITARIA).toBe(3_615.2);
  });

  it('Fondo EST: contributo lavoratore esente, nessuna eccedenza', () => {
    const calcolo = calcolaFondi({ ...nessunFondo, fondoEst: true });
    expect(calcolo.assistenzaSanitaria).toEqual({
      contributi: 180,
      esente: 180,
      eccedenza: 0,
      limite: LIMITE_ASSISTENZA_SANITARIA,
    });
    expect(calcolo.deduzione).toBe(24);
  });

  it('FASDAC: gestione pensionati e LTC non concorrono al limite (Ris. AE 78/E/2004)', () => {
    const fasdac = FONDI_CONTRATTUALI.find((fondo) => fondo.id === 'fasdac')!;
    const calcolo = calcolaFondi({ ...nessunFondo, fasdac: true });
    const nelLimite = datoreNelLimite(fasdac) + fasdac.contributoLavoratore;

    expect(fasdac.contributoDatoreSolidale).toBeCloseTo(0.0278 * 45_940 + 206.6, 6);
    expect(nelLimite).toBeLessThan(LIMITE_ASSISTENZA_SANITARIA);
    expect(calcolo.assistenzaSanitaria!.contributi).toBeCloseTo(nelLimite, 6);
    expect(calcolo.assistenzaSanitaria!.eccedenza).toBe(0);
    // Il dirigente deduce l'intera quota a suo carico
    expect(calcolo.deduzione).toBeCloseTo(fasdac.contributoLavoratore, 6);
    // Ma la solidarietà del 10% grava sull'intero contributo azienda
    expect(calcolo.baseContributoSolidarieta).toBeCloseTo(fasdac.contributoDatore, 6);
  });

  it('il welfare sanitario condivide il limite con i fondi: prima il datore, poi il welfare, poi il lavoratore', () => {
    const fasdac = FONDI_CONTRATTUALI.find((fondo) => fondo.id === 'fasdac')!;
    const calcolo = calcolaFondi({
      ...nessunFondo,
      fasdac: true,
      assistenzaSanitariaWelfare: 2_000,
    });
    const residuoDopoDatore = LIMITE_ASSISTENZA_SANITARIA - datoreNelLimite(fasdac);

    expect(calcolo.assistenzaSanitariaWelfareEsente).toBeCloseTo(residuoDopoDatore, 6);
    // Welfare oltre il limite: reddito imponibile del dirigente
    expect(calcolo.redditoAssistenzaSanitaria).toBeCloseTo(2_000 - residuoDopoDatore, 6);
    // Il limite è esaurito: la quota del dirigente resta trattenuta dal netto
    expect(calcolo.deduzione).toBe(0);
    expect(calcolo.fondiContrattuali[0].deduzione).toBe(0);
    expect(calcolo.assistenzaSanitaria!.esente).toBeCloseTo(LIMITE_ASSISTENZA_SANITARIA, 6);
    expect(calcolo.assistenzaSanitaria!.eccedenza).toBeCloseTo(
      datoreNelLimite(fasdac) + 2_000 + fasdac.contributoLavoratore - LIMITE_ASSISTENZA_SANITARIA,
      6,
    );
    // Solidarietà anche sul welfare oltre soglia
    expect(calcolo.baseContributoSolidarieta).toBeCloseTo(fasdac.contributoDatore + 2_000, 6);
  });

  it('il contributo datore oltre il limite è reddito imponibile del lavoratore', () => {
    const calcolo = calcolaFondi({ ...nessunFondo, fasdac: true, fasi: true });
    const fasdac = FONDI_CONTRATTUALI.find((fondo) => fondo.id === 'fasdac')!;
    const fasi = FONDI_CONTRATTUALI.find((fondo) => fondo.id === 'fasi')!;
    const eccedenzaDatore =
      datoreNelLimite(fasdac) + datoreNelLimite(fasi) - LIMITE_ASSISTENZA_SANITARIA;

    expect(eccedenzaDatore).toBeGreaterThan(0);
    expect(calcolo.redditoAssistenzaSanitaria).toBeCloseTo(eccedenzaDatore, 6);
    expect(calcolo.fondiContrattuali.map((fondo) => fondo.contributoDatoreImponibile)).toEqual([
      0,
      expect.closeTo(eccedenzaDatore, 6),
    ]);
    expect(calcolo.deduzione).toBe(0);
  });

  it('il solo welfare sanitario resta esente entro il limite', () => {
    const calcolo = calcolaFondi({ ...nessunFondo, assistenzaSanitariaWelfare: 5_000 });
    expect(calcolo.assistenzaSanitariaWelfareEsente).toBeCloseTo(LIMITE_ASSISTENZA_SANITARIA, 6);
    expect(calcolo.redditoAssistenzaSanitaria).toBeCloseTo(5_000 - LIMITE_ASSISTENZA_SANITARIA, 6);
    expect(calcolo.fondiContrattuali).toEqual([]);
    expect(calcolo.baseContributoSolidarieta).toBe(5_000);
  });
});

describe('Fondi personalizzati', () => {
  const personalizzato = (fondo: Partial<FondoPersonalizzato>): InputFondi => ({
    ...nessunFondo,
    fondiPersonalizzati: [
      {
        contributoLavoratore: 300,
        contributoDatore: 700,
        trattamento: 'nonDeducibile',
        ...fondo,
      },
    ],
  });

  it('ha un nome predefinito e un id progressivo', () => {
    const calcolo = calcolaFondi({
      ...nessunFondo,
      fondiPersonalizzati: [
        { contributoLavoratore: 10, contributoDatore: 0, trattamento: 'nonDeducibile' },
        {
          nome: ' Cassa ',
          contributoLavoratore: 0,
          contributoDatore: 20,
          trattamento: 'nonDeducibile',
        },
      ],
    });
    expect(calcolo.fondiContrattuali.map((fondo) => [fondo.id, fondo.nome])).toEqual([
      ['personalizzato-0', 'Fondo personalizzato'],
      ['personalizzato-1', 'Cassa'],
    ]);
  });

  it('non deducibile: trattenuta dal netto, datore senza solidarietà', () => {
    const calcolo = calcolaFondi(personalizzato({ trattamento: 'nonDeducibile' }));
    expect(calcolo.deduzione).toBe(0);
    expect(calcolo.baseContributoSolidarieta).toBe(0);
    expect(somma(calcolo.trattenute)).toBe(300);
    expect(somma(calcolo.entrate)).toBe(700);
  });

  it('deducibile senza limite: deduzione integrale e plafond ridotto', () => {
    const calcolo = calcolaFondi({
      ...personalizzato({ trattamento: 'deducibileSenzaLimite', contributoLavoratore: 2_000 }),
      fondoPensioneIntegrativo: { contributoLavoratore: 10, ralLavoratore: 100_000 },
    });
    expect(calcolo.fondiContrattuali[0].deduzione).toBe(2_000);
    expect(calcolo.fondoPensioneIntegrativo!.deduzioneEffettiva).toBe(
      PLAFOND_PREVIDENZA_COMPLEMENTARE - 2_000,
    );
    expect(calcolo.deduzione).toBe(PLAFOND_PREVIDENZA_COMPLEMENTARE);
    expect(calcolo.baseContributoSolidarieta).toBe(700);
  });

  it('assistenza sanitaria: nel limite insieme a Fondo EST e welfare', () => {
    const calcolo = calcolaFondi({
      ...personalizzato({ trattamento: 'assistenzaSanitaria' }),
      fondoEst: true,
      assistenzaSanitariaWelfare: 100,
    });
    expect(calcolo.assistenzaSanitaria).toEqual({
      contributi: 180 + 1_000 + 100,
      esente: 1_280,
      eccedenza: 0,
      limite: LIMITE_ASSISTENZA_SANITARIA,
    });
    expect(calcolo.deduzione).toBe(24 + 300);
    expect(calcolo.baseContributoSolidarieta).toBe(156 + 700 + 100);
  });

  it('previdenza complementare: lavoratore e datore nel plafond, datore reddito', () => {
    const calcolo = calcolaFondi(
      personalizzato({
        trattamento: 'previdenzaComplementare',
        contributoLavoratore: 1_000,
        contributoDatore: 2_000,
      }),
    );
    const previdenza = calcolo.fondoPensioneIntegrativo!;

    expect(previdenza.contributoFondiContrattualiAnnuo).toBe(3_000);
    expect(previdenza.totaleContributi).toBe(3_000);
    expect(previdenza.deduzioneEffettiva).toBe(3_000);
    expect(calcolo.redditoFondoPensione).toBe(2_000);
    expect(calcolo.deduzione).toBe(3_000);
    expect(calcolo.fondiContrattuali[0].deduzione).toBe(1_000);
    expect(calcolo.fondiContrattuali[0].contributoDatoreImponibile).toBe(0);
    expect(calcolo.baseContributoSolidarieta).toBe(2_000);
  });

  it('previdenza complementare oltre il plafond: eccedenza in proporzione', () => {
    const calcolo = calcolaFondi({
      ...personalizzato({
        trattamento: 'previdenzaComplementare',
        contributoLavoratore: 2_000,
        contributoDatore: 4_000,
      }),
      fondoPensioneIntegrativo: { contributoLavoratore: 2, ralLavoratore: 100_000 },
    });
    const previdenza = calcolo.fondoPensioneIntegrativo!;
    const quota = PLAFOND_PREVIDENZA_COMPLEMENTARE / 8_000;

    expect(previdenza.totaleContributi).toBe(8_000);
    expect(previdenza.deduzioneEffettiva).toBe(PLAFOND_PREVIDENZA_COMPLEMENTARE);
    expect(previdenza.eccedenzaNonDeducibile).toBe(8_000 - PLAFOND_PREVIDENZA_COMPLEMENTARE);
    expect(calcolo.fondiContrattuali[0].deduzione).toBeCloseTo(2_000 * quota, 6);
    expect(calcolo.fondiContrattuali[0].contributoDatoreImponibile).toBeCloseTo(
      4_000 * (1 - quota),
      6,
    );
    expect(calcolo.deduzione).toBe(PLAFOND_PREVIDENZA_COMPLEMENTARE);
  });

  it('un fondo dirigenti personalizzato porta alle aliquote dirigenti', () => {
    expect(calcolaFondi(personalizzato({ dirigente: true })).isDirigente).toBe(true);
    expect(calcolaFondi(personalizzato({})).isDirigente).toBe(false);
  });

  it('ignora contributi negativi', () => {
    const calcolo = calcolaFondi(
      personalizzato({ contributoLavoratore: -5, contributoDatore: -10 }),
    );
    expect(calcolo.fondiContrattuali[0].contributoAnnuo).toBe(0);
    expect(calcolo.fondiContrattuali[0].contributoDatore).toBe(0);
  });
});

describe('Base del contributo di solidarietà', () => {
  it('esclude solo i fondi non deducibili (Pastore, CFMT, Quadrifor)', () => {
    const esclusi = fondiNonDeducibili.map((fondo) => fondo.id);
    expect(esclusi).toEqual(['quadrifor', 'fondoPastore', 'cfmt']);
    for (const fondo of FONDI_CONTRATTUALI) {
      expect(soggettoSolidarieta(fondo.trattamento)).toBe(!esclusi.includes(fondo.id));
    }
  });

  it('comprende i contributi datore e welfare al fondo pensione, non quelli del lavoratore', () => {
    const calcolo = calcolaFondi({
      ...nessunFondo,
      contributoWelfare: 500,
      fondoPensioneIntegrativo: {
        contributoLavoratore: 1,
        ralLavoratore: 30_000,
        contributoDatoreLavoro: 2,
        ralDatoreLavoro: 30_000,
      },
    });
    expect(calcolo.baseContributoSolidarieta).toBeCloseTo(600 + 500, 6);
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

  it.each(fondiSenzaLimite)('si riduce del contributo $nome', (fondo) => {
    const calcolo = calcolaFondi({ ...fondoPensioneAlto, [fondo.id]: true });

    expect(calcolo.fondoPensioneIntegrativo!.deduzioneEffettiva).toBeCloseTo(
      PLAFOND_PREVIDENZA_COMPLEMENTARE - fondo.contributoLavoratore,
      6,
    );
    // Fondo in squilibrio e previdenza insieme deducono esattamente il plafond
    expect(calcolo.deduzione).toBeCloseTo(PLAFOND_PREVIDENZA_COMPLEMENTARE, 6);
  });

  it.each(fondiSanitari)('non si riduce del contributo sanitario $nome', (fondo) => {
    const calcolo = calcolaFondi({ ...fondoPensioneAlto, [fondo.id]: true });
    expect(calcolo.fondoPensioneIntegrativo!.deduzioneEffettiva).toBe(
      PLAFOND_PREVIDENZA_COMPLEMENTARE,
    );
  });

  it('include datore, EBITEMP e contributo welfare', () => {
    const calcolo = calcolaFondi({
      contributoWelfare: 500,
      assistenzaSanitariaWelfare: 0,
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

  it('prende il nome del fondo dall’input', () => {
    const conNome = calcolaFondi({
      ...nessunFondo,
      fondoPensioneIntegrativo: {
        nome: 'Cometa',
        contributoLavoratore: 1.2,
        ralLavoratore: 25_000,
      },
    });
    expect(conNome.fondoPensioneIntegrativo!.nome).toBe('Cometa');
    expect(calcolaFondi(fondoPensioneAlto).fondoPensioneIntegrativo!.nome).toBe('Fondo pensione');
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
        (risparmio * fondo.deduzione) / calcolo.deduzione,
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

  it('non conta due volte la deduzione dei fondi previdenziali', () => {
    const calcolo = calcolaFondi({
      ...nessunFondo,
      contributoWelfare: 1_000,
      fondiPersonalizzati: [
        {
          contributoLavoratore: 500,
          contributoDatore: 500,
          trattamento: 'previdenzaComplementare',
        },
      ],
    });
    const dettagli = dettagliFondi(calcolo, 400);

    expect(calcolo.deduzione).toBe(2_000);
    expect(dettagli.fondiContrattuali[0].risparmioFiscaleStimato).toBeCloseTo(100, 6);
    expect(dettagli.fondoPensioneIntegrativo!.risparmoFiscaleStimato).toBeCloseTo(300, 6);
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

  it.each(fondiNonDeducibili)('$nome riduce il netto esattamente del contributo', (fondo) => {
    const conFondo = calc.calcolaStipendioNetto({ ...base, [fondo.id]: true });

    expect(senzaFondi.nettoAnnuo - conFondo.nettoAnnuo).toBeCloseTo(fondo.contributoLavoratore, 6);
  });

  it.each([...fondiSenzaLimite, ...fondiSanitari.filter((f) => f.contributoLavoratore > 0)])(
    '$nome riduce il netto meno del contributo',
    (fondo) => {
      const conFondo = calc.calcolaStipendioNetto({ ...base, [fondo.id]: true });
      const riduzione = senzaFondi.nettoAnnuo - conFondo.nettoAnnuo;

      expect(riduzione).toBeGreaterThan(0);
      expect(riduzione).toBeLessThan(fondo.contributoLavoratore);
    },
  );

  it.each(fondiSanitari.filter((f) => f.contributoLavoratore === 0))(
    '$nome non cambia il netto, solo il costo aziendale',
    (fondo) => {
      const conFondo = calc.calcolaStipendioNetto({ ...base, [fondo.id]: true });

      expect(conFondo.nettoAnnuo).toBeCloseTo(senzaFondi.nettoAnnuo, 6);
      // Un fondo dirigenti cambia anche l'aliquota INPS datore: si confronta il solo fondo
      const costoFondo = (r: typeof conFondo) =>
        r.contributiDatore.contributoSolidarieta +
        somma(r.ripartizione.entrate.filter((voce) => voce.categoria === 'fondi'));
      expect(costoFondo(conFondo) - costoFondo(senzaFondi)).toBeCloseTo(
        fondo.contributoDatore * 1.1,
        6,
      );
    },
  );

  it.each(FONDI_CONTRATTUALI)('$nome entra nel costo aziendale', (fondo) => {
    const conFondo = calc.calcolaStipendioNetto({ ...base, [fondo.id]: true });

    const fondiDatore = conFondo.ripartizione.entrate.filter((voce) => voce.categoria === 'fondi');

    expect(somma(fondiDatore)).toBe(fondo.contributoDatore);
    expect(conFondo.fondiContrattuali.map((dettaglio) => dettaglio.id)).toEqual([fondo.id]);
  });

  it('il contributo datore oltre il limite sanitario aumenta l’IRPEF ma non l’INPS', () => {
    const soloFasi = calc.calcolaStipendioNetto({ ...base, fasi: true });
    const fasiEFasdac = calc.calcolaStipendioNetto({ ...base, fasi: true, fasdac: true });
    const fasdac = FONDI_CONTRATTUALI.find((fondo) => fondo.id === 'fasdac')!;
    const eccedenza = fasiEFasdac.assistenzaSanitaria!.eccedenza;

    expect(eccedenza).toBeGreaterThan(0);
    expect(fasiEFasdac.contributiInps.imponibilePrevidenziale).toBe(
      soloFasi.contributiInps.imponibilePrevidenziale,
    );
    // L'eccedenza comprende la quota FASDAC del dirigente, che è una trattenuta nuova e non
    // sposta l'imponibile: il resto è contributo datore imponibile e deduzione FASI persa
    expect(fasiEFasdac.irpef.imponibileIrpef - soloFasi.irpef.imponibileIrpef).toBeCloseTo(
      eccedenza - fasdac.contributoLavoratore,
      2,
    );
    expect(fasiEFasdac.fondiContrattuali.every((fondo) => fondo.deduzione === 0)).toBe(true);
  });

  it('un fondo personalizzato dirigenti applica le aliquote INPS datore dei dirigenti', () => {
    const dirigente = calc.calcolaStipendioNetto({
      ...base,
      fondiPersonalizzati: [
        {
          contributoLavoratore: 0,
          contributoDatore: 100,
          trattamento: 'nonDeducibile',
          dirigente: true,
        },
      ],
    });
    expect(dirigente.contributiDatore.aliquotaInps).toBe(0.2654);
    expect(senzaFondi.contributiDatore.aliquotaInps).toBe(0.2898);
  });
});
