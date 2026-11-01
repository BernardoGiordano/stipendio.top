import type {
  DettaglioContributiDatore,
  OpzioniDatore,
  TipoContratto,
  TipoEsoneroContributivo,
  VoceEntrata,
} from '../types';

/** Aliquote contributive INPS a carico del datore di lavoro (Commercio/Terziario 2026) */
const ALIQUOTE_INPS_DATORE = {
  /** Quota IVS (FPLD) inclusa nelle aliquote, l'unica soggetta al massimale contributivo */
  ivs: 0.2381,
  /** Operai/impiegati senza CIGS (≤50 dip. commercio) */
  base: 0.2898,
  /** Con CIGS */
  conCigs: 0.2968,
  /** Apprendistato (aliquota agevolata, comprende il premio INAIL) */
  apprendista: 0.1161,
  /**
   * Apprendistato in aziende fino a 9 dipendenti: 1,5% il primo anno e 3% il secondo al posto
   * del 10% (art. 1, c. 773, L. 296/2006), più NASpI 1,31% e formazione 0,30%
   */
  apprendistaFinoA9Dipendenti: [0.0311, 0.0461],
  /** Dirigenti senza CIGS */
  dirigente: 0.2654,
  /** Dirigenti con CIGS */
  dirigenteConCigs: 0.2724,
} as const;

/**
 * Contributo addizionale NASpI sui contratti a tempo determinato (art. 2, c. 28, L. 92/2012),
 * aumentato di 0,5 punti a ogni rinnovo (art. 3, c. 2, D.L. 87/2018)
 */
const ADDIZIONALE_NASPI = {
  aliquota: 0.014,
  aumentoPerRinnovo: 0.005,
} as const;

/**
 * Contributo di solidarietà sui contributi datore a previdenza complementare e assistenza
 * sanitaria (art. 16 D.Lgs. 252/2005, art. 9-bis D.L. 103/1991)
 */
const CONTRIBUTO_SOLIDARIETA = 0.1;

/** Parametri TFR (Art. 2120 c.c.) */
const TFR = {
  divisore: 13.5,
  /**
   * Contributo aggiuntivo IVS, compreso nell'aliquota datore, che il datore recupera sulla quota
   * di TFR (art. 3, c. 15-16, L. 297/1982). Non è dovuto per gli apprendisti.
   */
  contributoAggiuntivoIvs: 0.005,
} as const;

/** Descrizione della voce dei contributi INPS datore, al netto dell'esonero */
export const VOCE_INPS_DATORE = 'Contributi INPS Datore';

/** Esonero con quota e tetto mensile fissati dalla norma */
export interface EsoneroPredefinito {
  id: Exclude<TipoEsoneroContributivo, 'personalizzato'>;
  nome: string;
  /** Quota esonerata dei contributi INPS datore */
  percentuale: number;
  /** Tetto mensile (€) */
  tettoMensile: number;
  descrizione: string;
}

/** Esoneri per le assunzioni del D.L. 60/2024 (Decreto Coesione), fino a 24 mesi */
export const ESONERI_CONTRIBUTIVI: readonly EsoneroPredefinito[] = [
  {
    id: 'giovani',
    nome: 'Bonus Giovani',
    percentuale: 1,
    tettoMensile: 500,
    descrizione:
      'Under 35 mai assunti a tempo indeterminato (art. 22 D.L. 60/2024): 100% dei contributi fino a 500 euro al mese.',
  },
  {
    id: 'giovaniZes',
    nome: 'Bonus Giovani (ZES unica)',
    percentuale: 1,
    tettoMensile: 650,
    descrizione:
      'Bonus Giovani per sedi nella ZES unica del Mezzogiorno (art. 22, c. 3, D.L. 60/2024): 100% dei contributi fino a 650 euro al mese.',
  },
  {
    id: 'donne',
    nome: 'Bonus Donne',
    percentuale: 1,
    tettoMensile: 650,
    descrizione:
      'Donne svantaggiate (art. 23 D.L. 60/2024): 100% dei contributi fino a 650 euro al mese.',
  },
  {
    id: 'zes',
    nome: 'Bonus ZES',
    percentuale: 1,
    tettoMensile: 650,
    descrizione:
      'Over 35 disoccupati da almeno 24 mesi, in aziende fino a 10 dipendenti nella ZES unica (art. 24 D.L. 60/2024): 100% dei contributi fino a 650 euro al mese.',
  },
];

