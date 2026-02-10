import {
  AscendenteACarico,
  AutoAziendale,
  BenefitNonTassati,
  ConiugeACarico,
  DettaglioAddizionali,
  DettaglioBenefitNonTassati,
  DettaglioCFMT,
  DettaglioContributiInps,
  DettaglioCostoAziendale,
  DettaglioFasdac,
  DettaglioCuneoFiscale,
  DettaglioDetrazioniFamiliari,
  DettaglioDetrazioniLavoro,
  DettaglioFondoNegri,
  DettaglioFondoPastore,
  DettaglioFondoPensioneIntegrativo,
  DettaglioFringeBenefit,
  DettaglioIrpef,
  DettaglioRegimeImpatriati,
  DettaglioRimborsiTrasferta,
  DettaglioTrattamentoIntegrativo,
  FiglioACarico,
  FondoPensioneIntegrativo,
  FringeBenefit,
  InputCalcoloStipendio,
  OutputCalcoloStipendio,
  RiepilogoDetrazioni,
  RimborsiTrasferta,
  TipoContratto,
} from '../types';
import { StipendioCalculator } from '../calculator';
import { ADDIZIONALI_REGIONALI } from '../addizionali/2026.regionali';
import { ADDIZIONALE_DEFAULT, ADDIZIONALI_COMUNALI } from '../addizionali/2026.comunali';

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
  sogliaAggiuntivo: 55_448,
  massimale: 120_607,
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
  previdenzaComplementare: 5_300,
  assistenzaSanitaria: 3_615.2,
  buoniPastoCartacei: 4.0,
} as const;

/** Parametri Fondo Mario Negri (previdenza dirigenti CCNL Terziario) */
const FONDO_MARIO_NEGRI = {
  /** Retribuzione convenzionale 2026 */
  retribuzioneConvenzionale: 59_224.54,
  /** Contributo ordinario a carico del dirigente (2% della retribuzione convenzionale) */
  contributoOrdinarioDirigente: 1_184.49,
} as const;

/** Parametri Fondo Antonio Pastore (assicurativo-previdenziale dirigenti CCNL Terziario) */
const FONDO_ANTONIO_PASTORE = {
  /** Contributo annuo a carico del dirigente (fisso) */
  contributoDirigente: 464.81,
} as const;

/** Parametri CFMT (Centro di Formazione Management del Terziario - CCNL Dirigenti Terziario 2026-2028) */
const CFMT = {
  contributoFormazione: 148,
  costoGestionePiattaforma: 18,
  totaleDirigente: 166,
} as const;

/** Parametri FASDAC (Fondo Assistenza Sanitaria Dirigenti - Fondo Mario Besusso) */
const FASDAC = {
  retribuzioneConvenzionale: 45_940,
  aliquotaDirigente: 1.87,
  contributoDirigente: 859.08,
} as const;

