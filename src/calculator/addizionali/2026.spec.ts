import type { FiglioACarico } from '../types';
import {
  calcolaAddizionali,
  elencoComuni,
  elencoRegioni,
  haAgevolazioneContribuenteDisabile,
  type InputAddizionali,
} from './2026';
import { ADDIZIONALI_COMUNALI } from './2026.comunali';
import { ADDIZIONALI_REGIONALI } from './2026.regionali';

// Massimo consentito ai capoluoghi in disavanzo (0,8% + 0,4%)
const ALIQUOTA_COMUNALE_MASSIMA = 0.012;

const baseInput: InputAddizionali = {
  redditoComplessivo: 40_000,
  regione: 'LO',
  comune: 'F205',
  figliACarico: [],
  altriRedditiSogliaAddizionale: 0,
  irpefDovuta: true,
};

/** Scaglioni validi: limiti crescenti, finiti tranne l'ultimo che è Infinity */
function erroriScaglioni(limiti: number[]): string[] {
  const errori: string[] = [];
  if (limiti.at(-1) !== Infinity) errori.push(`ultimo limite ${limiti.at(-1)}`);
  limiti.slice(0, -1).forEach((limite, i) => {
    if (!Number.isFinite(limite)) errori.push(`limite ${i} non finito`);
    if (limite >= limiti[i + 1]) errori.push(`limite ${i} (${limite}) >= ${limiti[i + 1]}`);
  });
  return errori;
}

describe('Dataset addizionali comunali', () => {
  const comuni = Object.entries(ADDIZIONALI_COMUNALI);

  it('contiene tutti i comuni italiani', () => {
    expect(comuni.length).toBeGreaterThan(7_000);
  });

  it('ogni comune ha nome, provincia e una regione nota', () => {
    const errori = comuni
      .filter(([, c]) => !c.n || !/^[A-Z]{2}$/.test(c.p) || !(c.r in ADDIZIONALI_REGIONALI))
      .map(([codice, c]) => `${codice} ${c.n} p=${c.p} r=${c.r}`);
    expect(errori).toEqual([]);
  });

  it('ogni aliquota è positiva e non supera il massimo di legge', () => {
    const errori = comuni
      .flatMap(([codice, c]) => ('a' in c ? [c.a] : c.s.map((s) => s.a)).map((a) => [codice, a]))
      .filter(([, a]) => !(Number(a) > 0 && Number(a) <= ALIQUOTA_COMUNALE_MASSIMA));
    expect(errori).toEqual([]);
  });

  it('ogni esenzione è un importo positivo', () => {
    const errori = comuni
      .filter(([, c]) => c.e !== undefined && !(c.e > 0 && Number.isFinite(c.e)))
      .map(([codice, c]) => `${codice} e=${c.e}`);
    expect(errori).toEqual([]);
  });

  it('gli scaglioni crescono e solo l’ultimo è aperto', () => {
    const errori = comuni.flatMap(([codice, c]) =>
      's' in c ? erroriScaglioni(c.s.map((s) => s.l)).map((e) => `${codice} ${c.n}: ${e}`) : [],
    );
    expect(errori).toEqual([]);
  });
});

describe('Dataset addizionali regionali', () => {
  it('gli scaglioni crescono e solo l’ultimo è aperto', () => {
    const errori = Object.entries(ADDIZIONALI_REGIONALI).flatMap(([codice, r]) =>
      erroriScaglioni(r.scaglioni.map((s) => s.limite)).map((e) => `${codice}: ${e}`),
    );
    expect(errori).toEqual([]);
  });
});

describe('calcolaAddizionali', () => {
  it('Adro (A060): scaglioni scritti senza "euro" ("da 0 a 15.000,00")', () => {
    // 15.000 × 0,5% + 13.000 × 0,6% + 12.000 × 0,7%
    const result = calcolaAddizionali({ ...baseInput, comune: 'A060' });
    expect(result.addizionaleComunale).toBeCloseTo(75 + 78 + 84, 6);
    expect(result.aliquotaComunale).toBe(0.007);
  });

  it('Ameno (A264): scaglioni scritti con "€" e ultimo scaglione "da € 50.000,01"', () => {
    // 15.000 × 0,2% + 13.000 × 0,4% + 22.000 × 0,6% + 10.000 × 0,8%
    const result = calcolaAddizionali({ ...baseInput, comune: 'A264', redditoComplessivo: 60_000 });
    expect(result.addizionaleComunale).toBeCloseTo(30 + 52 + 132 + 80, 6);
    expect(result.aliquotaComunale).toBe(0.008);
  });

  it('IRPEF non dovuta: addizionali azzerate, esenzione comunale comunque segnalata', () => {
    const result = calcolaAddizionali({
      ...baseInput,
      redditoComplessivo: 20_000,
      irpefDovuta: false,
    });
    expect(result.totaleAddizionali).toBe(0);
    expect(result.esenzioneComunaleApplicata).toBe(true);
  });
});