export interface InputCostiDatore {
  ral: number;
  tipoContratto: TipoContratto;
  aziendaConCigs: boolean;
  isDirigente: boolean;
  /** Imponibile previdenziale intero, base delle contribuzioni minori, NASpI e INAIL */
  imponibilePrevidenziale: number;
  /** Imponibile entro il massimale contributivo, base della quota IVS */
  imponibileEntroMassimale: number;
  /** Contributi datore a previdenza complementare e assistenza sanitaria */
  baseContributoSolidarieta: number;
  opzioni: OpzioniDatore | undefined;
}

export interface CalcoloCostiDatore {
  /** INPS, addizionale NASpI, solidarietà, INAIL e TFR: pagati dal datore e accantonati */
  entrate: VoceEntrata[];
  dettaglio: DettaglioContributiDatore;
}

function calcolaAliquotaInpsDatore(
  tipoContratto: TipoContratto,
  aziendaConCigs: boolean,
  isDirigente: boolean,
  opzioni?: OpzioniDatore,
): number {
  if (tipoContratto === 'apprendistato') {
    if (opzioni?.apprendistatoFinoA9Dipendenti) {
      const anno = opzioni.annoApprendistato ?? 3;
      return (
        ALIQUOTE_INPS_DATORE.apprendistaFinoA9Dipendenti[anno - 1] ??
        ALIQUOTE_INPS_DATORE.apprendista
      );
    }
    return ALIQUOTE_INPS_DATORE.apprendista;
  }
  if (isDirigente) {
    return aziendaConCigs ? ALIQUOTE_INPS_DATORE.dirigenteConCigs : ALIQUOTE_INPS_DATORE.dirigente;
  }
  return aziendaConCigs ? ALIQUOTE_INPS_DATORE.conCigs : ALIQUOTE_INPS_DATORE.base;
}

/**
 * Contributi INPS a carico del datore. Il massimale contributivo (art. 2, c. 18, L. 335/1995)
 * limita la sola quota IVS: le contribuzioni minori (NASpI, CUAF, malattia, maternità, CIG,
 * Fondo di garanzia TFR) restano dovute sull'intero imponibile. L'aliquota apprendisti è
 * forfettaria e si applica per intero all'imponibile entro il massimale.
 */
function calcolaContributiInpsDatore(
  imponibileLordo: number,
  imponibileEntroMassimale: number,
  aliquota: number,
  tipoContratto: TipoContratto,
): number {
  if (tipoContratto === 'apprendistato') {
    return imponibileEntroMassimale * aliquota;
  }
  const quotaIvs = Math.min(aliquota, ALIQUOTE_INPS_DATORE.ivs);
  return imponibileEntroMassimale * quotaIvs + imponibileLordo * (aliquota - quotaIvs);
}

/** Mesi interi tra 0 e 12, 12 se non indicati */
function mesiNellAnno(mesi: number | undefined): number {
  return Math.min(12, Math.max(0, Math.round(mesi ?? 12)));
}

/**
 * Esonero sui contributi INPS datore, esclusi INAIL, addizionale NASpI e solidarietà. Il calcolo
 * è annuo: la quota si applica ai contributi dei mesi di esonero, nel limite del tetto mensile
 * moltiplicato per gli stessi mesi.
 */
function calcolaEsonero(contributiInps: number, opzioni: OpzioniDatore | undefined): number {
  const esonero = opzioni?.esonero;
  if (!esonero) return 0;

  const predefinito = ESONERI_CONTRIBUTIVI.find((e) => e.id === esonero.tipo);
  const percentuale = predefinito
    ? predefinito.percentuale
    : Math.min(100, Math.max(0, esonero.percentuale ?? 0)) / 100;
  const tettoMensile = predefinito ? predefinito.tettoMensile : (esonero.tettoMensile ?? 0);
  const mesi = mesiNellAnno(esonero.mesi);

  const quota = contributiInps * percentuale * (mesi / 12);
  return tettoMensile > 0 ? Math.min(quota, tettoMensile * mesi) : quota;
}