/** Parametri previdenza complementare (D.Lgs. 252/2005, aggiornato da L. 199/2025) */
const PREVIDENZA_COMPLEMENTARE = {
  /** Limite annuo di deducibilità (art. 10, c.1, lett. e-bis, TUIR - dal 2026: €5.300) */
  limiteDeducibilita: 5_300,
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

/** Contributi fondi contrattuali a carico del datore - CCNL Dirigenti Terziario 2026 */
const FONDI_DATORE_DIRIGENTI = {
  /** Fondo Mario Negri: ordinario 12,86% + integrativo 2,52% = 15,38% di retribuzione convenzionale */
  fondoNegriAliquota: 0.1538,
  fondoNegriRetribuzioneConvenzionale: 59_224.54,
  /** Associazione Antonio Pastore: premio annuo azienda */
  fondoPastore: 4_856.45,
  /** CFMT: €258 formazione + €18 piattaforma welfare */
  cfmt: 276,
  /** FASDAC: 5,29% dirigenti in servizio + 2,78% gestione pensionati = 8,07% di retribuzione convenzionale */
  fasdacAliquota: 0.0807,
  fasdacRetribuzioneConvenzionale: 45_940,
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

  const previdenza = Math.min(
    benefit.previdenzaComplementare ?? 0,
    BENEFIT_ESENTI.previdenzaComplementare,
  );
  const previdenzaEccedente = Math.max(
    0,
    (benefit.previdenzaComplementare ?? 0) - BENEFIT_ESENTI.previdenzaComplementare,
  );

  const sanita = Math.min(benefit.assistenzaSanitaria ?? 0, BENEFIT_ESENTI.assistenzaSanitaria);
  const sanitaEccedente = Math.max(
    0,
    (benefit.assistenzaSanitaria ?? 0) - BENEFIT_ESENTI.assistenzaSanitaria,
  );

  const buoniPastoTotale = benefit.buoniPasto ?? 0;
  const sogliaGiornaliera = benefit.buoniPastoElettronici
    ? BUONI_PASTO_ELETTRONICI
    : BENEFIT_ESENTI.buoniPastoCartacei;

  const giorniLavorativi = 220;
  const sogliaAnnuaBuoniPasto = sogliaGiornaliera * giorniLavorativi;
  const buoniPastoEsenti = Math.min(buoniPastoTotale, sogliaAnnuaBuoniPasto);
  const buoniPastoTassati = Math.max(0, buoniPastoTotale - sogliaAnnuaBuoniPasto);

  const altriWelfare =
    (benefit.abbonamentoTrasporto ?? 0) + (benefit.serviziWelfare ?? 0) + (benefit.altri ?? 0);

  const totaleEsente = previdenza + sanita + buoniPastoEsenti + altriWelfare;
  const totaleTassato = previdenzaEccedente + sanitaEccedente + buoniPastoTassati;

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

  const coefficienteGiorni = giorniLavorati / 365;
  const detrazioneEffettiva = (detrazioneTeorica + maggiorazione) * coefficienteGiorni;

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
    // Verifica limite reddito per essere a carico
    const limiteReddito =
      figlio.eta <= 24 ? params.limiteRedditoFigliGiovani : params.limiteRedditoCarico;
    if ((figlio.redditoAnnuo ?? 0) > limiteReddito) continue;

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
  redditoComplessivo: number,
  redditoLavoroDipendente: number,
): DettaglioCuneoFiscale {
  const params = CUNEO_FISCALE;

  if (redditoComplessivo <= params.sogliaIndennita) {
    let percentuale = 0;
    for (const fascia of params.percentualiIndennita) {
      if (redditoLavoroDipendente <= fascia.limite) {
        percentuale = fascia.percentuale;
        break;
      }
    }

    const indennita = redditoLavoroDipendente * percentuale;

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

    return {
      spettaIndennita: false,
      spettaDetrazione: true,
      indennitaEsente: 0,
      detrazioneAggiuntiva: Math.max(0, detrazione),
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
  redditoComplessivo: number,
  irpefLorda: number,
  detrazioneLavoroDipendente: number,
  totaleDetrazioni: number,
): DettaglioTrattamentoIntegrativo {
  const params = TRATTAMENTO_INTEGRATIVO;

  if (redditoComplessivo > params.sogliaParziale) {
    return {
      spetta: false,
      motivoNonSpettanza: 'Reddito superiore a €28.000',
      importo: 0,
      importoPieno: false,
    };
  }

  if (redditoComplessivo <= params.sogliaPiena) {
    const sogliaCapienza = detrazioneLavoroDipendente - params.clausolaSalvaguardia;

    if (irpefLorda > sogliaCapienza) {
      return {
        spetta: true,
        importo: params.importoMassimo,
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

function calcolaAddizionaleRegionale(
  imponibile: number,
  regione: string,
): { addizionale: number; aliquotaMedia: number } {
  const config = ADDIZIONALI_REGIONALI[regione.toUpperCase()] ?? ADDIZIONALI_REGIONALI['DEFAULT'];

  let addizionaleTotale = 0;
  let imponibileResiduo = imponibile;
  let limiteInferiore = 0;

  for (const scaglione of config.scaglioni) {
    if (imponibileResiduo <= 0) break;

    const ampiezzaScaglione = scaglione.limite - limiteInferiore;
    const imponibileScaglione = Math.min(imponibileResiduo, ampiezzaScaglione);
    addizionaleTotale += imponibileScaglione * scaglione.aliquota;

    imponibileResiduo -= imponibileScaglione;
    limiteInferiore = scaglione.limite;
  }

  const aliquotaMedia = imponibile > 0 ? addizionaleTotale / imponibile : 0;

  return { addizionale: addizionaleTotale, aliquotaMedia };
}

function calcolaFondoNegri(
  fondoMarioNegri: boolean,
  aliquotaMarginaleIrpef: number,
): DettaglioFondoNegri | null {
  if (!fondoMarioNegri) {
    return null;
  }

  const contributoAnnuo = FONDO_MARIO_NEGRI.contributoOrdinarioDirigente;
  const contributoMensile = contributoAnnuo / 12;
  const risparmoFiscaleStimato = contributoAnnuo * aliquotaMarginaleIrpef;

  return {
    contributoAnnuo,
    contributoMensile,
    risparmoFiscaleStimato,
  };
}

function calcolaFondoPastore(fondoPastore: boolean): DettaglioFondoPastore | null {
  if (!fondoPastore) {
    return null;
  }

  const contributoAnnuo = FONDO_ANTONIO_PASTORE.contributoDirigente;
  const contributoMensile = contributoAnnuo / 12;

  return {
    contributoAnnuo,
    contributoMensile,
  };
}

function calcolaCFMT(cfmt: boolean): DettaglioCFMT | null {
  if (!cfmt) {
    return null;
  }

  const contributoAnnuo = CFMT.totaleDirigente;
  const contributoMensile = contributoAnnuo / 12;

  return {
    contributoAnnuo,
    contributoMensile,
  };
}

function calcolaFasdac(fasdac: boolean): DettaglioFasdac | null {
  if (!fasdac) {
    return null;
  }

  const contributoAnnuo = FASDAC.contributoDirigente;
  const contributoMensile = contributoAnnuo / 12;

  return {
    contributoAnnuo,
    contributoMensile,
  };
}

function calcolaFondoPensioneIntegrativo(
  fondoPensione: FondoPensioneIntegrativo | undefined,
  aliquotaMarginaleIrpef: number,
  contributoFondoSquilibrio: number,
): DettaglioFondoPensioneIntegrativo | null {
  if (!fondoPensione) {
    return null;
  }

  const ralLavoratore = fondoPensione.ralLavoratore || 0;
  const ralDatore = fondoPensione.ralDatoreLavoro || 0;
  const ralEbitemp = fondoPensione.ralEbitemp || 0;

  const contributoLavoratoreAnnuo =
    ralLavoratore * ((fondoPensione.contributoLavoratore || 0) / 100);
  const contributoDatoreLavoroAnnuo =
    ralDatore * ((fondoPensione.contributoDatoreLavoro || 0) / 100);
  const contributoEbitempAnnuo = ralEbitemp * ((fondoPensione.contributoEbitemp || 0) / 100);
  const totaleContributi =
    contributoLavoratoreAnnuo + contributoDatoreLavoroAnnuo + contributoEbitempAnnuo;

  // Il plafond di €5.300 è ridotto dai contributi versati a fondi in squilibrio finanziario
  // (es. Fondo Mario Negri, che gode di deducibilità piena ex art. 20, c.7, D.Lgs. 252/2005)
  const limiteResiduo = Math.max(
    0,
    PREVIDENZA_COMPLEMENTARE.limiteDeducibilita - contributoFondoSquilibrio,
  );
  const deduzioneEffettiva = Math.min(totaleContributi, limiteResiduo);
  const eccedenzaNonDeducibile = Math.max(0, totaleContributi - limiteResiduo);
  const risparmoFiscaleStimato = deduzioneEffettiva * aliquotaMarginaleIrpef;

  return {
    contributoLavoratoreAnnuo,
    contributoLavoratoreMensile: contributoLavoratoreAnnuo / 12,
    contributoDatoreLavoroAnnuo,
    contributoEbitempAnnuo,
    totaleContributi,
    deduzioneEffettiva,
    eccedenzaNonDeducibile,
    risparmoFiscaleStimato,
  };
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

function calcolaCostoAziendale(
  ral: number,
  imponibilePrevidenziale: number,
  tipoContratto: TipoContratto,
  aziendaConCigs: boolean,
  isDirigente: boolean,
  fondoMarioNegri: boolean,
  fondoPastore: boolean,
  cfmt: boolean,
  fasdac: boolean,
  contributoDatoreFondoPensione: number,
  fringeBenefitTotale: number,
  rimborsiTrasfertaTotale: number,
  benefitNonTassatiTotale: number,
): DettaglioCostoAziendale {
  // 1. Aliquota INPS datore
  let aliquotaInpsDatore: number;
  if (tipoContratto === 'apprendistato') {
    aliquotaInpsDatore = ALIQUOTE_INPS_DATORE.apprendista;
  } else if (isDirigente) {
    aliquotaInpsDatore = aziendaConCigs
      ? ALIQUOTE_INPS_DATORE.dirigenteConCigs
      : ALIQUOTE_INPS_DATORE.dirigente;
  } else if (aziendaConCigs) {
    aliquotaInpsDatore = ALIQUOTE_INPS_DATORE.conCigs;
  } else {
    aliquotaInpsDatore = ALIQUOTE_INPS_DATORE.base;
  }
  const contributiInpsDatore = imponibilePrevidenziale * aliquotaInpsDatore;

  // 2. TFR
  const tfr = ral / TFR.divisore;

  // 3. Fondi contrattuali dirigenti (a carico datore)
  const fondoNegriDatore = fondoMarioNegri
    ? FONDI_DATORE_DIRIGENTI.fondoNegriAliquota *
      FONDI_DATORE_DIRIGENTI.fondoNegriRetribuzioneConvenzionale
    : 0;
  const fondoPastoreDatore = fondoPastore ? FONDI_DATORE_DIRIGENTI.fondoPastore : 0;
  const cfmtDatore = cfmt ? FONDI_DATORE_DIRIGENTI.cfmt : 0;
  const fasdacDatore = fasdac
    ? FONDI_DATORE_DIRIGENTI.fasdacAliquota * FONDI_DATORE_DIRIGENTI.fasdacRetribuzioneConvenzionale
    : 0;

  // 4. Totale
  const totaleAnnuo =
    ral +
    contributiInpsDatore +
    tfr +
    fondoNegriDatore +
    fondoPastoreDatore +
    cfmtDatore +
    fasdacDatore +
    contributoDatoreFondoPensione +
    fringeBenefitTotale +
    rimborsiTrasfertaTotale +
    benefitNonTassatiTotale;

  return {
    ral,
    contributiInpsDatore,
    aliquotaInpsDatore,
    tfr,
    fondoNegriDatore,
    fondoPastoreDatore,
    cfmtDatore,
    fasdacDatore,
    fondoPensioneIntegrativoDatore: contributoDatoreFondoPensione,
    fringeBenefit: fringeBenefitTotale,
    rimborsiTrasferta: rimborsiTrasfertaTotale,
    benefitNonTassati: benefitNonTassatiTotale,
    totaleAnnuo,
  };
}

export class Calculator2026 implements StipendioCalculator {
  calcolaStipendioNetto(input: InputCalcoloStipendio): OutputCalcoloStipendio {
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
      altreDetrazioni = 0,
      fringeBenefit: fringeBenefitInput,
      haFigliACarico = false,
      rimborsiTrasferta: rimborsiTrasfertaInput,
      benefitNonTassati: benefitNonTassatiInput,
      fondoMarioNegri = false,
      fondoPastore: fondoPastoreFlag = false,
      cfmt: cfmtFlag = false,
      fasdac: fasdacFlag = false,
      regimeImpatriati: regimeImpatriatiFlag = false,
      regimeImpatriatiMinorenni = false,
      fondoPensioneIntegrativo: fondoPensioneInput,
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

    // 6. CALCOLO FONDO MARIO NEGRI (previdenza complementare dirigenti CCNL Terziario)
    // Il contributo al Fondo Negri riduce l'imponibile IRPEF ed è una trattenuta reale
    const contributoFondoNegri = fondoMarioNegri
      ? FONDO_MARIO_NEGRI.contributoOrdinarioDirigente
      : 0;

    // 6c. CALCOLO FONDO ANTONIO PASTORE (assicurativo-previdenziale dirigenti CCNL Terziario)
    // Il contributo al Fondo Pastore NON riduce l'imponibile IRPEF, è una trattenuta diretta dal netto
    const contributoFondoPastore = fondoPastoreFlag ? FONDO_ANTONIO_PASTORE.contributoDirigente : 0;

    // 6d. CALCOLO CFMT (Centro di Formazione Management del Terziario)
    // Il contributo CFMT NON riduce l'imponibile IRPEF, è una trattenuta diretta dal netto
    const contributoCFMT = cfmtFlag ? CFMT.totaleDirigente : 0;

    // 6e. CALCOLO FASDAC (Fondo Assistenza Sanitaria Dirigenti)
    // Il contributo FASDAC NON riduce l'imponibile IRPEF, è una trattenuta diretta dal netto
    const contributoFasdac = fasdacFlag ? FASDAC.contributoDirigente : 0;

    // 6f. CALCOLO FONDO PENSIONE INTEGRATIVO (previdenza complementare)
    // Il contributo lavoratore + datore è deducibile dall'imponibile IRPEF fino a €5.300/anno
    // I contributi versati a fondi in squilibrio finanziario (es. Fondo Negri) riducono il plafond
    // Il contributo lavoratore è una trattenuta reale dal netto in busta paga
    // Il contributo datore NON è una trattenuta dal netto, ma concorre al limite di deducibilità
    const contributoFondoPensione = fondoPensioneInput
      ? (fondoPensioneInput.ralLavoratore || 0) *
        ((fondoPensioneInput.contributoLavoratore || 0) / 100)
      : 0;
    const contributoDatoreFondoPensione = fondoPensioneInput
      ? (fondoPensioneInput.ralDatoreLavoro || 0) *
        ((fondoPensioneInput.contributoDatoreLavoro || 0) / 100)
      : 0;
    const contributoEbitempFondoPensione = fondoPensioneInput
      ? (fondoPensioneInput.ralEbitemp || 0) * ((fondoPensioneInput.contributoEbitemp || 0) / 100)
      : 0;
    const limiteResiduo = Math.max(
      0,
      PREVIDENZA_COMPLEMENTARE.limiteDeducibilita - contributoFondoNegri,
    );
    const deduzioneFondoPensione = Math.min(
      contributoFondoPensione + contributoDatoreFondoPensione + contributoEbitempFondoPensione,
      limiteResiduo,
    );

    // 7. CALCOLO IMPONIBILE IRPEF
    // Il Fondo Negri riduce l'imponibile IRPEF (deduzione piena, no massimale)
    // Il Fondo Pensione Integrativo riduce l'imponibile IRPEF (deduzione con cap €5.300)
    // Il contributo datore + Ebitemp al fondo pensione è reddito per il dipendente (Art. 51 TUIR)
    // ma è deducibile entro il cap (Art. 10 TUIR): effetto netto zero se entro il limite
    const redditoLavoroDipendenteLordo =
      imponibilePrevidenziale +
      contributoDatoreFondoPensione +
      contributoEbitempFondoPensione -
      contributiInps.totaleContributi -
      contributoFondoNegri -
      deduzioneFondoPensione;

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
    const redditoComplessivo = redditoLavoroDipendente + altriRedditi;

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
    const cuneoFiscale = calcolaCuneoFiscale(redditoComplessivo, redditoLavoroDipendente);

    // 12. CALCOLO TOTALE DETRAZIONI
    const totaleDetrazioniPreTI =
      detrazioniLavoro.detrazioneEffettiva +
      detrazioniFamiliari.totaleDetrazioniFamiliari +
      altreDetrazioni;

    // 13. CALCOLO TRATTAMENTO INTEGRATIVO
    const trattamentoIntegrativo = calcolaTrattamentoIntegrativo(
      redditoComplessivo,
      irpef.irpefLorda,
      detrazioniLavoro.detrazioneEffettiva,
      totaleDetrazioniPreTI,
    );

    // 14. CALCOLO ADDIZIONALI
    const addRegionale = calcolaAddizionaleRegionale(redditoComplessivo, regione);
    const addComunale = calcolaAddizionaleComunale(redditoComplessivo, comune);

    const addizionali: DettaglioAddizionali = {
      addizionaleRegionale: addRegionale.addizionale,
      aliquotaRegionale: addRegionale.aliquotaMedia,
      addizionaleComunale: addComunale.addizionale,
      aliquotaComunale: addComunale.aliquota,
      esenzioneComunaleApplicata: addComunale.esenzioneApplicata,
      totaleAddizionali: addRegionale.addizionale + addComunale.addizionale,
    };

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

    // 15. CALCOLO DETTAGLIO FONDO MARIO NEGRI
    // Determina l'aliquota marginale IRPEF per stimare il risparmio fiscale
    const aliquotaMarginaleIrpef =
      irpef.dettaglioScaglioni.length > 0
        ? irpef.dettaglioScaglioni[irpef.dettaglioScaglioni.length - 1].aliquota
        : 0;
    const fondoNegri = calcolaFondoNegri(fondoMarioNegri, aliquotaMarginaleIrpef);

    // 15b. CALCOLO DETTAGLIO FONDO ANTONIO PASTORE
    const fondoPastore = calcolaFondoPastore(fondoPastoreFlag);

    // 15c. CALCOLO DETTAGLIO CFMT
    const cfmt = calcolaCFMT(cfmtFlag);

    // 15d. CALCOLO DETTAGLIO FASDAC
    const fasdac = calcolaFasdac(fasdacFlag);

    // 15e. CALCOLO DETTAGLIO FONDO PENSIONE INTEGRATIVO
    const fondoPensioneIntegrativo = calcolaFondoPensioneIntegrativo(
      fondoPensioneInput,
      aliquotaMarginaleIrpef,
      contributoFondoNegri,
    );

    // 16. CALCOLO COSTO AZIENDALE
    const isDirigente = fondoMarioNegri || fondoPastoreFlag || cfmtFlag || fasdacFlag;
    const costoAziendale = calcolaCostoAziendale(
      ral,
      contributiInps.imponibilePrevidenziale,
      tipoContratto,
      aziendaConCigs,
      isDirigente,
      fondoMarioNegri,
      fondoPastoreFlag,
      cfmtFlag,
      fasdacFlag,
      contributoDatoreFondoPensione,
      fringeBenefit.valoreTotaleLordo,
      rimborsiTrasferta.totaleRimborsi,
      benefitNonTassati.totaleEsente + benefitNonTassati.totaleTassato,
    );

    // Totale trattenute (include contributo Fondo Negri, Fondo Pastore, CFMT, FASDAC e contributo lavoratore Fondo Pensione)
    const totaleTrattenute =
      contributiInps.totaleContributi +
      irpefFinale +
      addizionali.totaleAddizionali +
      contributoFondoNegri +
      contributoFondoPastore +
      contributoCFMT +
      contributoFasdac +
      contributoFondoPensione;

    // Totale bonus
    const totaleBonus = cuneoFiscale.indennitaEsente + trattamentoIntegrativo.importo;

    // Stipendio netto annuo
    // Nota: l'auto aziendale è un beneficio in natura (non denaro), quindi non aumenta il netto.
    // Solo i fringe benefit monetari (buoni, rimborsi) aumentano il netto perché sono valore ricevuto.
    // La trattenuta auto è un costo reale che il dipendente paga, quindi si sottrae dal netto.
    const baseImponibile =
      ral +
      fringeBenefit.valoreMonetarioImponibile +
      rimborsiTrasferta.rimborsiTassati +
      benefitNonTassati.totaleTassato;
    const nettoAnnuo =
      baseImponibile - totaleTrattenute + totaleBonus - fringeBenefit.trattenutaAutoDipendente;

    // Stipendio netto mensile
    const nettoMensile = nettoAnnuo / mensilita;

    // Stipendio netto mensile percepito (include benefit non tassati mensili)
    const nettoMensilePercepito = nettoMensile + benefitNonTassati.totaleEsente / 12;

    // Aliquota effettiva
    const aliquotaEffettiva = (totaleTrattenute - totaleBonus) / ral;

    // Totale percepito
    const totalePercepito =
      nettoAnnuo +
      fringeBenefit.valoreEsente +
      rimborsiTrasferta.totaleEsente +
      benefitNonTassati.totaleEsente;

    return {
      ral,
      annoFiscale: 2026,
      mensilita,
      contributiInps,
      fringeBenefit,
      rimborsiTrasferta,
      benefitNonTassati,
      fondoNegri,
      fondoPastore,
      cfmt,
      fasdac,
      fondoPensioneIntegrativo,
      regimeImpatriati: dettaglioRegimeImpatriati,
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
