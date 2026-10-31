import type { DettaglioAddizionali, FiglioACarico } from '../types';
import { ADDIZIONALE_DEFAULT, ADDIZIONALI_COMUNALI } from './2026.comunali';
import { ADDIZIONALI_REGIONALI, REGIONE_LABELS } from './2026.regionali';

/**
 * Addizionale comunale nel formato compatto generato da data/convert_addizionali_comunali.py.
 * Le chiavi sono brevi perché il file contiene oltre 7.000 comuni.
 */
export type AddizionaleComunale = {
  n: string; // nome
  p: string; // provincia
  r: string; // regione
  e?: number; // esenzione
} & (
  | {
      a: number; // aliquota
    }
  | {
      // scaglioni progressivi: l è il limite superiore, Infinity nell'ultimo
      s: Array<{
        l: number; // limite
        a: number; // aliquota
      }>;
    }
);

/** Regole dell'addizionale regionale */
export interface AddizionaleRegionale {
  scaglioni: Array<{ limite: number; aliquota: number }>;
  esenzione?: number;
  aliquotaRidotta?: { limiteReddito: number; aliquota: number };
  detrazioneBase?: { sogliaReddito?: number; limiteReddito: number; importo: number };
  detrazioneSupplementare?: { sogliaReddito: number; intervalloReddito: number; importo: number };
  detrazioneFigli?: { limiteReddito: number; importo: number };
  // I redditi con imposta sostitutiva concorrono ai limiti di reddito delle detrazioni
  redditiSostitutiviInSoglia?: boolean;
  note?: string;
}

export interface InputAddizionali {
  /** Reddito complessivo, base imponibile di entrambe le addizionali */
  redditoComplessivo: number;
  regione: string;
  comune: string;
  /** Figli entro il limite di reddito dell'art. 12, comma 2, TUIR */
  figliACarico: FiglioACarico[];
  /** Redditi con imposta sostitutiva, per le regioni che li contano nelle soglie */
  altriRedditiSogliaAddizionale: number;
  /** Le addizionali sono dovute solo se risulta dovuta l'IRPEF */
  irpefDovuta: boolean;
}

export function calcolaAddizionali(input: InputAddizionali): DettaglioAddizionali {
  const regionale = calcolaAddizionaleRegionale(input);
  const comunale = calcolaAddizionaleComunale(input.redditoComplessivo, input.comune);
  const dovute = input.irpefDovuta;

  return {
    addizionaleRegionale: dovute ? regionale.addizionale : 0,
    aliquotaRegionale: dovute ? regionale.aliquotaMedia : 0,
    addizionaleComunale: dovute ? comunale.addizionale : 0,
    aliquotaComunale: dovute ? comunale.aliquota : 0,
    esenzioneComunaleApplicata: comunale.esenzioneApplicata,
    totaleAddizionali: dovute ? regionale.addizionale + comunale.addizionale : 0,
  };
}

/** Regioni selezionabili, ordinate per nome */
export function elencoRegioni(): Array<{ codice: string; nome: string }> {
  return Object.keys(ADDIZIONALI_REGIONALI)
    .filter((codice) => codice !== 'DEFAULT')
    .map((codice) => ({ codice, nome: REGIONE_LABELS[codice] ?? codice }))
    .sort((a, b) => a.nome.localeCompare(b.nome, 'it'));
}

const COMUNI_PER_REGIONE = new Map<string, Array<{ codice: string; nome: string }>>();
for (const [codice, comune] of Object.entries(ADDIZIONALI_COMUNALI)) {
  const comuni = COMUNI_PER_REGIONE.get(comune.r) ?? [];
  comuni.push({ codice, nome: comune.n });
  COMUNI_PER_REGIONE.set(comune.r, comuni);
}
for (const comuni of COMUNI_PER_REGIONE.values()) {
  comuni.sort((a, b) => a.nome.localeCompare(b.nome, 'it'));
}

/** Comuni della regione, ordinati per nome */
export function elencoComuni(regione: string): ReadonlyArray<{ codice: string; nome: string }> {
  return COMUNI_PER_REGIONE.get(regione) ?? [];
}

/** La regione prevede una detrazione per figli proporzionata ai mesi a carico */
export function haDetrazioneFigliRegionale(regione: string): boolean {
  return ADDIZIONALI_REGIONALI[regione.toUpperCase()]?.detrazioneFigli !== undefined;
}

/** La regione include i redditi con imposta sostitutiva nei limiti delle detrazioni */
export function haRedditiSostitutiviInSoglia(regione: string): boolean {
  return ADDIZIONALI_REGIONALI[regione.toUpperCase()]?.redditiSostitutiviInSoglia === true;
}

