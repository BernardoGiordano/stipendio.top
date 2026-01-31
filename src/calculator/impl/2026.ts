import {
  AscendenteACarico,
  AutoAziendale,
  BenefitNonTassati,
  ConiugeACarico,
  DettaglioAddizionali,
  DettaglioBenefitNonTassati,
  DettaglioContributiInps,
  DettaglioCuneoFiscale,
  DettaglioDetrazioniFamiliari,
  DettaglioDetrazioniLavoro,
  DettaglioFringeBenefit,
  DettaglioIrpef,
  DettaglioRimborsiTrasferta,
  DettaglioTrattamentoIntegrativo,
  FiglioACarico,
  FringeBenefit,
  InputCalcoloStipendio,
  OutputCalcoloStipendio,
  RiepilogoDetrazioni,
  RimborsiTrasferta,
  TipoContratto,
} from '../types';
import { ADDIZIONALI_COMUNALI, ADDIZIONALI_REGIONALI } from '../addizionali';
import { StipendioCalculator } from '../calculator';

/** Scaglioni IRPEF 2026 (aliquota intermedia ridotta) */
const IRPEF_SCAGLIONI = [
  { limite: 28_000, aliquota: 0.23 },
  { limite: 50_000, aliquota: 0.33 },
  { limite: Infinity, aliquota: 0.43 },
] as const;

