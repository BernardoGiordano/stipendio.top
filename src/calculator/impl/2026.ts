import {
  AscendenteACarico,
  AutoAziendale,
  BenefitNonTassati,
  BorsaDiStudio,
  CategoriaEntrata,
  ConiugeACarico,
  DettaglioBenefitNonTassati,
  DettaglioBorsaDiStudio,
  DettaglioContributiInps,
  DettaglioCuneoFiscale,
  DettaglioDetrazioniFamiliari,
  DettaglioDetrazioniLavoro,
  DettaglioFringeBenefit,
  DettaglioIrpef,
  DettaglioRegimeImpatriati,
  DettaglioRimborsiTrasferta,
  DettaglioTrattamentoIntegrativo,
  DestinazioneVoce,
  FiglioACarico,
  FringeBenefit,
  InputCalcoloStipendio,
  OutputCalcoloStipendio,
  RiepilogoDetrazioni,
  RimborsiTrasferta,
  TipoContratto,
  VoceEntrata,
  VoceTrattenuta,
} from '../types';
import { StipendioCalculator } from '../calculator';
import { calcolaAddizionali } from '../addizionali/2026';
import { calcolaFondi, dettagliFondi } from '../fondi/2026';
import { ripartisci, totali } from '../ripartizione';

/** Scaglioni IRPEF 2026 (aliquota intermedia ridotta) */
const IRPEF_SCAGLIONI = [
  { limite: 28_000, aliquota: 0.23 },
  { limite: 50_000, aliquota: 0.33 },
  { limite: Infinity, aliquota: 0.43 },
] as const;

/** Soglie esenzione fringe benefit 2026 */
const FRINGE_BENEFIT = {
  sogliaSenzaFigli: 1_000,
  sogliaConFigli: 2_000,
} as const;

/** Soglia buoni pasto elettronici 2026 (aumentata) */
const BUONI_PASTO_ELETTRONICI = 10.0;

/** Percentuali calcolo fringe benefit auto aziendale uso promiscuo (2026) */
const AUTO_AZIENDALE = {
  percorrenzaConvenzionale: 15_000,
  percentualeElettrico: 0.1,
  percentualeIbridoPlugIn: 0.2,
  percentualeAltri: 0.5,
} as const;

/** Percentuali calcolo fringe benefit auto (regime pre-2025, basato su CO2) */
const AUTO_AZIENDALE_PRE_2025 = {
  percentualeBassaEmissione: 0.25,
  percentualeMediaEmissione: 0.3,
  percentualeAltaEmissione: 0.5,
  percentualeMoltoAltaEmissione: 0.6,
} as const;

/** Parametri cuneo fiscale 2026 */
const CUNEO_FISCALE = {
  sogliaIndennita: 20_000,
  sogliaDetrazione: 40_000,
  percentualiIndennita: [
    { limite: 8_500, percentuale: 0.071 },
    { limite: 15_000, percentuale: 0.053 },
    { limite: 20_000, percentuale: 0.048 },
  ],
  detrazioneBase: 1_000,
  sogliaDecalage: 32_000,
} as const;

/** Parametri trattamento integrativo */
const TRATTAMENTO_INTEGRATIVO = {
  importoMassimo: 1_200,
  sogliaPiena: 15_000,
  sogliaParziale: 28_000,
  clausolaSalvaguardia: 75,
} as const;

/** Aliquote contributive INPS */
const ALIQUOTE_INPS = {
  baseWorker: 0.0919,
  conCigs: 0.0949,
  apprendista: 0.0584,
  aggiuntivo: 0.01,
  // Soglie 2026 (circolare INPS n. 6 del 30 gennaio 2026)
  sogliaAggiuntivo: 56_224,
  massimale: 122_295,
} as const;

/** Parametri detrazioni lavoro dipendente */
const DETRAZIONI_LAVORO_DIPENDENTE = {
  importoFissoBase: 1_955,
  minimoIndeterminato: 690,
  minimoDeterminato: 1_380,
  coefficienteFascia2: 1_190,
  baseDetrazione: 1_910,
  maggiorazioneRedditiMedi: 65,
} as const;

/** Parametri detrazioni carichi familiari */
const DETRAZIONI_FAMILIARI = {
  limiteRedditoCarico: 2_840.51,
  limiteRedditoFigliGiovani: 4_000,
  etaMassimaFigli: 30,
  etaMinimaFigli: 21,
  importoTeoricoFigli: 950,
  coefficienteBaseFigli: 95_000,
  incrementoPerFiglio: 15_000,
  importoTeoricoAltri: 750,
  coefficienteBaseAltri: 80_000,
} as const;

/** Parametri detrazione coniuge */
const DETRAZIONE_CONIUGE = {
  importoBaseFascia1: 800,
  coefficienteRiduzioneFascia1: 110,
  importoFissoFascia2: 690,
  sogliaFascia1: 15_000,
  sogliaFascia2: 40_000,
  sogliaFascia3: 80_000,
  maggiorazioni: [
    { min: 29_000, max: 29_200, importo: 10 },
    { min: 29_200, max: 34_700, importo: 20 },
    { min: 34_700, max: 35_000, importo: 30 },
    { min: 35_000, max: 35_100, importo: 20 },
    { min: 35_100, max: 35_200, importo: 10 },
  ],
} as const;

/** Soglie rimborsi trasferta esenti */
const RIMBORSI_TRASFERTA = {
  forfettarioItalia: 46.48,
  forfettarioEstero: 77.47,
  riduzioneUnTerzo: 1 / 3,
  riduzioneDueTerzi: 2 / 3,
} as const;

/** Limiti benefit esenti da tassazione */
const BENEFIT_ESENTI = {
  assistenzaSanitaria: 3_615.2,
  buoniPastoCartacei: 4.0,
  /** Giorni di erogazione buoni pasto se non indicati */
  giorniBuoniPastoDefault: 220,
} as const;

/** Aliquote contributive INPS a carico del datore di lavoro (Commercio/Terziario 2026) */
const ALIQUOTE_INPS_DATORE = {
  /** Operai/impiegati senza CIGS (≤50 dip. commercio) */
  base: 0.2898,
  /** Con CIGS */
  conCigs: 0.2968,
  /** Apprendistato (aliquota agevolata) */
  apprendista: 0.1161,
  /** Dirigenti senza CIGS */
  dirigente: 0.2654,
  /** Dirigenti con CIGS */
  dirigenteConCigs: 0.2724,
} as const;

/** Parametri TFR (Art. 2120 c.c.) */
const TFR = {
  divisore: 13.5,
} as const;

/** Parametri Regime Impatriati (D.Lgs. 209/2023, art. 5) */
const REGIME_IMPATRIATI = {
  /** Percentuale reddito esente (standard) */
  percentualeEsenzioneStandard: 0.5,
  /** Percentuale reddito esente (con figli minorenni) */
  percentualeEsenzioneMinorenni: 0.6,
  /** Tetto massimo reddito agevolabile */
  tettoRedditoAgevolabile: 600_000,
} as const;