function calcolaAddizionaleRegionale({
  redditoComplessivo: imponibile,
  regione,
  figliACarico,
  altriRedditiSogliaAddizionale,
}: InputAddizionali): { addizionale: number; aliquotaMedia: number } {
  const config = ADDIZIONALI_REGIONALI[regione.toUpperCase()] ?? ADDIZIONALI_REGIONALI['DEFAULT'];

  if (config.esenzione !== undefined && imponibile <= config.esenzione) {
    return { addizionale: 0, aliquotaMedia: 0 };
  }

  let addizionaleTotale = 0;
  let imponibileResiduo = imponibile;
  let limiteInferiore = 0;

  const scaglioni =
    config.aliquotaRidotta && imponibile <= config.aliquotaRidotta.limiteReddito
      ? [{ limite: Infinity, aliquota: config.aliquotaRidotta.aliquota }]
      : config.scaglioni;

  for (const scaglione of scaglioni) {
    if (imponibileResiduo <= 0) break;

    const ampiezzaScaglione = scaglione.limite - limiteInferiore;
    const imponibileScaglione = Math.min(imponibileResiduo, ampiezzaScaglione);
    addizionaleTotale += imponibileScaglione * scaglione.aliquota;

    imponibileResiduo -= imponibileScaglione;
    limiteInferiore = scaglione.limite;
  }

  const redditoSoglia =
    imponibile + (config.redditiSostitutiviInSoglia ? altriRedditiSogliaAddizionale : 0);

  if (
    config.detrazioneBase &&
    redditoSoglia > (config.detrazioneBase.sogliaReddito ?? 0) &&
    redditoSoglia <= config.detrazioneBase.limiteReddito
  ) {
    addizionaleTotale -= config.detrazioneBase.importo;
  }

  if (config.detrazioneSupplementare && imponibile > config.detrazioneSupplementare.sogliaReddito) {
    const rapporto = Math.min(
      1,
      (imponibile - config.detrazioneSupplementare.sogliaReddito) /
        config.detrazioneSupplementare.intervalloReddito,
    );
    addizionaleTotale -= config.detrazioneSupplementare.importo * rapporto;
  }

  if (config.detrazioneFigli && redditoSoglia <= config.detrazioneFigli.limiteReddito) {
    // I requisiti regionali richiamano l'art. 12, comma 2, senza i limiti di età delle detrazioni IRPEF.
    for (const figlio of figliACarico) {
      const percentuale = (figlio.percentualeCarico ?? 100) / 100;
      const mesi = Math.min(12, Math.max(0, figlio.mesiCarico ?? 12));
      addizionaleTotale -= config.detrazioneFigli.importo * percentuale * (mesi / 12);
    }
  }

  addizionaleTotale = Math.max(0, addizionaleTotale);
  const aliquotaMedia = imponibile > 0 ? addizionaleTotale / imponibile : 0;

  return { addizionale: addizionaleTotale, aliquotaMedia };
}

function calcolaAddizionaleComunale(
  imponibile: number,
  comune: string,
): { addizionale: number; aliquota: number; esenzioneApplicata: boolean } {
  const config = ADDIZIONALI_COMUNALI[comune.toUpperCase()];

  if (config == null) {
    const addizionale = imponibile * ADDIZIONALE_DEFAULT;
    return { addizionale, aliquota: ADDIZIONALE_DEFAULT, esenzioneApplicata: false };
  }

  if (config.e && imponibile <= config.e) {
    const aliquotaDefault = 'a' in config ? config.a : config.s[0].a;
    return { addizionale: 0, aliquota: aliquotaDefault, esenzioneApplicata: true };
  }

  // Gestione scaglioni progressivi (es. Torino)
  if ('s' in config) {
    let addizionale = 0;
    let residuo = imponibile;
    let precedente = 0;
    let aliquotaEffettiva = 0;

    for (const scaglione of config.s) {
      const importoScaglione = Math.min(residuo, scaglione.l - precedente);
      if (importoScaglione > 0) {
        addizionale += importoScaglione * scaglione.a;
        aliquotaEffettiva = scaglione.a;
      }
      residuo -= importoScaglione;
      precedente = scaglione.l;
      if (residuo <= 0) break;
    }

    return { addizionale, aliquota: aliquotaEffettiva, esenzioneApplicata: false };
  }

  const addizionale = imponibile * config.a;

  return { addizionale, aliquota: config.a, esenzioneApplicata: false };
}
