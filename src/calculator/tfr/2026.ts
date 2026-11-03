import type { DestinazioneTfr, DettaglioTfr, OpzioniTfr } from '../types';

/**
 * Rivalutazione annua del TFR accantonato (art. 2120, c. 4, c.c.): 1,5% fisso più il 75%
 * dell'aumento dell'indice FOI ISTAT, dicembre su dicembre. Se l'indice scende la quota
 * variabile è zero. Si applica al fondo accantonato al 31 dicembre dell'anno precedente.
 */
export const RIVALUTAZIONE_TFR = {
  fissa: 0.015,
  quotaInflazione: 0.75,
} as const;

/**
 * Imposta sostitutiva sulla rivalutazione (art. 11, c. 3, D.Lgs. 47/2000), al 17% dal 2015
 * (art. 1, c. 623, L. 190/2014). È a carico del lavoratore e trattenuta dal fondo TFR.
 */
export const IMPOSTA_SOSTITUTIVA_RIVALUTAZIONE = 0.17;

/**
 * Tassazione della prestazione del fondo pensione (art. 11, c. 6, D.Lgs. 252/2005): ritenuta
 * a titolo d'imposta del 15%, ridotta di 0,30 punti per ogni anno di partecipazione oltre il
 * quindicesimo, fino al 9% (riduzione massima di 6 punti)
 */
export const ALIQUOTA_FONDO_PENSIONE = {
  base: 0.15,
  anniPieni: 15,
  riduzioneAnnua: 0.003,
  minima: 0.09,
} as const;

/** Inflazione FOI annua attesa se non indicata, in percentuale (obiettivo BCE) */
export const INFLAZIONE_ATTESA_DEFAULT = 2;

/**
 * Detrazione sul TFR (art. 2, c. 514, L. 244/2007 e D.M. 20 marzo 2008), per i rapporti cessati
 * dal 1° aprile 2008: spetta una sola volta per cessazione, decresce con il reddito di riferimento
 * e si azzera a 30.000 euro
 */
export const DETRAZIONE_TFR = {
  /** Detrazione piena fino a 7.500 euro di reddito di riferimento */
  piena: 70,
  sogliaPiena: 7_500,
  /** Tra 7.500 e 28.000 euro: 50 euro più 20 euro × (28.000 − reddito) / 20.500 */
  intermedia: 50,
  variabile: 20,
  sogliaIntermedia: 28_000,
  /** Tra 28.000 e 30.000 euro: 50 euro × (30.000 − reddito) / 2.000 */
  sogliaFinale: 30_000,
} as const;

export interface InputTfr {
  /** Quota annua accantonata: RAL / 13,5 meno lo 0,50% IVS recuperato dal datore */
  quotaAnnua: number;
  opzioni: OpzioniTfr | undefined;
  /** IRPEF lorda per scaglioni dell'anno della cessazione, senza detrazioni */
  irpefLorda: (imponibile: number) => number;
}

/** Detrazione del D.M. 20 marzo 2008 in base al reddito di riferimento */
export function detrazioneTfr(redditoRiferimento: number): number {
  const d = DETRAZIONE_TFR;
  if (redditoRiferimento <= d.sogliaPiena) return d.piena;
  if (redditoRiferimento <= d.sogliaIntermedia) {
    return (
      d.intermedia +
      (d.variabile * (d.sogliaIntermedia - redditoRiferimento)) /
        (d.sogliaIntermedia - d.sogliaPiena)
    );
  }
  if (redditoRiferimento <= d.sogliaFinale) {
    return (
      (d.intermedia * (d.sogliaFinale - redditoRiferimento)) / (d.sogliaFinale - d.sogliaIntermedia)
    );
  }
  return 0;
}

/** Aliquota sulla prestazione del fondo pensione per gli anni di partecipazione */
export function aliquotaFondoPensione(anniPartecipazione: number): number {
  const a = ALIQUOTA_FONDO_PENSIONE;
  const anniOltre = Math.max(0, anniPartecipazione - a.anniPieni);
  return Math.max(a.minima, a.base - anniOltre * a.riduzioneAnnua);
}