/** Soglie esenzione fringe benefit 2026 */
const FRINGE_BENEFIT = {
  sogliaOrdinaria: 258.23,
  sogliaSenzaFigli: 1_000,
  sogliaConFigli: 2_000,
  // Nel 2026 non esiste più la soglia speciale neoassunti
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
  previdenzaComplementare: 5_164.57,
  assistenzaSanitaria: 3_615.2,
  buoniPastoCartacei: 4.0,
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
  if (!fringeBenefit) {
    return {
      valoreTotaleLordo: 0,
      autoAziendale: null,
      sogliaEsenzione: haFigliACarico
        ? FRINGE_BENEFIT.sogliaConFigli
        : FRINGE_BENEFIT.sogliaSenzaFigli,
      sogliaSuperata: false,
      valoreImponibile: 0,
      valoreEsente: 0,
    };
  }

  let autoAziendaleDettaglio: DettaglioFringeBenefit['autoAziendale'] = null;
  let valoreAuto = 0;

  if (fringeBenefit.autoAziendale) {
    const calcolo = calcolaFringeBenefitAuto(fringeBenefit.autoAziendale);
    autoAziendaleDettaglio = calcolo;
    valoreAuto = calcolo.valore;
  }

  const valoreTotaleLordo =
    valoreAuto +
    (fringeBenefit.buoniAcquisto ?? 0) +
    (fringeBenefit.buoniCarburante ?? 0) +
    (fringeBenefit.rimborsoUtenze ?? 0) +
    (fringeBenefit.rimborsoAffitto ?? 0) +
    (fringeBenefit.rimborsoInteressiMutuo ?? 0) +
    (fringeBenefit.altri ?? 0);

  // Nel 2026 non c'è più la soglia speciale neoassunti
  let sogliaEsenzione: number;
  if (haFigliACarico) {
    sogliaEsenzione = FRINGE_BENEFIT.sogliaConFigli;
  } else {
    sogliaEsenzione = FRINGE_BENEFIT.sogliaSenzaFigli;
  }

  const sogliaSuperata = valoreTotaleLordo > sogliaEsenzione;
  const valoreImponibile = sogliaSuperata ? valoreTotaleLordo : 0;
  const valoreEsente = sogliaSuperata ? 0 : valoreTotaleLordo;

  return {
    valoreTotaleLordo,
    autoAziendale: autoAziendaleDettaglio,
    sogliaEsenzione,
    sogliaSuperata,
    valoreImponibile,
    valoreEsente,
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
      altriWelfareMensile: 0,
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

  // Calculate altri total (prefer split values if available, fallback to others field)
  const altriMensili = benefit.altriMensili ?? 0;
  const altriAnnuali = benefit.altriAnnuali ?? 0;
  const altriTotal = altriMensili * 12 + altriAnnuali;

  const altriWelfare =
    (benefit.abbonamentoTrasporto ?? 0) + (benefit.serviziWelfare ?? 0) + altriTotal;

  // Monthly welfare benefit: monthly portion of "altri" + annual welfare items spread monthly + explicit monthly benefits
  const altriWelfareMensile =
    altriMensili +
    altriAnnuali / 12 +
    (benefit.abbonamentoTrasporto ?? 0) / 12 +
    (benefit.serviziWelfare ?? 0) / 12;

  const totaleEsente = previdenza + sanita + buoniPastoEsenti + altriWelfare;
  const totaleTassato = previdenzaEccedente + sanitaEccedente + buoniPastoTassati;

  return {
    previdenzaComplementare: previdenza,
    assistenzaSanitaria: sanita,
    buoniPastoEsenti,
    buoniPastoTassati,
    altriWelfare,
    altriWelfareMensile,
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

function calcolaAddizionaleComunale(
  imponibile: number,
  comune: string,
): { addizionale: number; aliquota: number; esenzioneApplicata: boolean } {
  const config = ADDIZIONALI_COMUNALI[comune.toUpperCase()] ?? ADDIZIONALI_COMUNALI['DEFAULT'];

  if (config.esenzione && imponibile <= config.esenzione) {
    return { addizionale: 0, aliquota: config.aliquota, esenzioneApplicata: true };
  }

  const addizionale = imponibile * config.aliquota;

  return { addizionale, aliquota: config.aliquota, esenzioneApplicata: false };
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
      // neoassuntoFuoriSede2025 is ignored in 2026 - no special threshold
      rimborsiTrasferta: rimborsiTrasfertaInput,
      benefitNonTassati: benefitNonTassatiInput,
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

    // 6. CALCOLO IMPONIBILE IRPEF
    const redditoLavoroDipendente = imponibilePrevidenziale - contributiInps.totaleContributi;
    const redditoComplessivo = redditoLavoroDipendente + altriRedditi;

    // 7. CALCOLO IRPEF LORDA
    const irpef = calcolaIrpefLorda(redditoComplessivo);

    // 8. CALCOLO DETRAZIONI LAVORO DIPENDENTE
    const detrazioniLavoro = calcolaDetrazioniLavoroDipendente(
      redditoComplessivo,
      giorniLavorati,
      tipoContratto,
    );

    // 9. CALCOLO DETRAZIONI CARICHI FAMILIARI
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

    // 10. CALCOLO CUNEO FISCALE
    const cuneoFiscale = calcolaCuneoFiscale(redditoComplessivo, redditoLavoroDipendente);

    // 11. CALCOLO TOTALE DETRAZIONI
    const totaleDetrazioniPreTI =
      detrazioniLavoro.detrazioneEffettiva +
      detrazioniFamiliari.totaleDetrazioniFamiliari +
      altreDetrazioni;

    // 12. CALCOLO TRATTAMENTO INTEGRATIVO
    const trattamentoIntegrativo = calcolaTrattamentoIntegrativo(
      redditoComplessivo,
      irpef.irpefLorda,
      detrazioniLavoro.detrazioneEffettiva,
      totaleDetrazioniPreTI,
    );

    // 13. CALCOLO ADDIZIONALI
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

    // Totale trattenute
    const totaleTrattenute =
      contributiInps.totaleContributi + irpefFinale + addizionali.totaleAddizionali;

    // Totale bonus
    const totaleBonus = cuneoFiscale.indennitaEsente + trattamentoIntegrativo.importo;

    // Stipendio netto annuo
    const baseImponibile =
      ral +
      fringeBenefit.valoreImponibile +
      rimborsiTrasferta.rimborsiTassati +
      benefitNonTassati.totaleTassato;
    const nettoAnnuo = baseImponibile - totaleTrattenute + totaleBonus;

    // Stipendio netto mensile (include benefit mensili non tassati)
    const nettoMensile = nettoAnnuo / mensilita + benefitNonTassati.altriWelfareMensile;

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
      aliquotaEffettiva,
      totalePercepito,
    };
  }
}