describe('Agevolazioni regionali per figli e disabili', () => {
  const figlio = (eta: number, extra: Partial<FiglioACarico> = {}): FiglioACarico => ({
    eta,
    disabile: false,
    ...extra,
  });
  const regionale = (input: Partial<InputAddizionali>) =>
    calcolaAddizionali({ ...baseInput, comune: 'DEFAULT', ...input }).addizionaleRegionale;

  describe('Campania: 30 euro a figlio con almeno due figli, 40 euro a figlio disabile (reddito ≤ 28k)', () => {
    // 15.000 × 1,73% + 10.000 × 2,96%
    const lorda = 259.5 + 296;
    const campania = { regione: 'CM', redditoComplessivo: 25_000 };

    it('un solo figlio non disabile: nessuna detrazione', () => {
      expect(regionale({ ...campania, figliACarico: [figlio(10)] })).toBeCloseTo(lorda, 6);
    });

    it('due figli: 30 euro ciascuno', () => {
      expect(regionale({ ...campania, figliACarico: [figlio(10), figlio(12)] })).toBeCloseTo(
        lorda - 60,
        6,
      );
    });

    it('un solo figlio disabile: 40 euro anche senza due figli', () => {
      const figliACarico = [figlio(10, { disabile: true })];
      expect(regionale({ ...campania, figliACarico })).toBeCloseTo(lorda - 40, 6);
    });

    it('esempio della circolare di liquidazione: 30 × 50% + 30 + 40 = 85', () => {
      const figliACarico = [figlio(10, { percentualeCarico: 50 }), figlio(12, { disabile: true })];
      expect(regionale({ ...campania, figliACarico })).toBeCloseTo(lorda - 85, 6);
    });

    it('mesi a carico: detrazione rapportata a mese', () => {
      const figliACarico = [figlio(0, { mesiCarico: 6 }), figlio(12)];
      expect(regionale({ ...campania, figliACarico })).toBeCloseTo(lorda - 15 - 30, 6);
    });

    it('oltre 28.000 euro nessuna detrazione', () => {
      const figliACarico = [figlio(10), figlio(12, { disabile: true })];
      // 15.000 × 1,73% + 13.000 × 2,96% + 0,01 × 3,20%
      expect(regionale({ regione: 'CM', redditoComplessivo: 28_000.01, figliACarico })).toBeCloseTo(
        259.5 + 384.8 + 0.00032,
        6,
      );
    });

    it('i redditi con imposta sostitutiva contano nel limite', () => {
      const figliACarico = [figlio(10), figlio(12)];
      expect(
        regionale({ ...campania, figliACarico, altriRedditiSogliaAddizionale: 3_000 }),
      ).toBeCloseTo(lorda - 60, 6);
      expect(
        regionale({ ...campania, figliACarico, altriRedditiSogliaAddizionale: 3_000.01 }),
      ).toBeCloseTo(lorda, 6);
    });
  });

  describe('Marche: aliquota 1,23% con figli disabili a carico (reddito ≤ 50k)', () => {
    const marche = { regione: 'MA', redditoComplessivo: 40_000 };
    // 15.000 × 1,23% + 13.000 × 1,53% + 12.000 × 1,70%
    const ordinaria = 184.5 + 198.9 + 204;

    it('figlio disabile: 1,23% su tutto il reddito', () => {
      const result = calcolaAddizionali({
        ...baseInput,
        ...marche,
        comune: 'DEFAULT',
        figliACarico: [figlio(35, { disabile: true })],
      });
      expect(result.addizionaleRegionale).toBeCloseTo(492, 6);
      expect(result.aliquotaRegionale).toBeCloseTo(0.0123, 10);
    });

    it('figlio non disabile: scaglioni ordinari', () => {
      expect(regionale({ ...marche, figliACarico: [figlio(10)] })).toBeCloseTo(ordinaria, 6);
    });

    it('oltre 50.000 euro scaglioni ordinari anche con figlio disabile', () => {
      const figliACarico = [figlio(10, { disabile: true })];
      expect(regionale({ regione: 'MA', redditoComplessivo: 50_000, figliACarico })).toBeCloseTo(
        615,
        6,
      );
      // 15.000 × 1,23% + 13.000 × 1,53% + 22.000 × 1,70% + 0,01 × 1,73%
      expect(regionale({ regione: 'MA', redditoComplessivo: 50_000.01, figliACarico })).toBeCloseTo(
        184.5 + 198.9 + 374 + 0.000173,
        6,
      );
    });

    it('i redditi con imposta sostitutiva contano nel limite', () => {
      const figliACarico = [figlio(10, { disabile: true })];
      expect(
        regionale({ ...marche, figliACarico, altriRedditiSogliaAddizionale: 10_000.01 }),
      ).toBeCloseTo(ordinaria, 6);
    });
  });

  describe('Piemonte: 100 euro a figlio con più di due figli, 500 euro a figlio disabile', () => {
    const piemonte = { regione: 'PI', redditoComplessivo: 30_000 };
    // 15.000 × 1,62% + 13.000 × 2,68% + 2.000 × 3,31%
    const lorda = 243 + 348.4 + 66.2;

    it('tre figli: 300 euro per il quoziente (125.000 − 30.000) / 125.000', () => {
      const figliACarico = [figlio(5), figlio(8), figlio(10)];
      expect(regionale({ ...piemonte, figliACarico })).toBeCloseTo(lorda - 300 * 0.76, 6);
    });

    it('due figli: nessuna detrazione', () => {
      expect(regionale({ ...piemonte, figliACarico: [figlio(5), figlio(8)] })).toBeCloseTo(
        lorda,
        6,
      );
    });

    it('i figli non disabili di 30 anni o più non contano', () => {
      const figliACarico = [figlio(5), figlio(8), figlio(30)];
      expect(regionale({ ...piemonte, figliACarico })).toBeCloseTo(lorda, 6);
    });

    it('un figlio disabile di 30 anni: 500 euro per il quoziente (95.000 − 30.000) / 95.000', () => {
      const figliACarico = [figlio(30, { disabile: true })];
      const attesa = lorda - (500 * 65_000) / 95_000;
      expect(regionale({ ...piemonte, figliACarico })).toBeCloseTo(attesa, 6);
    });

    it('tre figli di cui uno disabile: le due detrazioni si cumulano', () => {
      const figliACarico = [figlio(5), figlio(8), figlio(10, { disabile: true })];
      expect(regionale({ ...piemonte, figliACarico })).toBeCloseTo(lorda - 800 * 0.76, 6);
    });

    it('reddito oltre il coefficiente: quoziente zero', () => {
      const figliACarico = [figlio(5), figlio(8), figlio(10, { disabile: true })];
      const senzaFigli = regionale({ regione: 'PI', redditoComplessivo: 130_000 });
      expect(regionale({ regione: 'PI', redditoComplessivo: 130_000, figliACarico })).toBe(
        senzaFigli,
      );
    });
  });

  describe('Puglia: 20 euro a figlio con più di tre figli, +375 euro a figlio disabile', () => {
    const puglia = { regione: 'PU', redditoComplessivo: 40_000 };
    // 15.000 × 1,33% + 13.000 × 1,43% + 12.000 × 1,63%
    const lorda = 199.5 + 185.9 + 195.6;
    // (95.000 + 3 × 15.000 − 40.000) / 140.000
    const quoziente = 100_000 / 140_000;

    it('quattro figli: 80 euro per il quoziente', () => {
      const figliACarico = [figlio(3), figlio(6), figlio(9), figlio(12)];
      expect(regionale({ ...puglia, figliACarico })).toBeCloseTo(lorda - 80 * quoziente, 6);
    });

    it('quattro figli di cui uno disabile: 455 euro per il quoziente', () => {
      const figliACarico = [figlio(3), figlio(6), figlio(9), figlio(12, { disabile: true })];
      expect(regionale({ ...puglia, figliACarico })).toBeCloseTo(lorda - 455 * quoziente, 6);
    });

    it('tre figli di cui uno disabile: nessuna detrazione', () => {
      const figliACarico = [figlio(3), figlio(6), figlio(9, { disabile: true })];
      expect(regionale({ ...puglia, figliACarico })).toBeCloseTo(lorda, 6);
    });

    it('la detrazione non genera credito', () => {
      const figliACarico = [figlio(3), figlio(6), figlio(9), figlio(12, { disabile: true })];
      expect(regionale({ regione: 'PU', redditoComplessivo: 20_000, figliACarico })).toBe(0);
    });
  });

  describe('Sardegna: 200 euro a figlio minorenne, 300 se disabile (reddito ≤ 50k)', () => {
    const sardegna = { regione: 'SA', redditoComplessivo: 30_000 };
    const lorda = 369;

    it('figlio minorenne: 200 euro', () => {
      expect(regionale({ ...sardegna, figliACarico: [figlio(10)] })).toBeCloseTo(lorda - 200, 6);
    });

    it('figlio maggiorenne: nessuna detrazione', () => {
      expect(regionale({ ...sardegna, figliACarico: [figlio(18)] })).toBeCloseTo(lorda, 6);
    });

    it('figlio minorenne disabile: 300 euro', () => {
      const figliACarico = [figlio(10, { disabile: true })];
      expect(regionale({ ...sardegna, figliACarico })).toBeCloseTo(lorda - 300, 6);
    });

    it('figlio maggiorenne disabile: nessuna detrazione', () => {
      const figliACarico = [figlio(20, { disabile: true })];
      expect(regionale({ ...sardegna, figliACarico })).toBeCloseTo(lorda, 6);
    });

    it('percentuale e mesi a carico: 200 × 50% × 6/12', () => {
      const figliACarico = [figlio(10, { percentualeCarico: 50, mesiCarico: 6 })];
      expect(regionale({ ...sardegna, figliACarico })).toBeCloseTo(lorda - 50, 6);
    });

    it('oltre 50.000 euro nessuna detrazione', () => {
      expect(
        regionale({ regione: 'SA', redditoComplessivo: 50_000.01, figliACarico: [figlio(10)] }),
      ).toBeCloseTo(50_000.01 * 0.0123, 6);
    });
  });

  describe('Veneto: aliquota 0,90% per contribuenti disabili o con familiari disabili (reddito ≤ 50k)', () => {
    const veneto = { regione: 'VE', redditoComplessivo: 40_000 };

    it('contribuente disabile', () => {
      const result = calcolaAddizionali({
        ...baseInput,
        ...veneto,
        comune: 'DEFAULT',
        contribuenteDisabile: true,
      });
      expect(result.addizionaleRegionale).toBeCloseTo(360, 6);
      expect(result.aliquotaRegionale).toBeCloseTo(0.009, 10);
    });

    it('figlio disabile a carico', () => {
      const figliACarico = [figlio(25, { disabile: true })];
      expect(regionale({ ...veneto, figliACarico })).toBeCloseTo(360, 6);
    });

    it('senza disabilità: 1,23%', () => {
      expect(regionale({ ...veneto, figliACarico: [figlio(10)] })).toBeCloseTo(492, 6);
    });

    it('oltre 50.000 euro: 1,23%', () => {
      expect(
        regionale({ regione: 'VE', redditoComplessivo: 50_000.01, contribuenteDisabile: true }),
      ).toBeCloseTo(50_000.01 * 0.0123, 6);
    });

    it('il flag non ha effetto nelle altre regioni', () => {
      expect(regionale({ regione: 'LO', contribuenteDisabile: true })).toBe(
        regionale({ regione: 'LO' }),
      );
    });
  });

  it('haAgevolazioneContribuenteDisabile solo per il Veneto', () => {
    const regioni = Object.keys(ADDIZIONALI_REGIONALI).filter(haAgevolazioneContribuenteDisabile);
    expect(regioni).toEqual(['VE']);
  });
});

describe('Elenchi per la form', () => {
  it('le regioni escludono DEFAULT e sono ordinate per nome', () => {
    const nomi = elencoRegioni().map((r) => r.nome);
    expect(elencoRegioni().some((r) => r.codice === 'DEFAULT')).toBe(false);
    expect(nomi).toEqual([...nomi].sort((a, b) => a.localeCompare(b, 'it')));
  });

  it('i comuni sono filtrati per regione', () => {
    const comuni = elencoComuni('LO');
    expect(comuni).toContainEqual({ codice: 'F205', nome: 'Milano' });
    expect(comuni.every((c) => ADDIZIONALI_COMUNALI[c.codice].r === 'LO')).toBe(true);
    expect(elencoComuni('ZZ')).toEqual([]);
  });
});