/** Tasso di rivalutazione annuo del TFR per un'inflazione FOI attesa (in percentuale) */
export function tassoRivalutazioneTfr(inflazioneAttesa: number): number {
  return (
    RIVALUTAZIONE_TFR.fissa +
    RIVALUTAZIONE_TFR.quotaInflazione * Math.max(0, inflazioneAttesa / 100)
  );
}

/**
 * Stima del TFR netto alla cessazione, a RAL costante per gli anni di servizio indicati.
 *
 * TFR in azienda (o al Fondo di Tesoreria INPS): ogni anno il fondo accantonato al 31 dicembre
 * precedente si rivaluta e la rivalutazione sconta l'imposta sostitutiva del 17%, trattenuta dal
 * fondo. Alla cessazione le quote accantonate, al netto delle rivalutazioni già tassate, sono
 * soggette a tassazione separata (art. 17, c. 1, lett. a, e art. 19 TUIR): l'aliquota media
 * IRPEF si calcola sul reddito di riferimento, cioè l'imponibile diviso gli anni di servizio e
 * moltiplicato per dodici, con gli scaglioni dell'anno della cessazione; l'imposta è ridotta
 * della detrazione del D.M. 20 marzo 2008. L'Agenzia delle Entrate riliquida poi l'imposta con
 * l'aliquota media dei cinque anni precedenti.
 *
 * TFR al fondo pensione: niente rivalutazione legale (i rendimenti del fondo, tassati a parte,
 * non sono stimati); la prestazione è tassata al 15%, ridotto fino al 9% con l'anzianità di
 * iscrizione, che si assume pari agli anni di servizio.
 */
export function calcolaTfr({ quotaAnnua, opzioni, irpefLorda }: InputTfr): DettaglioTfr {
  const anniServizio = Math.max(1, Math.round(opzioni?.anniServizio ?? 1));
  const destinazione: DestinazioneTfr = opzioni?.destinazione ?? 'azienda';
  const inflazioneAttesa = opzioni?.inflazioneAttesa ?? INFLAZIONE_ATTESA_DEFAULT;
  const quoteAccantonate = quotaAnnua * anniServizio;

  let tassoRivalutazione = 0;
  let rivalutazione = 0;
  let impostaSostitutiva = 0;
  if (destinazione === 'azienda') {
    tassoRivalutazione = tassoRivalutazioneTfr(inflazioneAttesa);
    let fondo = 0;
    for (let anno = 1; anno <= anniServizio; anno++) {
      const rivalutazioneAnno = fondo * tassoRivalutazione;
      const impostaAnno = rivalutazioneAnno * IMPOSTA_SOSTITUTIVA_RIVALUTAZIONE;
      rivalutazione += rivalutazioneAnno;
      impostaSostitutiva += impostaAnno;
      fondo += rivalutazioneAnno - impostaAnno + quotaAnnua;
    }
  }
  const montanteLordo = quoteAccantonate + rivalutazione - impostaSostitutiva;

  // Le rivalutazioni, già tassate, restano fuori dall'imponibile e dal reddito di riferimento
  const redditoRiferimento = (quoteAccantonate * 12) / anniServizio;
  let aliquota: number;
  let detrazione = 0;
  if (destinazione === 'azienda') {
    aliquota = redditoRiferimento > 0 ? irpefLorda(redditoRiferimento) / redditoRiferimento : 0;
  } else {
    aliquota = aliquotaFondoPensione(anniServizio);
  }
  const impostaLorda = quoteAccantonate * aliquota;
  if (destinazione === 'azienda') {
    detrazione = Math.min(impostaLorda, detrazioneTfr(redditoRiferimento));
  }
  const imposta = impostaLorda - detrazione;
  const nettoTotale = montanteLordo - imposta;
  const lordoMaturato = quoteAccantonate + rivalutazione;

  return {
    destinazione,
    anniServizio,
    quotaAnnua,
    quoteAccantonate,
    tassoRivalutazione,
    rivalutazione,
    impostaSostitutiva,
    montanteLordo,
    redditoRiferimento,
    aliquota,
    impostaLorda,
    detrazione,
    imposta,
    nettoTotale,
    nettoAnnuo: nettoTotale / anniServizio,
    aliquotaEffettiva: lordoMaturato > 0 ? (imposta + impostaSostitutiva) / lordoMaturato : 0,
  };
}