/** Parametri INPS Gestione Separata per borse di studio post-laurea (D.L. 45/2025, L. 79/2025) */
const GESTIONE_SEPARATA_BORSE = {
  /** Aliquota totale 2026 (senza altra copertura pensionistica) */
  aliquotaTotale: 0.3503,
  /** Aliquota ridotta 2026 (con altra copertura pensionistica obbligatoria) */
  aliquotaRidotta: 0.24,
  /** Quota a carico del borsista (1/3) */
  quotaBorsista: 1 / 3,
  /** Quota a carico dell'ente (2/3) */
  quotaEnte: 2 / 3,
} as const;

function calcolaFringeBenefitAuto(auto: AutoAziendale): {
  valore: number;
  percentualeApplicata: number;
  mesiUtilizzo: number;
} {
  const mesi = auto.mesiUtilizzo ?? 12;
  const trattenuta = auto.trattenutaDipendente ?? 0;

  let percentuale: number;

  if (auto.assegnatoPre2025 && auto.emissioniCO2 !== undefined) {
    if (auto.emissioniCO2 <= 60) {
      percentuale = AUTO_AZIENDALE_PRE_2025.percentualeBassaEmissione;
    } else if (auto.emissioniCO2 <= 160) {
      percentuale = AUTO_AZIENDALE_PRE_2025.percentualeMediaEmissione;
    } else if (auto.emissioniCO2 <= 190) {
      percentuale = AUTO_AZIENDALE_PRE_2025.percentualeAltaEmissione;
    } else {
      percentuale = AUTO_AZIENDALE_PRE_2025.percentualeMoltoAltaEmissione;
    }
  } else {
    switch (auto.tipoAlimentazione) {
      case 'elettrico':
        percentuale = AUTO_AZIENDALE.percentualeElettrico;
        break;
      case 'ibrido_plugin':
        percentuale = AUTO_AZIENDALE.percentualeIbridoPlugIn;
        break;
      default:
        percentuale = AUTO_AZIENDALE.percentualeAltri;
    }
  }

  const valoreAnnuo = auto.costoKmAci * AUTO_AZIENDALE.percorrenzaConvenzionale * percentuale;
  const valoreRapportato = (valoreAnnuo * mesi) / 12;
  const valoreNetto = Math.max(0, valoreRapportato - trattenuta);

  return {
    valore: valoreNetto,
    percentualeApplicata: percentuale,
    mesiUtilizzo: mesi,
  };
}

function calcolaFringeBenefit(
  fringeBenefit: FringeBenefit | undefined,
  haFigliACarico: boolean,
): DettaglioFringeBenefit {
  const sogliaEsenzione = haFigliACarico
    ? FRINGE_BENEFIT.sogliaConFigli
    : FRINGE_BENEFIT.sogliaSenzaFigli;

  if (!fringeBenefit) {
    return {
      valoreTotaleLordo: 0,
      autoAziendale: null,
      trattenutaAutoDipendente: 0,
      sogliaEsenzione,
      sogliaSuperata: false,
      valoreImponibile: 0,
      valoreEsente: 0,
      valoreMonetarioImponibile: 0,
      valoreAutoImponibile: 0,
    };
  }

  let autoAziendaleDettaglio: DettaglioFringeBenefit['autoAziendale'] = null;
  let valoreAuto = 0;
  let trattenutaAutoDipendente = 0;

  if (fringeBenefit.autoAziendale) {
    const calcolo = calcolaFringeBenefitAuto(fringeBenefit.autoAziendale);
    autoAziendaleDettaglio = calcolo;
    valoreAuto = calcolo.valore;
    trattenutaAutoDipendente = fringeBenefit.autoAziendale.trattenutaDipendente ?? 0;
  }

  // Fringe benefit monetari (esclusa auto) - sono soldi/valore che il dipendente riceve
  const valoreMonetario =
    (fringeBenefit.buoniAcquisto ?? 0) +
    (fringeBenefit.buoniCarburante ?? 0) +
    (fringeBenefit.rimborsoUtenze ?? 0) +
    (fringeBenefit.rimborsoAffitto ?? 0) +
    (fringeBenefit.rimborsoInteressiMutuo ?? 0) +
    (fringeBenefit.altri ?? 0);

  const valoreTotaleLordo = valoreAuto + valoreMonetario;

  const sogliaSuperata = valoreTotaleLordo > sogliaEsenzione;
  const valoreImponibile = sogliaSuperata ? valoreTotaleLordo : 0;
  const valoreEsente = sogliaSuperata ? 0 : valoreTotaleLordo;

  // Separa il valore imponibile tra auto (beneficio in natura) e monetario (soldi ricevuti)
  const valoreAutoImponibile = sogliaSuperata ? valoreAuto : 0;
  const valoreMonetarioImponibile = sogliaSuperata ? valoreMonetario : 0;

  return {
    valoreTotaleLordo,
    autoAziendale: autoAziendaleDettaglio,
    trattenutaAutoDipendente,
    sogliaEsenzione,
    sogliaSuperata,
    valoreImponibile,
    valoreEsente,
    valoreMonetarioImponibile,
    valoreAutoImponibile,
  };
}

function calcolaRimborsiTrasferta(
  rimborsi: RimborsiTrasferta | undefined,
): DettaglioRimborsiTrasferta {
  if (!rimborsi) {
    return {
      rimborsoForfettarioEsente: 0,
      rimborsoDocumentatoEsente: 0,
      rimborsiTassati: 0,
      totaleEsente: 0,
      totaleRimborsi: 0,
    };
  }

  let rimborsoForfettarioEsente = 0;
  let rimborsoDocumentatoEsente = 0;
  let rimborsiTassati = 0;

  const giorniItalia = rimborsi.giorniTrasfertaItalia ?? 0;
  const giorniEstero = rimborsi.giorniTrasfertaEstero ?? 0;

  if (rimborsi.modalitaRimborso === 'forfettario') {
    rimborsoForfettarioEsente =
      giorniItalia * RIMBORSI_TRASFERTA.forfettarioItalia +
      giorniEstero * RIMBORSI_TRASFERTA.forfettarioEstero;
  } else if (rimborsi.modalitaRimborso === 'misto') {
    const vitto = rimborsi.rimborsoVitto ?? 0;
    const alloggio = rimborsi.rimborsoAlloggio ?? 0;

    let riduzione = 0;
    if (vitto > 0 && alloggio > 0) {
      riduzione = RIMBORSI_TRASFERTA.riduzioneDueTerzi;
    } else if (vitto > 0 || alloggio > 0) {
      riduzione = RIMBORSI_TRASFERTA.riduzioneUnTerzo;
    }

    rimborsoForfettarioEsente =
      giorniItalia * RIMBORSI_TRASFERTA.forfettarioItalia * (1 - riduzione) +
      giorniEstero * RIMBORSI_TRASFERTA.forfettarioEstero * (1 - riduzione);
  }

  const rimborsoVitto = rimborsi.rimborsoVitto ?? 0;
  const rimborsoAlloggio = rimborsi.rimborsoAlloggio ?? 0;
  const rimborsoViaggio = rimborsi.rimborsoViaggio ?? 0;
  const rimborsoKm = rimborsi.rimborsoKm ?? 0;

  const pagamentiTracciabili = rimborsi.pagamentiTracciabili ?? true;

  if (pagamentiTracciabili) {
    rimborsoDocumentatoEsente = rimborsoVitto + rimborsoAlloggio + rimborsoViaggio + rimborsoKm;
  } else {
    rimborsiTassati = rimborsoVitto + rimborsoAlloggio;
    rimborsoDocumentatoEsente = rimborsoViaggio + rimborsoKm;
  }

  const totaleEsente = rimborsoForfettarioEsente + rimborsoDocumentatoEsente;
  const totaleRimborsi = totaleEsente + rimborsiTassati;

  return {
    rimborsoForfettarioEsente,
    rimborsoDocumentatoEsente,
    rimborsiTassati,
    totaleEsente,
    totaleRimborsi,
  };
}