function aliquotaAddizionaleNaspi(
  tipoContratto: TipoContratto,
  opzioni: OpzioniDatore | undefined,
): number {
  if (tipoContratto !== 'determinato') return 0;
  const rinnovi = Math.max(0, Math.round(opzioni?.rinnoviTempoDeterminato ?? 0));
  return ADDIZIONALE_NASPI.aliquota + rinnovi * ADDIZIONALE_NASPI.aumentoPerRinnovo;
}

export function calcolaCostiDatore(input: InputCostiDatore): CalcoloCostiDatore {
  const {
    ral,
    tipoContratto,
    aziendaConCigs,
    isDirigente,
    imponibilePrevidenziale,
    imponibileEntroMassimale,
    baseContributoSolidarieta,
    opzioni,
  } = input;
  const apprendista = tipoContratto === 'apprendistato';

  // INPS datore, ridotto dell'eventuale esonero
  const aliquotaInps = calcolaAliquotaInpsDatore(
    tipoContratto,
    aziendaConCigs,
    isDirigente,
    opzioni,
  );
  const contributiInpsLordi = calcolaContributiInpsDatore(
    imponibilePrevidenziale,
    imponibileEntroMassimale,
    aliquotaInps,
    tipoContratto,
  );
  const esonero = calcolaEsonero(contributiInpsLordi, opzioni);

  // Addizionale NASpI: contribuzione minore, dovuta sull'intero imponibile
  const aliquotaNaspi = aliquotaAddizionaleNaspi(tipoContratto, opzioni);
  const addizionaleNaspi = imponibilePrevidenziale * aliquotaNaspi;

  // INAIL: stessa base imponibile INPS, senza massimale. Per gli apprendisti il premio è
  // compreso nell'aliquota INPS (art. 1, c. 773, L. 296/2006)
  const tassoInail = apprendista ? 0 : Math.max(0, opzioni?.tassoInail ?? 0) / 1000;
  const premioInail = imponibilePrevidenziale * tassoInail;

  const contributoSolidarieta = baseContributoSolidarieta * CONTRIBUTO_SOLIDARIETA;

  // TFR al netto dello 0,50% IVS già versato con i contributi datore. Se l'esonero copre i
  // contributi, lo 0,50% non è versato e non si recupera (Messaggio INPS 1817/2019): la riduzione
  // segue la quota di contributi non esonerata
  const tfrLordo = ral / TFR.divisore;
  const quotaNonEsonerata = contributiInpsLordi > 0 ? 1 - esonero / contributiInpsLordi : 1;
  const riduzioneTfr = apprendista
    ? 0
    : Math.min(
        tfrLordo,
        imponibileEntroMassimale * TFR.contributoAggiuntivoIvs * quotaNonEsonerata,
      );

  const voce = (
    descrizione: string,
    importo: number,
    categoria: VoceEntrata['categoria'],
    aliquota?: number,
  ): VoceEntrata => ({
    descrizione,
    importo,
    categoria,
    pagatore: 'datore',
    destinazione: 'accantonata',
    ...(aliquota !== undefined && { aliquota }),
  });

  return {
    entrate: [
      voce(VOCE_INPS_DATORE, contributiInpsLordi - esonero, 'contributiDatore', aliquotaInps),
      voce('Addizionale NASpI', addizionaleNaspi, 'contributiDatore', aliquotaNaspi),
      voce(
        'Contributo di solidarietà',
        contributoSolidarieta,
        'contributiDatore',
        CONTRIBUTO_SOLIDARIETA,
      ),
      voce('Premio INAIL', premioInail, 'inail', tassoInail),
      voce('TFR', tfrLordo - riduzioneTfr, 'tfr'),
    ],
    dettaglio: {
      aliquotaInps,
      contributiInpsLordi,
      esonero,
      aliquotaAddizionaleNaspi: aliquotaNaspi,
      addizionaleNaspi,
      tassoInail,
      premioInail,
      baseContributoSolidarieta,
      contributoSolidarieta,
      tfrLordo,
      riduzioneTfr,
    },
  };
}
