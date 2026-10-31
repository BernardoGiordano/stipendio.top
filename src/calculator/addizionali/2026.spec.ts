import { calcolaAddizionali, elencoComuni, elencoRegioni, type InputAddizionali } from './2026';
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