function calcolaBenefitNonTassati(
  benefit: BenefitNonTassati | undefined,
): DettaglioBenefitNonTassati {
  if (!benefit) {
    return {
      previdenzaComplementare: 0,
      assistenzaSanitaria: 0,
      buoniPastoEsenti: 0,
      buoniPastoTassati: 0,
      altriWelfare: 0,
      totaleEsente: 0,
      totaleTassato: 0,
    };
  }

  // La previdenza complementare volontaria NON è un benefit welfare:
  // è un contributo volontario del lavoratore che condivide il cap €5.300
  // con il fondo pensione integrativo (Art. 10, c.1, lett. e-bis, TUIR).
  // Viene gestita nella sezione previdenza complementare, non qui.
  const previdenza = benefit.previdenzaComplementare ?? 0;

  const sanita = Math.min(benefit.assistenzaSanitaria ?? 0, BENEFIT_ESENTI.assistenzaSanitaria);
  const sanitaEccedente = Math.max(
    0,
    (benefit.assistenzaSanitaria ?? 0) - BENEFIT_ESENTI.assistenzaSanitaria,
  );

  const buoniPastoTotale = benefit.buoniPasto ?? 0;
  const sogliaGiornaliera = benefit.buoniPastoElettronici
    ? BUONI_PASTO_ELETTRONICI
    : BENEFIT_ESENTI.buoniPastoCartacei;

  // Il limite è giornaliero (art. 51, c.2, lett. c, TUIR), per buoni di pari importo.
  const giorniBuoniPasto = benefit.giorniBuoniPasto ?? BENEFIT_ESENTI.giorniBuoniPastoDefault;
  const sogliaAnnuaBuoniPasto = sogliaGiornaliera * giorniBuoniPasto;
  const buoniPastoEsenti = Math.min(buoniPastoTotale, sogliaAnnuaBuoniPasto);
  const buoniPastoTassati = Math.max(0, buoniPastoTotale - sogliaAnnuaBuoniPasto);

  const altriWelfare =
    (benefit.abbonamentoTrasporto ?? 0) + (benefit.serviziWelfare ?? 0) + (benefit.altri ?? 0);

  const totaleEsente = sanita + buoniPastoEsenti + altriWelfare;
  const totaleTassato = sanitaEccedente + buoniPastoTassati;

  return {
    previdenzaComplementare: previdenza,
    assistenzaSanitaria: sanita,
    buoniPastoEsenti,
    buoniPastoTassati,
    altriWelfare,
    totaleEsente,
    totaleTassato,
  };
}

function calcolaContributiInps(
  ral: number,
  tipoContratto: TipoContratto,
  aziendaConCigs: boolean,
  iscrittoPost1996: boolean,
): DettaglioContributiInps {
  let aliquotaBase: number;
  if (tipoContratto === 'apprendistato') {
    aliquotaBase = ALIQUOTE_INPS.apprendista;
  } else if (aziendaConCigs) {
    aliquotaBase = ALIQUOTE_INPS.conCigs;
  } else {
    aliquotaBase = ALIQUOTE_INPS.baseWorker;
  }

  const imponibilePrevidenziale = iscrittoPost1996 ? Math.min(ral, ALIQUOTE_INPS.massimale) : ral;

  const contributiBase = imponibilePrevidenziale * aliquotaBase;

  let contributoAggiuntivo = 0;
  if (imponibilePrevidenziale > ALIQUOTE_INPS.sogliaAggiuntivo) {
    const eccedenza = imponibilePrevidenziale - ALIQUOTE_INPS.sogliaAggiuntivo;
    contributoAggiuntivo = eccedenza * ALIQUOTE_INPS.aggiuntivo;
  }

  return {
    imponibilePrevidenziale,
    aliquotaApplicata: aliquotaBase,
    contributiBase,
    contributoAggiuntivo,
    totaleContributi: contributiBase + contributoAggiuntivo,
  };
}

function calcolaIrpefLorda(imponibile: number): DettaglioIrpef {
  let impostaTotale = 0;
  let imponibileResiduo = imponibile;
  let limiteInferiore = 0;
  const dettaglioScaglioni: DettaglioIrpef['dettaglioScaglioni'] = [];

  for (let i = 0; i < IRPEF_SCAGLIONI.length && imponibileResiduo > 0; i++) {
    const scaglione = IRPEF_SCAGLIONI[i];
    const limiteSuperiore = scaglione.limite;
    const ampiezzaScaglione = limiteSuperiore - limiteInferiore;
    const imponibileScaglione = Math.min(imponibileResiduo, ampiezzaScaglione);
    const impostaScaglione = imponibileScaglione * scaglione.aliquota;

    dettaglioScaglioni.push({
      scaglione: i + 1,
      imponibileScaglione,
      aliquota: scaglione.aliquota,
      impostaScaglione,
    });

    impostaTotale += impostaScaglione;
    imponibileResiduo -= imponibileScaglione;
    limiteInferiore = limiteSuperiore;
  }

  return {
    imponibileIrpef: imponibile,
    irpefLorda: impostaTotale,
    dettaglioScaglioni,
  };
}

function calcolaDetrazioniLavoroDipendente(
  redditoComplessivo: number,
  giorniLavorati: number,
  tipoContratto: TipoContratto,
): DettaglioDetrazioniLavoro {
  const params = DETRAZIONI_LAVORO_DIPENDENTE;
  let detrazioneTeorica = 0;

  if (redditoComplessivo <= 15_000) {
    detrazioneTeorica = params.importoFissoBase;
    const minimo =
      tipoContratto === 'determinato' ? params.minimoDeterminato : params.minimoIndeterminato;
    detrazioneTeorica = Math.max(detrazioneTeorica, minimo);
  } else if (redditoComplessivo <= 28_000) {
    const coefficiente = (28_000 - redditoComplessivo) / 13_000;
    detrazioneTeorica = params.baseDetrazione + params.coefficienteFascia2 * coefficiente;
  } else if (redditoComplessivo <= 50_000) {
    const coefficiente = (50_000 - redditoComplessivo) / 22_000;
    detrazioneTeorica = params.baseDetrazione * coefficiente;
  } else {
    detrazioneTeorica = 0;
  }

  let maggiorazione = 0;
  if (redditoComplessivo > 25_000 && redditoComplessivo <= 35_000) {
    maggiorazione = params.maggiorazioneRedditiMedi;
  }

  // La maggiorazione di €65 spetta per intero, senza ragguaglio al periodo di lavoro
  // (Circ. AdE 4/E/2022, par. 1.2)
  const coefficienteGiorni = giorniLavorati / 365;
  const detrazioneEffettiva = detrazioneTeorica * coefficienteGiorni + maggiorazione;

  return {
    detrazioneTeorica,
    maggiorazione,
    coefficienteGiorni,
    detrazioneEffettiva,
  };
}

function calcolaDetrazioneConiuge(redditoComplessivo: number, coniuge?: ConiugeACarico): number {
  if (!coniuge) return 0;

  if (coniuge.redditoAnnuo > DETRAZIONI_FAMILIARI.limiteRedditoCarico) {
    return 0;
  }

  const percentuale = (coniuge.percentualeCarico ?? 100) / 100;
  const params = DETRAZIONE_CONIUGE;
  let detrazione = 0;

  if (redditoComplessivo <= params.sogliaFascia1) {
    detrazione =
      params.importoBaseFascia1 -
      params.coefficienteRiduzioneFascia1 * (redditoComplessivo / params.sogliaFascia1);
  } else if (redditoComplessivo <= params.sogliaFascia2) {
    detrazione = params.importoFissoFascia2;
    for (const magg of params.maggiorazioni) {
      if (redditoComplessivo >= magg.min && redditoComplessivo < magg.max) {
        detrazione += magg.importo;
        break;
      }
    }
  } else if (redditoComplessivo <= params.sogliaFascia3) {
    const coefficiente = (params.sogliaFascia3 - redditoComplessivo) / 40_000;
    detrazione = params.importoFissoFascia2 * coefficiente;
  } else {
    detrazione = 0;
  }

  return Math.max(0, detrazione * percentuale);
}

/** Il figlio rispetta il limite di reddito per essere a carico (art. 12, comma 2, TUIR) */
function isFiglioACarico(figlio: FiglioACarico): boolean {
  const limiteReddito =
    figlio.eta <= 24
      ? DETRAZIONI_FAMILIARI.limiteRedditoFigliGiovani
      : DETRAZIONI_FAMILIARI.limiteRedditoCarico;
  return (figlio.redditoAnnuo ?? 0) <= limiteReddito;
}

function calcolaDetrazioneFigli(
  redditoComplessivo: number,
  figli?: FiglioACarico[],
): { detrazione: number; numeroFigli: number } {
  if (!figli || figli.length === 0) {
    return { detrazione: 0, numeroFigli: 0 };
  }

  const params = DETRAZIONI_FAMILIARI;
  let detrazioneTotale = 0;
  let numeroFigliConDetrazione = 0;

  for (const figlio of figli) {
    if (!isFiglioACarico(figlio)) continue;

    const haDetrazione =
      figlio.disabile ||
      (figlio.eta >= params.etaMinimaFigli && figlio.eta < params.etaMassimaFigli);

    if (!haDetrazione) continue;

    numeroFigliConDetrazione++;
    const percentuale = (figlio.percentualeCarico ?? 100) / 100;

    const coefficienteBase =
      params.coefficienteBaseFigli + (numeroFigliConDetrazione - 1) * params.incrementoPerFiglio;

    if (redditoComplessivo < coefficienteBase) {
      const rapporto = (coefficienteBase - redditoComplessivo) / coefficienteBase;
      detrazioneTotale += params.importoTeoricoFigli * rapporto * percentuale;
    }
  }

  return { detrazione: detrazioneTotale, numeroFigli: numeroFigliConDetrazione };
}

function calcolaDetrazioneAscendenti(
  redditoComplessivo: number,
  ascendenti?: AscendenteACarico[],
): { detrazione: number; numeroAscendenti: number } {
  if (!ascendenti || ascendenti.length === 0) {
    return { detrazione: 0, numeroAscendenti: 0 };
  }

  const params = DETRAZIONI_FAMILIARI;
  let detrazioneTotale = 0;
  let numeroAscendentiConDetrazione = 0;

  for (const ascendente of ascendenti) {
    if (!ascendente.convivente) continue;
    if (ascendente.redditoAnnuo > params.limiteRedditoCarico) continue;

    numeroAscendentiConDetrazione++;

    if (redditoComplessivo < params.coefficienteBaseAltri) {
      const rapporto =
        (params.coefficienteBaseAltri - redditoComplessivo) / params.coefficienteBaseAltri;
      detrazioneTotale += params.importoTeoricoAltri * rapporto;
    }
  }

  return { detrazione: detrazioneTotale, numeroAscendenti: numeroAscendentiConDetrazione };
}

function calcolaCuneoFiscale(
  redditoComplessivoImponibile: number,
  redditoLavoroDipendenteImponibile: number,
  coefficienteGiorni: number,
  quotaEsenteImpatriati = 0,
): DettaglioCuneoFiscale {
  const params = CUNEO_FISCALE;

  // Soglie e fascia percentuale includono la quota esente impatriati (L. 207/2024, art. 1, c. 9)
  const redditoComplessivo = redditoComplessivoImponibile + quotaEsenteImpatriati;
  const redditoLavoroDipendente = redditoLavoroDipendenteImponibile + quotaEsenteImpatriati;

  if (redditoComplessivo <= params.sogliaIndennita) {
    // La fascia percentuale si individua sul reddito di lavoro dipendente rapportato all'intero
    // anno (L. 207/2024, art. 1, c. 4)
    const redditoAnnualizzato =
      coefficienteGiorni > 0 ? redditoLavoroDipendente / coefficienteGiorni : 0;
    let percentuale = 0;
    for (const fascia of params.percentualiIndennita) {
      if (redditoAnnualizzato <= fascia.limite) {
        percentuale = fascia.percentuale;
        break;
      }
    }

    // La percentuale si applica alla sola quota imponibile (Circ. AdE 4/E/2025, par. 1.2, esempio 3)
    const indennita = redditoLavoroDipendenteImponibile * percentuale;

    return {
      spettaIndennita: true,
      spettaDetrazione: false,
      indennitaEsente: indennita,
      detrazioneAggiuntiva: 0,
      percentualeIndennita: percentuale,
    };
  }

  if (redditoComplessivo <= params.sogliaDetrazione) {
    let detrazione = 0;

    if (redditoComplessivo <= params.sogliaDecalage) {
      detrazione = params.detrazioneBase;
    } else {
      const coefficiente = (params.sogliaDetrazione - redditoComplessivo) / 8_000;
      detrazione = params.detrazioneBase * coefficiente;
    }

    // La detrazione è rapportata al periodo di lavoro (L. 207/2024, art. 1, c. 6)
    return {
      spettaIndennita: false,
      spettaDetrazione: true,
      indennitaEsente: 0,
      detrazioneAggiuntiva: Math.max(0, detrazione) * coefficienteGiorni,
    };
  }

  return {
    spettaIndennita: false,
    spettaDetrazione: false,
    indennitaEsente: 0,
    detrazioneAggiuntiva: 0,
  };
}

function calcolaTrattamentoIntegrativo(
  redditoComplessivoImponibile: number,
  irpefLorda: number,
  irpefLordaRedditiLavoro: number,
  detrazioniLavoro: DettaglioDetrazioniLavoro,
  totaleDetrazioni: number,
  quotaEsenteImpatriati = 0,
): DettaglioTrattamentoIntegrativo {
  const params = TRATTAMENTO_INTEGRATIVO;

  // Le soglie includono la quota esente impatriati (art. 3, c. 2, D.L. 3/2020; Circ. AdE 29/E/2020)
  const redditoComplessivo = redditoComplessivoImponibile + quotaEsenteImpatriati;

  if (redditoComplessivo > params.sogliaParziale) {
    return {
      spetta: false,
      motivoNonSpettanza:
        quotaEsenteImpatriati > 0
          ? 'Reddito complessivo (inclusa quota esente impatriati) superiore a €28.000'
          : 'Reddito superiore a €28.000',
      importo: 0,
      importoPieno: false,
    };
  }

  if (redditoComplessivo <= params.sogliaPiena) {
    // Capienza: imposta lorda sui soli redditi di lavoro dipendente e assimilati oltre la
    // detrazione art. 13, c. 1, TUIR meno €75, entrambi rapportati al periodo di lavoro
    // (art. 1, c. 1, D.L. 3/2020)
    const sogliaCapienza =
      detrazioniLavoro.detrazioneEffettiva -
      params.clausolaSalvaguardia * detrazioniLavoro.coefficienteGiorni;

    if (irpefLordaRedditiLavoro > sogliaCapienza) {
      // L'importo è rapportato al periodo di lavoro (art. 1, c. 1, D.L. 3/2020)
      return {
        spetta: true,
        importo: params.importoMassimo * detrazioniLavoro.coefficienteGiorni,
        importoPieno: true,
      };
    } else {
      return {
        spetta: false,
        motivoNonSpettanza: 'IRPEF lorda non supera la soglia di capienza',
        importo: 0,
        importoPieno: false,
      };
    }
  }

  const eccedenzaDetrazioni = totaleDetrazioni - irpefLorda;

  if (eccedenzaDetrazioni > 0) {
    const importo = Math.min(params.importoMassimo, eccedenzaDetrazioni);
    return {
      spetta: true,
      importo,
      importoPieno: false,
    };
  }

  return {
    spetta: false,
    motivoNonSpettanza: 'Detrazioni non eccedono IRPEF lorda',
    importo: 0,
    importoPieno: false,
  };
}

function calcolaAliquotaInpsDatore(
  tipoContratto: TipoContratto,
  aziendaConCigs: boolean,
  isDirigente: boolean,
): number {
  if (tipoContratto === 'apprendistato') {
    return ALIQUOTE_INPS_DATORE.apprendista;
  }
  if (isDirigente) {
    return aziendaConCigs ? ALIQUOTE_INPS_DATORE.dirigenteConCigs : ALIQUOTE_INPS_DATORE.dirigente;
  }
  return aziendaConCigs ? ALIQUOTE_INPS_DATORE.conCigs : ALIQUOTE_INPS_DATORE.base;
}

/** Fringe benefit, rimborsi e welfare pagati dal datore, divisi per trattamento fiscale */
function vociBenefit(
  fringeBenefit: DettaglioFringeBenefit,
  rimborsiTrasferta: DettaglioRimborsiTrasferta,
  benefitNonTassati: DettaglioBenefitNonTassati,
): VoceEntrata[] {
  const voce = (
    descrizione: string,
    importo: number,
    categoria: CategoriaEntrata,
    destinazione: DestinazioneVoce,
  ): VoceEntrata => ({ descrizione, importo, categoria, pagatore: 'datore', destinazione });

  return [
    voce(
      'Fringe Benefit tassati',
      fringeBenefit.valoreMonetarioImponibile,
      'fringeBenefit',
      'netto',
    ),
    // L'auto aziendale oltre soglia è tassata ma non aumenta il netto
    voce('Auto Aziendale', fringeBenefit.valoreAutoImponibile, 'fringeBenefit', 'inNatura'),
    voce('Fringe Benefit esenti', fringeBenefit.valoreEsente, 'fringeBenefit', 'esente'),
    voce(
      'Rimborsi Trasferta tassati',
      rimborsiTrasferta.rimborsiTassati,
      'rimborsiTrasferta',
      'netto',
    ),
    voce(
      'Rimborsi Trasferta esenti',
      rimborsiTrasferta.totaleEsente,
      'rimborsiTrasferta',
      'esente',
    ),
    voce('Welfare oltre soglia', benefitNonTassati.totaleTassato, 'welfare', 'netto'),
    voce('Welfare esente', benefitNonTassati.totaleEsente, 'welfare', 'esente'),
  ];
}

function calcolaBorsaDiStudio(borsa: BorsaDiStudio | undefined): {
  contributoGSBorsista: number;
  imponibileBorsa: number;
  dettaglio: DettaglioBorsaDiStudio | null;
} {
  const importoLordo = borsa?.importoAnnuo || 0;
  if (importoLordo <= 0) {
    return { contributoGSBorsista: 0, imponibileBorsa: 0, dettaglio: null };
  }
  const contributoTotale = importoLordo * GESTIONE_SEPARATA_BORSE.aliquotaTotale;
  const contributoGSBorsista = contributoTotale * GESTIONE_SEPARATA_BORSE.quotaBorsista;
  const contributoGSEnte = contributoTotale * GESTIONE_SEPARATA_BORSE.quotaEnte;
  const imponibileBorsa = importoLordo - contributoGSBorsista;

  return {
    contributoGSBorsista,
    imponibileBorsa,
    dettaglio: {
      importoLordo,
      aliquotaGestioneSeparata: GESTIONE_SEPARATA_BORSE.aliquotaTotale,
      contributoGestioneSeparataTotale: contributoTotale,
      contributoGestioneSeparataBorsista: contributoGSBorsista,
      contributoGestioneSeparataEnte: contributoGSEnte,
      imponibileIrpef: imponibileBorsa,
      // nettoAnnuo e nettoMensile vengono calcolati dopo IRPEF/addizionali
      nettoAnnuo: 0,
      nettoMensile: 0,
    },
  };
}

/**
 * Calcola il netto per borsa di studio esente IRPEF (dottorato di ricerca, specializzazione, ecc.)
 * Art. 4 L. 476/1984, Art. 6 co. 6 L. 398/1989. Solo INPS Gestione Separata.
 */
function calcolaBorsaDiStudioContratto(input: InputCalcoloStipendio): OutputCalcoloStipendio {
  const importoLordo = input.ral;
  const aliquotaGS = input.altraCoperturaPensionistica
    ? GESTIONE_SEPARATA_BORSE.aliquotaRidotta
    : GESTIONE_SEPARATA_BORSE.aliquotaTotale;

  const contributoGSTotale = importoLordo * aliquotaGS;
  const contributoGSBorsista = contributoGSTotale * GESTIONE_SEPARATA_BORSE.quotaBorsista;
  const contributoGSEnte = contributoGSTotale * GESTIONE_SEPARATA_BORSE.quotaEnte;

  const ripartizione = ripartisci(
    [
      {
        descrizione: 'Importo Borsa',
        importo: importoLordo,
        categoria: 'retribuzione',
        pagatore: 'datore',
        destinazione: 'netto',
      },
      {
        descrizione: 'GS a carico ente (2/3)',
        importo: contributoGSEnte,
        aliquota: aliquotaGS * GESTIONE_SEPARATA_BORSE.quotaEnte,
        categoria: 'contributiDatore',
        pagatore: 'datore',
        destinazione: 'accantonata',
      },
    ],
    [
      {
        descrizione: 'INPS Gestione Separata (borsista)',
        importo: contributoGSBorsista,
        categoria: 'contributi',
      },
    ],
  );
  const { costoAziendale, totaleTrattenute, totaleBonus, nettoAnnuo, totalePercepito } =
    totali(ripartizione);
  const nettoMensile = nettoAnnuo / 12;

  // Dettaglio contributi INPS (GS borsista)
  const contributiInps: DettaglioContributiInps = {
    imponibilePrevidenziale: importoLordo,
    aliquotaApplicata: aliquotaGS * GESTIONE_SEPARATA_BORSE.quotaBorsista,
    contributiBase: contributoGSBorsista,
    contributoAggiuntivo: 0,
    totaleContributi: contributoGSBorsista,
  };

  // Dettaglio borsa di studio
  const borsaDiStudio: DettaglioBorsaDiStudio = {
    importoLordo,
    aliquotaGestioneSeparata: aliquotaGS,
    contributoGestioneSeparataTotale: contributoGSTotale,
    contributoGestioneSeparataBorsista: contributoGSBorsista,
    contributoGestioneSeparataEnte: contributoGSEnte,
    imponibileIrpef: 0, // Esente IRPEF
    nettoAnnuo,
    nettoMensile,
  };

  // Zero values for all irrelevant output fields
  const zeroFringeBenefit: DettaglioFringeBenefit = {
    valoreTotaleLordo: 0,
    autoAziendale: null,
    trattenutaAutoDipendente: 0,
    sogliaEsenzione: 0,
    sogliaSuperata: false,
    valoreImponibile: 0,
    valoreEsente: 0,
    valoreMonetarioImponibile: 0,
    valoreAutoImponibile: 0,
  };

  const zeroRimborsiTrasferta: DettaglioRimborsiTrasferta = {
    rimborsoForfettarioEsente: 0,
    rimborsoDocumentatoEsente: 0,
    rimborsiTassati: 0,
    totaleEsente: 0,
    totaleRimborsi: 0,
  };

  const zeroBenefitNonTassati: DettaglioBenefitNonTassati = {
    previdenzaComplementare: 0,
    assistenzaSanitaria: 0,
    buoniPastoEsenti: 0,
    buoniPastoTassati: 0,
    altriWelfare: 0,
    totaleEsente: 0,
    totaleTassato: 0,
  };

  return {
    ral: importoLordo,
    annoFiscale: 2026,
    mensilita: 12,
    contributiInps,
    fringeBenefit: zeroFringeBenefit,
    rimborsiTrasferta: zeroRimborsiTrasferta,
    benefitNonTassati: zeroBenefitNonTassati,
    fondiContrattuali: [],
    fondoPensioneIntegrativo: null,
    regimeImpatriati: null,
    borsaDiStudio,
    ripartizione,
    costoAziendale,
    irpef: { imponibileIrpef: 0, irpefLorda: 0, dettaglioScaglioni: [] },
    detrazioniLavoro: {
      detrazioneTeorica: 0,
      maggiorazione: 0,
      coefficienteGiorni: 0,
      detrazioneEffettiva: 0,
    },
    detrazioniFamiliari: {
      detrazioneConiuge: 0,
      detrazioneFigli: 0,
      numeroFigliConDetrazione: 0,
      detrazioneAscendenti: 0,
      numeroAscendentiConDetrazione: 0,
      totaleDetrazioniFamiliari: 0,
    },
    cuneoFiscale: {
      spettaIndennita: false,
      spettaDetrazione: false,
      indennitaEsente: 0,
      detrazioneAggiuntiva: 0,
    },
    trattamentoIntegrativo: { spetta: false, importo: 0, importoPieno: false },
    riepilogoDetrazioni: {
      lavoroDipendente: 0,
      carichiFamiliari: 0,
      cuneoFiscale: 0,
      altre: 0,
      totale: 0,
    },
    addizionali: {
      addizionaleRegionale: 0,
      aliquotaRegionale: 0,
      addizionaleComunale: 0,
      aliquotaComunale: 0,
      esenzioneComunaleApplicata: false,
      totaleAddizionali: 0,
    },
    irpefNetta: 0,
    irpefFinale: 0,
    totaleTrattenute,
    totaleBonus,
    nettoAnnuo,
    nettoMensile,
    nettoMensilePercepito: nettoMensile,
    aliquotaEffettiva: totaleTrattenute / importoLordo,
    totalePercepito,
  };
}

export class Calculator2026 implements StipendioCalculator {
  calcolaStipendioNetto(input: InputCalcoloStipendio): OutputCalcoloStipendio {
    // Borsa di studio come contratto: calcolo semplificato (solo GS INPS, esente IRPEF)
    if (input.tipoContratto === 'borsaDiStudio') {
      return calcolaBorsaDiStudioContratto(input);
    }

    const {
      ral,
      mensilita,
      giorniLavorati = 365,
      tipoContratto,
      aziendaConCigs = false,
      iscrittoPost1996 = true,
      regione,
      comune,
      coniuge,
      figli,
      ascendenti,
      altriRedditi = 0,
      altriRedditiSogliaAddizionale = 0,
      altreDetrazioni = 0,
      fringeBenefit: fringeBenefitInput,
      haFigliACarico = false,
      rimborsiTrasferta: rimborsiTrasfertaInput,
      benefitNonTassati: benefitNonTassatiInput,
      regimeImpatriati: regimeImpatriatiFlag = false,
      regimeImpatriatiMinorenni = false,
      borsaDiStudio: borsaDiStudioInput,
    } = input;

    // 1. CALCOLO FRINGE BENEFIT
    const haFigliPerFringeBenefit = haFigliACarico || (figli !== undefined && figli.length > 0);
    const fringeBenefit = calcolaFringeBenefit(fringeBenefitInput, haFigliPerFringeBenefit);

    // 2. CALCOLO RIMBORSI TRASFERTA
    const rimborsiTrasferta = calcolaRimborsiTrasferta(rimborsiTrasfertaInput);

    // 3. CALCOLO BENEFIT NON TASSATI
    const benefitNonTassati = calcolaBenefitNonTassati(benefitNonTassatiInput);

    // 4. CALCOLO IMPONIBILE PREVIDENZIALE
    const imponibilePrevidenziale =
      ral +
      fringeBenefit.valoreImponibile +
      rimborsiTrasferta.rimborsiTassati +
      benefitNonTassati.totaleTassato;

    // 5. CALCOLO CONTRIBUTI INPS
    const contributiInps = calcolaContributiInps(
      imponibilePrevidenziale,
      tipoContratto,
      aziendaConCigs,
      iscrittoPost1996,
    );

    // 6. CALCOLO FONDI CONTRATTUALI E PREVIDENZA COMPLEMENTARE
    // Il contributo volontario (da sezione welfare) condivide il plafond della previdenza complementare
    const fondi = calcolaFondi({
      ...input,
      contributoVolontario: benefitNonTassatiInput?.previdenzaComplementare ?? 0,
      mensilita,
    });

    // 7. CALCOLO IMPONIBILE IRPEF
    // Il contributo datore + Ebitemp al fondo pensione è reddito per il dipendente (Art. 51 TUIR)
    // ma è deducibile entro il plafond (Art. 10 TUIR): effetto netto zero se entro il limite
    const redditoLavoroDipendenteLordo =
      imponibilePrevidenziale +
      fondi.redditoFondoPensione -
      contributiInps.totaleContributi -
      fondi.deduzione;

    // 7b. REGIME IMPATRIATI (D.Lgs. 209/2023, art. 5)
    // Riduce la base imponibile IRPEF e addizionali. Non riduce INPS.
    let dettaglioRegimeImpatriati: DettaglioRegimeImpatriati | null = null;
    let importoEsenteImpatriati = 0;

    if (regimeImpatriatiFlag) {
      const percentualeEsenzione = regimeImpatriatiMinorenni
        ? REGIME_IMPATRIATI.percentualeEsenzioneMinorenni
        : REGIME_IMPATRIATI.percentualeEsenzioneStandard;

      const redditoAgevolabile = Math.min(
        Math.max(0, redditoLavoroDipendenteLordo),
        REGIME_IMPATRIATI.tettoRedditoAgevolabile,
      );
      importoEsenteImpatriati = redditoAgevolabile * percentualeEsenzione;

      dettaglioRegimeImpatriati = {
        percentualeEsenzione,
        redditoAgevolabile,
        importoEsente: importoEsenteImpatriati,
        haFigliMinorenni: regimeImpatriatiMinorenni,
      };
    }

    const redditoLavoroDipendente = redditoLavoroDipendenteLordo - importoEsenteImpatriati;

    // 7c. CALCOLO BORSA DI STUDIO (dottorato/post-laurea tassata)
    // INPS Gestione Separata 35,03%, 1/3 a carico borsista, cumulo IRPEF
    const borsaCalcolo = calcolaBorsaDiStudio(borsaDiStudioInput);

    const redditoComplessivo =
      redditoLavoroDipendente + altriRedditi + borsaCalcolo.imponibileBorsa;

    // 8. CALCOLO IRPEF LORDA
    const irpef = calcolaIrpefLorda(redditoComplessivo);

    // 9. CALCOLO DETRAZIONI LAVORO DIPENDENTE
    const detrazioniLavoro = calcolaDetrazioniLavoroDipendente(
      redditoComplessivo,
      giorniLavorati,
      tipoContratto,
    );

    // 10. CALCOLO DETRAZIONI CARICHI FAMILIARI
    const detrazioneConiuge = calcolaDetrazioneConiuge(redditoComplessivo, coniuge);
    const { detrazione: detrazioneFigli, numeroFigli } = calcolaDetrazioneFigli(
      redditoComplessivo,
      figli,
    );
    const { detrazione: detrazioneAscendenti, numeroAscendenti } = calcolaDetrazioneAscendenti(
      redditoComplessivo,
      ascendenti,
    );

    const detrazioniFamiliari: DettaglioDetrazioniFamiliari = {
      detrazioneConiuge,
      detrazioneFigli,
      numeroFigliConDetrazione: numeroFigli,
      detrazioneAscendenti,
      numeroAscendentiConDetrazione: numeroAscendenti,
      totaleDetrazioniFamiliari: detrazioneConiuge + detrazioneFigli + detrazioneAscendenti,
    };

    // 11. CALCOLO CUNEO FISCALE
    const cuneoFiscale = calcolaCuneoFiscale(
      redditoComplessivo,
      redditoLavoroDipendente,
      detrazioniLavoro.coefficienteGiorni,
      importoEsenteImpatriati,
    );

    // 12. CALCOLO TOTALE DETRAZIONI
    const totaleDetrazioniPreTI =
      detrazioniLavoro.detrazioneEffettiva +
      detrazioniFamiliari.totaleDetrazioniFamiliari +
      altreDetrazioni;

    // 13. CALCOLO TRATTAMENTO INTEGRATIVO
    // Le soglie includono la quota esente impatriati; IRPEF e detrazioni restano sul reddito ridotto.
    // La capienza usa l'imposta lorda sui soli redditi di lavoro dipendente e assimilati
    // (artt. 49 e 50 TUIR, inclusa la borsa di studio, art. 50, c. 1, lett. c).
    const irpefLordaRedditiLavoro = calcolaIrpefLorda(
      redditoLavoroDipendente + borsaCalcolo.imponibileBorsa,
    ).irpefLorda;
    const trattamentoIntegrativo = calcolaTrattamentoIntegrativo(
      redditoComplessivo,
      irpef.irpefLorda,
      irpefLordaRedditiLavoro,
      detrazioniLavoro,
      totaleDetrazioniPreTI,
      importoEsenteImpatriati,
    );

    // IRPEF netta
    const irpefNetta = Math.max(
      0,
      irpef.irpefLorda -
        detrazioniLavoro.detrazioneEffettiva -
        detrazioniFamiliari.totaleDetrazioniFamiliari -
        altreDetrazioni,
    );

    // IRPEF finale
    const irpefFinale = Math.max(0, irpefNetta - cuneoFiscale.detrazioneAggiuntiva);

    // 14. CALCOLO ADDIZIONALI
    const addizionali = calcolaAddizionali({
      redditoComplessivo,
      regione,
      comune,
      figliACarico: (figli ?? []).filter(isFiglioACarico),
      altriRedditiSogliaAddizionale,
      irpefDovuta: irpefFinale > 0,
    });

    // Riepilogo detrazioni
    const riepilogoDetrazioni: RiepilogoDetrazioni = {
      lavoroDipendente: detrazioniLavoro.detrazioneEffettiva,
      carichiFamiliari: detrazioniFamiliari.totaleDetrazioniFamiliari,
      cuneoFiscale: cuneoFiscale.detrazioneAggiuntiva,
      altre: altreDetrazioni,
      totale:
        detrazioniLavoro.detrazioneEffettiva +
        detrazioniFamiliari.totaleDetrazioniFamiliari +
        cuneoFiscale.detrazioneAggiuntiva +
        altreDetrazioni,
    };

    // 15. DETTAGLIO FONDI
    // L'aliquota marginale IRPEF stima il risparmio fiscale delle deduzioni
    const aliquotaMarginaleIrpef =
      irpef.dettaglioScaglioni.length > 0
        ? irpef.dettaglioScaglioni[irpef.dettaglioScaglioni.length - 1].aliquota
        : 0;
    const { fondiContrattuali, fondoPensioneIntegrativo } = dettagliFondi(
      fondi,
      aliquotaMarginaleIrpef,
    );

    // 16. RIPARTIZIONE
    // Costo aziendale, trattenute, bonus, netto e percepito sono somme di queste voci
    const aliquotaInpsDatore = calcolaAliquotaInpsDatore(
      tipoContratto,
      aziendaConCigs,
      fondi.isDirigente,
    );
    const entrate: VoceEntrata[] = [
      {
        descrizione: 'RAL',
        importo: ral,
        categoria: 'retribuzione',
        pagatore: 'datore',
        destinazione: 'netto',
      },
      {
        descrizione: 'Contributi INPS Datore',
        importo: contributiInps.imponibilePrevidenziale * aliquotaInpsDatore,
        aliquota: aliquotaInpsDatore,
        categoria: 'contributiDatore',
        pagatore: 'datore',
        destinazione: 'accantonata',
      },
      {
        descrizione: 'TFR (RAL / 13,5)',
        importo: ral / TFR.divisore,
        categoria: 'tfr',
        pagatore: 'datore',
        destinazione: 'accantonata',
      },
      ...fondi.entrate,
      ...vociBenefit(fringeBenefit, rimborsiTrasferta, benefitNonTassati),
      {
        descrizione: 'Borsa di Studio',
        importo: borsaCalcolo.dettaglio?.importoLordo ?? 0,
        categoria: 'borsaDiStudio',
        pagatore: 'ente',
        destinazione: 'netto',
      },
      {
        descrizione: 'Indennità Cuneo Fiscale',
        importo: cuneoFiscale.indennitaEsente,
        categoria: 'bonus',
        pagatore: 'stato',
        destinazione: 'netto',
      },
      {
        descrizione: 'Trattamento Integrativo',
        importo: trattamentoIntegrativo.importo,
        categoria: 'bonus',
        pagatore: 'stato',
        destinazione: 'netto',
      },
    ];
    const trattenute: VoceTrattenuta[] = [
      {
        descrizione: 'Contributi INPS',
        importo: contributiInps.totaleContributi,
        categoria: 'contributi',
      },
      {
        descrizione: 'INPS Gestione Separata (borsista)',
        importo: borsaCalcolo.contributoGSBorsista,
        categoria: 'contributi',
      },
      { descrizione: 'IRPEF', importo: irpefFinale, categoria: 'irpef' },
      {
        descrizione: 'Addizionale Regionale',
        importo: addizionali.addizionaleRegionale,
        categoria: 'addizionali',
      },
      {
        descrizione: 'Addizionale Comunale',
        importo: addizionali.addizionaleComunale,
        categoria: 'addizionali',
      },
      ...fondi.trattenute,
      // Il dipendente paga l'uso privato dell'auto aziendale dal netto
      {
        descrizione: 'Trattenuta Auto Aziendale',
        importo: fringeBenefit.trattenutaAutoDipendente,
        categoria: 'autoAziendale',
      },
    ];
    const ripartizione = ripartisci(entrate, trattenute);
    const { costoAziendale, totaleTrattenute, totaleBonus, nettoAnnuo, totalePercepito } =
      totali(ripartizione);

    // Calcolo netto annuo borsa di studio (se presente)
    // Il netto borsa = importo lordo − contributo GS borsista − quota IRPEF/addizionali sulla borsa
    // La quota IRPEF/addizionali è proporzionale: (imponibileBorsa / redditoComplessivo) × (irpefFinale + addizionali)
    let dettaglioBorsaDiStudio: DettaglioBorsaDiStudio | null = null;
    if (borsaCalcolo.dettaglio) {
      const quotaBorsaSuComplessivo =
        redditoComplessivo > 0 ? borsaCalcolo.imponibileBorsa / redditoComplessivo : 0;
      const irpefBorsa = (irpefFinale + addizionali.totaleAddizionali) * quotaBorsaSuComplessivo;
      const nettoBorsaAnnuo =
        borsaCalcolo.dettaglio.importoLordo - borsaCalcolo.contributoGSBorsista - irpefBorsa;

      dettaglioBorsaDiStudio = {
        ...borsaCalcolo.dettaglio,
        nettoAnnuo: nettoBorsaAnnuo,
        nettoMensile: nettoBorsaAnnuo / 12,
      };
    }

    // Stipendio netto mensile
    const nettoMensile = nettoAnnuo / mensilita;

    // Stipendio netto mensile percepito (include benefit non tassati mensili)
    const nettoMensilePercepito = nettoMensile + benefitNonTassati.totaleEsente / 12;

    // Aliquota effettiva: la trattenuta auto paga un servizio, non è un'imposta
    const aliquotaEffettiva =
      (totaleTrattenute - fringeBenefit.trattenutaAutoDipendente - totaleBonus) / ral;

    return {
      ral,
      annoFiscale: 2026,
      mensilita,
      contributiInps,
      fringeBenefit,
      rimborsiTrasferta,
      benefitNonTassati,
      fondiContrattuali,
      fondoPensioneIntegrativo,
      regimeImpatriati: dettaglioRegimeImpatriati,
      borsaDiStudio: dettaglioBorsaDiStudio,
      ripartizione,
      costoAziendale,
      irpef,
      detrazioniLavoro,
      detrazioniFamiliari,
      cuneoFiscale,
      trattamentoIntegrativo,
      riepilogoDetrazioni,
      addizionali,
      irpefNetta,
      irpefFinale,
      totaleTrattenute,
      totaleBonus,
      nettoAnnuo,
      nettoMensile,
      nettoMensilePercepito,
      aliquotaEffettiva,
      totalePercepito,
    };
  }
}
