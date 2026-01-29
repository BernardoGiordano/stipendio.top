/** Scaglioni IRPEF 2025 */
export const IRPEF_SCAGLIONI_2025 = [
  { limite: 28_000, aliquota: 0.23 },
  { limite: 50_000, aliquota: 0.35 },
  { limite: Infinity, aliquota: 0.43 },
] as const;

/** Scaglioni IRPEF 2026 (aliquota intermedia ridotta) */
export const IRPEF_SCAGLIONI_2026 = [
  { limite: 28_000, aliquota: 0.23 },
  { limite: 50_000, aliquota: 0.33 },
  { limite: Infinity, aliquota: 0.43 },
] as const;

/** Aliquote contributive INPS */
export const ALIQUOTE_INPS = {
  /** Aliquota base a carico del lavoratore */
  baseWorker: 0.0919,
  /** Aliquota per aziende con CIGS (>15 dipendenti) */
  conCigs: 0.0949,
  /** Aliquota per apprendisti */
  apprendista: 0.0584,
  /** Contributo aggiuntivo 1% sopra prima fascia */
  aggiuntivo: 0.01,
  /** Soglia annua per contributo aggiuntivo 1% (prima fascia pensionabile) */
  sogliaAggiuntivo: 55_448,
  /** Massimale contributivo annuo (iscritti post 1996) */
  massimale: 120_607,
} as const;

/** Parametri detrazioni lavoro dipendente */
export const DETRAZIONI_LAVORO_DIPENDENTE = {
  /** Importo fisso per redditi fino a €15.000 */
  importoFissoBase: 1_955,
  /** Minimo garantito tempo indeterminato */
  minimoIndeterminato: 690,
  /** Minimo garantito tempo determinato */
  minimoDeterminato: 1_380,
  /** Coefficiente per fascia 15k-28k */
  coefficienteFascia2: 1_190,
  /** Base detrazione fascia 15k-28k e 28k-50k */
  baseDetrazione: 1_910,
  /** Maggiorazione per redditi 25k-35k */
  maggiorazioneRedditiMedi: 65,
} as const;

/** Parametri cuneo fiscale 2025 */
export const CUNEO_FISCALE = {
  /** Soglia massima per indennità esente */
  sogliaIndennita: 20_000,
  /** Soglia massima per detrazione aggiuntiva */
  sogliaDetrazione: 40_000,
  /** Percentuali indennità per fasce di reddito */
  percentualiIndennita: [
    { limite: 8_500, percentuale: 0.071 },
    { limite: 15_000, percentuale: 0.053 },
    { limite: 20_000, percentuale: 0.048 },
  ],
  /** Importo fisso detrazione fascia 20k-32k */
  detrazioneBase: 1_000,
  /** Soglia inizio decalage detrazione */
  sogliaDecalage: 32_000,
} as const;

/** Parametri trattamento integrativo */
export const TRATTAMENTO_INTEGRATIVO = {
  /** Importo massimo annuo */
  importoMassimo: 1_200,
  /** Soglia massima reddito per spettanza piena */
  sogliaPiena: 15_000,
  /** Soglia massima reddito per spettanza parziale */
  sogliaParziale: 28_000,
  /** Clausola di salvaguardia (differenza detrazione) */
  clausolaSalvaguardia: 75,
} as const;

/** Parametri detrazioni carichi familiari */
export const DETRAZIONI_FAMILIARI = {
  /** Limite reddito per essere a carico (generale) */
  limiteRedditoCarico: 2_840.51,
  /** Limite reddito per figli fino a 24 anni */
  limiteRedditoFigliGiovani: 4_000,
  /** Età massima figli per detrazione (esclusi disabili) */
  etaMassimaFigli: 30,
  /** Età minima figli per detrazione (sotto gestiti da Assegno Unico) */
  etaMinimaFigli: 21,
  /** Importo teorico detrazione figli */
  importoTeoricoFigli: 950,
  /** Coefficiente base calcolo figli */
  coefficienteBaseFigli: 95_000,
  /** Incremento coefficiente per ogni figlio oltre il primo */
  incrementoPerFiglio: 15_000,
  /** Importo teorico detrazione altri familiari (ascendenti) */
  importoTeoricoAltri: 750,
  /** Coefficiente base calcolo altri familiari */
  coefficienteBaseAltri: 80_000,
} as const;

/** Parametri detrazione coniuge */
export const DETRAZIONE_CONIUGE = {
  /** Importo base fascia 1 */
  importoBaseFascia1: 800,
  /** Coefficiente riduzione fascia 1 */
  coefficienteRiduzioneFascia1: 110,
  /** Importo fisso fascia 2 */
  importoFissoFascia2: 690,
  /** Soglie fascia 1 */
  sogliaFascia1: 15_000,
  /** Soglia fascia 2 */
  sogliaFascia2: 40_000,
  /** Soglia fascia 3 */
  sogliaFascia3: 80_000,
  /** Maggiorazioni per fasce specifiche (29k-35.2k) */
  maggiorazioni: [
    { min: 29_000, max: 29_200, importo: 10 },
    { min: 29_200, max: 34_700, importo: 20 },
    { min: 34_700, max: 35_000, importo: 30 },
    { min: 35_000, max: 35_100, importo: 20 },
    { min: 35_100, max: 35_200, importo: 10 },
  ],
} as const;

/** Aliquote addizionali regionali IRPEF (esempi principali regioni) */
export const ADDIZIONALI_REGIONALI: Record<
  string,
  { scaglioni: Array<{ limite: number; aliquota: number }> }
> = {
  LOMBARDIA: {
    scaglioni: [
      { limite: 15_000, aliquota: 0.0123 },
      { limite: 28_000, aliquota: 0.0158 },
      { limite: 50_000, aliquota: 0.0172 },
      { limite: Infinity, aliquota: 0.0173 },
    ],
  },
  LAZIO: {
    scaglioni: [
      { limite: 28_000, aliquota: 0.0173 },
      { limite: Infinity, aliquota: 0.0333 },
    ],
  },
  CAMPANIA: {
    scaglioni: [
      { limite: 15_000, aliquota: 0.0173 },
      { limite: 28_000, aliquota: 0.0203 },
      { limite: 50_000, aliquota: 0.0233 },
      { limite: Infinity, aliquota: 0.0333 },
    ],
  },
  PIEMONTE: {
    scaglioni: [
      { limite: 15_000, aliquota: 0.0162 },
      { limite: 28_000, aliquota: 0.0213 },
      { limite: 50_000, aliquota: 0.027 },
      { limite: Infinity, aliquota: 0.0333 },
    ],
  },
  VENETO: {
    scaglioni: [
      { limite: 15_000, aliquota: 0.0123 },
      { limite: 28_000, aliquota: 0.0193 },
      { limite: 50_000, aliquota: 0.0203 },
      { limite: Infinity, aliquota: 0.0223 },
    ],
  },
  EMILIA_ROMAGNA: {
    scaglioni: [
      { limite: 15_000, aliquota: 0.0133 },
      { limite: 28_000, aliquota: 0.0193 },
      { limite: 50_000, aliquota: 0.0203 },
      { limite: Infinity, aliquota: 0.0223 },
    ],
  },
  TOSCANA: {
    scaglioni: [
      { limite: 15_000, aliquota: 0.0142 },
      { limite: 28_000, aliquota: 0.0177 },
      { limite: 50_000, aliquota: 0.0212 },
      { limite: Infinity, aliquota: 0.0233 },
    ],
  },
  SICILIA: {
    scaglioni: [
      { limite: 15_000, aliquota: 0.0123 },
      { limite: 28_000, aliquota: 0.0183 },
      { limite: 50_000, aliquota: 0.0203 },
      { limite: Infinity, aliquota: 0.0223 },
    ],
  },
  PUGLIA: {
    scaglioni: [
      { limite: 15_000, aliquota: 0.0133 },
      { limite: 28_000, aliquota: 0.0183 },
      { limite: 50_000, aliquota: 0.0203 },
      { limite: Infinity, aliquota: 0.0233 },
    ],
  },
  // Aliquota di default per regioni non specificate (aliquota base nazionale)
  DEFAULT: {
    scaglioni: [{ limite: Infinity, aliquota: 0.0123 }],
  },
};

/** Soglie esenzione fringe benefit 2025-2027 (art. 51 comma 3 TUIR modificato) */
export const FRINGE_BENEFIT = {
  /** Soglia esenzione ordinaria (TUIR base) */
  sogliaOrdinaria: 258.23,
  /** Soglia esenzione senza figli a carico (2025-2027) */
  sogliaSenzaFigli: 1_000,
  /** Soglia esenzione con figli a carico (2025-2027) */
  sogliaConFigli: 2_000,
  /** Soglia speciale neoassunti fuori sede >100km (solo 2025, solo fiscale) */
  sogliaNeoassuntiFuoriSede: 5_000,
} as const;

/** Percentuali calcolo fringe benefit auto aziendale uso promiscuo (dal 2025) */
export const AUTO_AZIENDALE_2025 = {
  /** Percorrenza convenzionale annua */
  percorrenzaConvenzionale: 15_000,
  /** Percentuale veicoli elettrici (BEV) */
  percentualeElettrico: 0.1,
  /** Percentuale veicoli ibridi plug-in (PHEV) */
  percentualeIbridoPlugIn: 0.2,
  /** Percentuale altri veicoli (benzina, diesel, GPL, metano, ibrido non plug-in) */
  percentualeAltri: 0.5,
} as const;

/** Percentuali calcolo fringe benefit auto (regime pre-2025, basato su CO2) */
export const AUTO_AZIENDALE_PRE_2025 = {
  /** Emissioni ≤ 60 g/km */
  percentualeBassaEmissione: 0.25,
  /** Emissioni 61-160 g/km */
  percentualeMediaEmissione: 0.3,
  /** Emissioni 161-190 g/km */
  percentualeAltaEmissione: 0.5,
  /** Emissioni > 190 g/km */
  percentualeMoltoAltaEmissione: 0.6,
} as const;

/** Soglie rimborsi trasferta esenti (art. 51 comma 5 TUIR) */
export const RIMBORSI_TRASFERTA = {
  /** Indennità forfettaria giornaliera Italia (esente) */
  forfettarioItalia: 46.48,
  /** Indennità forfettaria giornaliera estero (esente) */
  forfettarioEstero: 77.47,
  /** Riduzione forfettario se rimborsato solo vitto O solo alloggio */
  riduzioneUnTerzo: 1 / 3,
  /** Riduzione forfettario se rimborsati vitto E alloggio */
  riduzioneDueTerzi: 2 / 3,
} as const;

/** Limiti benefit esenti da tassazione (welfare aziendale art. 51 comma 2 TUIR) */
export const BENEFIT_ESENTI = {
  /** Contributi previdenza complementare */
  previdenzaComplementare: 5_164.57,
  /** Contributi assistenza sanitaria integrativa */
  assistenzaSanitaria: 3_615.2,
  /** Buoni pasto cartacei (giornaliero) */
  buoniPastoCartacei: 4.0,
  /** Buoni pasto elettronici (giornaliero) - 2025 */
  buoniPastoElettronici2025: 8.0,
  /** Buoni pasto elettronici (giornaliero) - dal 2026 */
  buoniPastoElettronici2026: 10.0,
  /** Abbonamento trasporto pubblico (100% esente) */
  abbonamentoTrasporto: Infinity,
  /** Servizi welfare (asili, borse studio, ecc.) - 100% esenti */
  serviziWelfare: Infinity,
} as const;

/** Aliquote addizionali comunali (esempi principali città) */
export const ADDIZIONALI_COMUNALI: Record<string, { aliquota: number; esenzione?: number }> = {
  ROMA: { aliquota: 0.009, esenzione: 14_000 },
  MILANO: { aliquota: 0.008, esenzione: 21_000 },
  NAPOLI: { aliquota: 0.008 },
  TORINO: { aliquota: 0.008 },
  PALERMO: { aliquota: 0.008 },
  GENOVA: { aliquota: 0.008 },
  BOLOGNA: { aliquota: 0.008, esenzione: 12_000 },
  FIRENZE: { aliquota: 0.003 },
  BARI: { aliquota: 0.008 },
  VENEZIA: { aliquota: 0.008 },
  // Default per comuni non specificati
  DEFAULT: { aliquota: 0.008 },
};

/** Tipologia di contratto */
export type TipoContratto = 'indeterminato' | 'determinato' | 'apprendistato';

/** Tipologia alimentazione auto aziendale */
export type TipoAlimentazioneAuto = 'elettrico' | 'ibrido_plugin' | 'altro';

/** Dettaglio auto aziendale in uso promiscuo */
export interface AutoAziendale {
  /** Costo chilometrico ACI (€/km) - da tabelle ACI annuali */
  costoKmAci: number;
  /** Tipo alimentazione veicolo */
  tipoAlimentazione: TipoAlimentazioneAuto;
  /** Mesi di utilizzo nell'anno (default 12) */
  mesiUtilizzo?: number;
  /** Importo eventualmente trattenuto al dipendente */
  trattenutaDipendente?: number;
  /** Indica se il veicolo è stato assegnato prima del 2025 (regime CO2) */
  assegnatoPre2025?: boolean;
  /** Emissioni CO2 g/km (richiesto solo se assegnatoPre2025 = true) */
  emissioniCO2?: number;
}

/** Dettaglio fringe benefit */
export interface FringeBenefit {
  /** Valore buoni acquisto/spesa */
  buoniAcquisto?: number;
  /** Valore buoni carburante */
  buoniCarburante?: number;
  /** Auto aziendale uso promiscuo */
  autoAziendale?: AutoAziendale;
  /** Rimborso utenze domestiche (acqua, luce, gas) */
  rimborsoUtenze?: number;
  /** Rimborso affitto prima casa */
  rimborsoAffitto?: number;
  /** Rimborso interessi mutuo prima casa */
  rimborsoInteressiMutuo?: number;
  /** Altri fringe benefit (telefono, PC, alloggio, ecc.) */
  altri?: number;
}

/** Dettaglio rimborsi spese trasferta */
export interface RimborsiTrasferta {
  /** Modalità rimborso trasferte fuori comune */
  modalitaRimborso?: 'forfettario' | 'misto' | 'analitico';
  /** Giorni trasferta Italia (per calcolo forfettario) */
  giorniTrasfertaItalia?: number;
  /** Giorni trasferta estero (per calcolo forfettario) */
  giorniTrasfertaEstero?: number;
  /** Rimborso vitto documentato (analitico/misto) */
  rimborsoVitto?: number;
  /** Rimborso alloggio documentato (analitico/misto) */
  rimborsoAlloggio?: number;
  /** Rimborso viaggio/trasporto documentato */
  rimborsoViaggio?: number;
  /** Rimborso chilometrico auto propria */
  rimborsoKm?: number;
  /** Indica se i pagamenti sono tracciabili (obbligatorio dal 2025 per vitto/alloggio/taxi) */
  pagamentiTracciabili?: boolean;
}

/** Dettaglio benefit non tassati (welfare aziendale) */
export interface BenefitNonTassati {
  /** Contributi previdenza complementare (fondo pensione) */
  previdenzaComplementare?: number;
  /** Contributi assistenza sanitaria integrativa */
  assistenzaSanitaria?: number;
  /** Valore buoni pasto annuo */
  buoniPasto?: number;
  /** Indica se buoni pasto elettronici (soglia diversa) */
  buoniPastoElettronici?: boolean;
  /** Abbonamento trasporto pubblico */
  abbonamentoTrasporto?: number;
  /** Servizi welfare (asili nido, borse studio, centri estivi, ecc.) */
  serviziWelfare?: number;
  /** Altri rimborsi non tassati */
  altri?: number;
}

/** Anno fiscale di riferimento */
export type AnnoFiscale = 2025 | 2026;

/** Informazioni su un figlio a carico */
export interface FiglioACarico {
  /** Età del figlio */
  eta: number;
  /** Indica se il figlio è disabile */
  disabile: boolean;
  /** Percentuale di carico (default 100%, 50% se ripartito) */
  percentualeCarico?: number;
}

/** Dati del coniuge a carico */
export interface ConiugeACarico {
  /** Reddito annuo del coniuge */
  redditoAnnuo: number;
  /** Percentuale di carico (default 100%) */
  percentualeCarico?: number;
}

/** Dati di un ascendente a carico */
export interface AscendenteACarico {
  /** Reddito annuo dell'ascendente */
  redditoAnnuo: number;
  /** Indica se è convivente (requisito obbligatorio dal 2025) */
  convivente: boolean;
}

/** Input per il calcolo dello stipendio netto */
export interface InputCalcoloStipendio {
  /** Reddito Annuo Lordo (RAL) */
  ral: number;

  /** Numero di mensilità (tipicamente 13 o 14) */
  mensilita: number;

  /** Giorni lavorati nell'anno (default 365) */
  giorniLavorati?: number;

  /** Tipo di contratto */
  tipoContratto: TipoContratto;

  /** Azienda con più di 15 dipendenti soggetta a CIGS */
  aziendaConCigs?: boolean;

  /** Lavoratore iscritto alla previdenza dal 1996 in poi */
  iscrittoPost1996?: boolean;

  /** Anno fiscale di riferimento */
  annoFiscale: AnnoFiscale;

  /** Codice regione per addizionale (uppercase) */
  regione: string;

  /** Codice comune per addizionale (uppercase) */
  comune: string;

  /** Coniuge a carico */
  coniuge?: ConiugeACarico;

  /** Lista figli a carico */
  figli?: FiglioACarico[];

  /** Lista ascendenti a carico (genitori/nonni conviventi) */
  ascendenti?: AscendenteACarico[];

  /** Altri redditi concorrenti al reddito complessivo (es. redditi fondiari) */
  altriRedditi?: number;

  /** Altre detrazioni spettanti (es. interessi mutuo, spese mediche) */
  altreDetrazioni?: number;

  // === FRINGE BENEFIT E COMPENSI IN NATURA ===

  /** Fringe benefit tassabili (oltre soglia esenzione) */
  fringeBenefit?: FringeBenefit;

  /** Indica se il lavoratore ha figli a carico (per soglia fringe benefit) */
  haFigliACarico?: boolean;

  /** Neoassunto 2025 fuori sede >100km (soglia speciale €5.000) */
  neoassuntoFuoriSede2025?: boolean;

  // === RIMBORSI SPESE ===

  /** Rimborsi spese trasferta */
  rimborsiTrasferta?: RimborsiTrasferta;

  // === BENEFIT NON TASSATI ===

  /** Benefit non tassati (welfare aziendale) */
  benefitNonTassati?: BenefitNonTassati;
}

/** Dettaglio dei contributi INPS */
export interface DettaglioContributiInps {
  /** Imponibile previdenziale */
  imponibilePrevidenziale: number;
  /** Aliquota applicata */
  aliquotaApplicata: number;
  /** Contributi base (9,19% o variante) */
  contributiBase: number;
  /** Contributo aggiuntivo 1% (se applicabile) */
  contributoAggiuntivo: number;
  /** Totale contributi a carico del lavoratore */
  totaleContributi: number;
}

/** Dettaglio del calcolo IRPEF */
export interface DettaglioIrpef {
  /** Imponibile IRPEF (reddito complessivo) */
  imponibileIrpef: number;
  /** IRPEF lorda calcolata per scaglioni */
  irpefLorda: number;
  /** Dettaglio imposta per ogni scaglione */
  dettaglioScaglioni: Array<{
    scaglione: number;
    imponibileScaglione: number;
    aliquota: number;
    impostaScaglione: number;
  }>;
}

/** Dettaglio detrazioni lavoro dipendente */
export interface DettaglioDetrazioniLavoro {
  /** Detrazione teorica calcolata */
  detrazioneTeorica: number;
  /** Maggiorazione per redditi medi (€65) */
  maggiorazione: number;
  /** Coefficiente giorni lavorati */
  coefficienteGiorni: number;
  /** Detrazione effettiva (rapportata ai giorni) */
  detrazioneEffettiva: number;
}

/** Dettaglio cuneo fiscale */
export interface DettaglioCuneoFiscale {
  /** Indica se spetta l'indennità esente (reddito ≤ 20k) */
  spettaIndennita: boolean;
  /** Indica se spetta la detrazione (reddito 20k-40k) */
  spettaDetrazione: boolean;
  /** Importo indennità esente */
  indennitaEsente: number;
  /** Importo detrazione aggiuntiva */
  detrazioneAggiuntiva: number;
  /** Percentuale applicata per indennità */
  percentualeIndennita?: number;
}

/** Dettaglio trattamento integrativo */
export interface DettaglioTrattamentoIntegrativo {
  /** Indica se spetta */
  spetta: boolean;
  /** Motivo di non spettanza (se applicabile) */
  motivoNonSpettanza?: string;
  /** Importo spettante */
  importo: number;
  /** Indica se è a importo pieno o ridotto */
  importoPieno: boolean;
}

/** Dettaglio detrazioni carichi familiari */
export interface DettaglioDetrazioniFamiliari {
  /** Detrazione per coniuge */
  detrazioneConiuge: number;
  /** Detrazione per figli */
  detrazioneFigli: number;
  /** Numero figli con detrazione */
  numeroFigliConDetrazione: number;
  /** Detrazione per ascendenti */
  detrazioneAscendenti: number;
  /** Numero ascendenti con detrazione */
  numeroAscendentiConDetrazione: number;
  /** Totale detrazioni familiari */
  totaleDetrazioniFamiliari: number;
}

/** Dettaglio addizionali */
export interface DettaglioAddizionali {
  /** Addizionale regionale */
  addizionaleRegionale: number;
  /** Aliquota media regionale applicata */
  aliquotaRegionale: number;
  /** Addizionale comunale */
  addizionaleComunale: number;
  /** Aliquota comunale applicata */
  aliquotaComunale: number;
  /** Indica se applicata esenzione comunale */
  esenzioneComunaleApplicata: boolean;
  /** Totale addizionali */
  totaleAddizionali: number;
}

/** Dettaglio fringe benefit */
export interface DettaglioFringeBenefit {
  /** Valore totale fringe benefit lordi */
  valoreTotaleLordo: number;
  /** Dettaglio auto aziendale */
  autoAziendale: {
    /** Valore calcolato fringe benefit auto */
    valore: number;
    /** Percentuale applicata */
    percentualeApplicata: number;
    /** Mesi di utilizzo */
    mesiUtilizzo: number;
  } | null;
  /** Soglia esenzione applicabile */
  sogliaEsenzione: number;
  /** Indica se soglia superata (tutto tassabile) */
  sogliaSuperata: boolean;
  /** Valore imponibile (se soglia superata = totale, altrimenti 0) */
  valoreImponibile: number;
  /** Valore esente */
  valoreEsente: number;
}

/** Dettaglio rimborsi trasferta */
export interface DettaglioRimborsiTrasferta {
  /** Totale rimborsi forfettari esenti */
  rimborsoForfettarioEsente: number;
  /** Totale rimborsi documentati esenti */
  rimborsoDocumentatoEsente: number;
  /** Rimborsi tassati (pagamenti non tracciabili) */
  rimborsiTassati: number;
  /** Totale rimborsi esenti */
  totaleEsente: number;
  /** Totale rimborsi */
  totaleRimborsi: number;
}

/** Dettaglio benefit non tassati */
export interface DettaglioBenefitNonTassati {
  /** Contributi previdenza complementare (esenti) */
  previdenzaComplementare: number;
  /** Contributi assistenza sanitaria (esenti) */
  assistenzaSanitaria: number;
  /** Buoni pasto (esenti) */
  buoniPastoEsenti: number;
  /** Buoni pasto eccedenti (tassati) */
  buoniPastoTassati: number;
  /** Altri welfare (esenti) */
  altriWelfare: number;
  /** Totale benefit esenti */
  totaleEsente: number;
  /** Totale benefit tassati (eccedenze) */
  totaleTassato: number;
}

/** Riepilogo completo detrazioni */
export interface RiepilogoDetrazioni {
  /** Detrazioni lavoro dipendente */
  lavoroDipendente: number;
  /** Detrazioni carichi familiari */
  carichiFamiliari: number;
  /** Detrazione cuneo fiscale */
  cuneoFiscale: number;
  /** Altre detrazioni (input utente) */
  altre: number;
  /** Totale detrazioni */
  totale: number;
}

/** Output completo del calcolo */
export interface OutputCalcoloStipendio {
  /** RAL di partenza */
  ral: number;
  /** Anno fiscale */
  annoFiscale: AnnoFiscale;
  /** Numero mensilità */
  mensilita: number;

  /** Dettaglio contributi INPS */
  contributiInps: DettaglioContributiInps;

  /** Dettaglio fringe benefit */
  fringeBenefit: DettaglioFringeBenefit;

  /** Dettaglio rimborsi trasferta */
  rimborsiTrasferta: DettaglioRimborsiTrasferta;

  /** Dettaglio benefit non tassati */
  benefitNonTassati: DettaglioBenefitNonTassati;

  /** Dettaglio calcolo IRPEF */
  irpef: DettaglioIrpef;

  /** Detrazioni lavoro dipendente */
  detrazioniLavoro: DettaglioDetrazioniLavoro;
  /** Detrazioni carichi familiari */
  detrazioniFamiliari: DettaglioDetrazioniFamiliari;
  /** Cuneo fiscale */
  cuneoFiscale: DettaglioCuneoFiscale;
  /** Trattamento integrativo */
  trattamentoIntegrativo: DettaglioTrattamentoIntegrativo;
  /** Riepilogo totale detrazioni */
  riepilogoDetrazioni: RiepilogoDetrazioni;

  /** Dettaglio addizionali */
  addizionali: DettaglioAddizionali;

  /** IRPEF netta (dopo detrazioni, prima di addizionali) */
  irpefNetta: number;
  /** IRPEF finale (dopo detrazione cuneo) */
  irpefFinale: number;
  /** Totale trattenute (contributi + IRPEF finale + addizionali) */
  totaleTrattenute: number;
  /** Totale bonus (indennità cuneo + trattamento integrativo) */
  totaleBonus: number;

  /** Stipendio netto annuo */
  nettoAnnuo: number;
  /** Stipendio netto mensile */
  nettoMensile: number;
  /** Aliquota effettiva totale (trattenute/RAL) */
  aliquotaEffettiva: number;
  /** Totale percepito (netto + rimborsi esenti + benefit esenti) */
  totalePercepito: number;
}

/**
 * Calcola il valore del fringe benefit per auto aziendale in uso promiscuo
 */
function calcolaFringeBenefitAuto(auto: AutoAziendale): {
  valore: number;
  percentualeApplicata: number;
  mesiUtilizzo: number;
} {
  const mesi = auto.mesiUtilizzo ?? 12;
  const trattenuta = auto.trattenutaDipendente ?? 0;

  let percentuale: number;

  if (auto.assegnatoPre2025 && auto.emissioniCO2 !== undefined) {
    // Regime pre-2025 basato su emissioni CO2
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
    // Regime 2025 basato su tipo alimentazione
    switch (auto.tipoAlimentazione) {
      case 'elettrico':
        percentuale = AUTO_AZIENDALE_2025.percentualeElettrico;
        break;
      case 'ibrido_plugin':
        percentuale = AUTO_AZIENDALE_2025.percentualeIbridoPlugIn;
        break;
      default:
        percentuale = AUTO_AZIENDALE_2025.percentualeAltri;
    }
  }

  // Formula: (Costo €/km × 15.000 km × percentuale) × (mesi/12) - trattenuta
  const valoreAnnuo = auto.costoKmAci * AUTO_AZIENDALE_2025.percorrenzaConvenzionale * percentuale;
  const valoreRapportato = (valoreAnnuo * mesi) / 12;
  const valoreNetto = Math.max(0, valoreRapportato - trattenuta);

  return {
    valore: valoreNetto,
    percentualeApplicata: percentuale,
    mesiUtilizzo: mesi,
  };
}

/**
 * Calcola il totale dei fringe benefit e la loro tassazione
 */
function calcolaFringeBenefit(
  fringeBenefit: FringeBenefit | undefined,
  haFigliACarico: boolean,
  neoassuntoFuoriSede: boolean,
  annoFiscale: AnnoFiscale,
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

  // Calcola valore auto aziendale se presente
  let autoAziendaleDettaglio: DettaglioFringeBenefit['autoAziendale'] = null;
  let valoreAuto = 0;

  if (fringeBenefit.autoAziendale) {
    const calcolo = calcolaFringeBenefitAuto(fringeBenefit.autoAziendale);
    autoAziendaleDettaglio = calcolo;
    valoreAuto = calcolo.valore;
  }

  // Somma tutti i fringe benefit
  const valoreTotaleLordo =
    valoreAuto +
    (fringeBenefit.buoniAcquisto ?? 0) +
    (fringeBenefit.buoniCarburante ?? 0) +
    (fringeBenefit.rimborsoUtenze ?? 0) +
    (fringeBenefit.rimborsoAffitto ?? 0) +
    (fringeBenefit.rimborsoInteressiMutuo ?? 0) +
    (fringeBenefit.altri ?? 0);

  // Determina soglia esenzione applicabile
  let sogliaEsenzione: number;
  if (neoassuntoFuoriSede && annoFiscale === 2025) {
    sogliaEsenzione = FRINGE_BENEFIT.sogliaNeoassuntiFuoriSede;
  } else if (haFigliACarico) {
    sogliaEsenzione = FRINGE_BENEFIT.sogliaConFigli;
  } else {
    sogliaEsenzione = FRINGE_BENEFIT.sogliaSenzaFigli;
  }

  // Verifica superamento soglia (sistema "a soglia secca")
  // Se superata anche di 1 centesimo, TUTTO l'importo diventa imponibile
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

/**
 * Calcola i rimborsi trasferta e la loro tassazione
 */
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

  // Calcolo rimborso forfettario
  const giorniItalia = rimborsi.giorniTrasfertaItalia ?? 0;
  const giorniEstero = rimborsi.giorniTrasfertaEstero ?? 0;

  if (rimborsi.modalitaRimborso === 'forfettario') {
    rimborsoForfettarioEsente =
      giorniItalia * RIMBORSI_TRASFERTA.forfettarioItalia +
      giorniEstero * RIMBORSI_TRASFERTA.forfettarioEstero;
  } else if (rimborsi.modalitaRimborso === 'misto') {
    // Nel misto, la franchigia forfettaria è ridotta
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

  // Rimborsi documentati
  const rimborsoVitto = rimborsi.rimborsoVitto ?? 0;
  const rimborsoAlloggio = rimborsi.rimborsoAlloggio ?? 0;
  const rimborsoViaggio = rimborsi.rimborsoViaggio ?? 0;
  const rimborsoKm = rimborsi.rimborsoKm ?? 0;

  // Dal 2025: vitto/alloggio/taxi richiedono pagamento tracciabile
  const pagamentiTracciabili = rimborsi.pagamentiTracciabili ?? true;

  if (pagamentiTracciabili) {
    // Tutto esente
    rimborsoDocumentatoEsente = rimborsoVitto + rimborsoAlloggio + rimborsoViaggio + rimborsoKm;
  } else {
    // Vitto e alloggio non tracciabili sono tassati
    rimborsiTassati = rimborsoVitto + rimborsoAlloggio;
    // Viaggio e km restano esenti (trasporto pubblico e km non richiedono tracciabilità)
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

/**
 * Calcola i benefit non tassati (welfare aziendale)
 */
function calcolaBenefitNonTassati(
  benefit: BenefitNonTassati | undefined,
  annoFiscale: AnnoFiscale,
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

  // Previdenza complementare (esente fino al limite)
  const previdenza = Math.min(
    benefit.previdenzaComplementare ?? 0,
    BENEFIT_ESENTI.previdenzaComplementare,
  );
  const previdenzaEccedente = Math.max(
    0,
    (benefit.previdenzaComplementare ?? 0) - BENEFIT_ESENTI.previdenzaComplementare,
  );

  // Assistenza sanitaria (esente fino al limite)
  const sanita = Math.min(benefit.assistenzaSanitaria ?? 0, BENEFIT_ESENTI.assistenzaSanitaria);
  const sanitaEccedente = Math.max(
    0,
    (benefit.assistenzaSanitaria ?? 0) - BENEFIT_ESENTI.assistenzaSanitaria,
  );

  // Buoni pasto
  const buoniPastoTotale = benefit.buoniPasto ?? 0;
  const sogliaGiornaliera = benefit.buoniPastoElettronici
    ? annoFiscale >= 2026
      ? BENEFIT_ESENTI.buoniPastoElettronici2026
      : BENEFIT_ESENTI.buoniPastoElettronici2025
    : BENEFIT_ESENTI.buoniPastoCartacei;

  // Stima giorni lavorativi (220 giorni medi)
  const giorniLavorativi = 220;
  const sogliaAnnuaBuoniPasto = sogliaGiornaliera * giorniLavorativi;
  const buoniPastoEsenti = Math.min(buoniPastoTotale, sogliaAnnuaBuoniPasto);
  const buoniPastoTassati = Math.max(0, buoniPastoTotale - sogliaAnnuaBuoniPasto);

  // Altri welfare (abbonamento trasporto, servizi welfare - 100% esenti)
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

/**
 * Calcola i contributi INPS a carico del lavoratore
 */
function calcolaContributiInps(
  ral: number,
  tipoContratto: TipoContratto,
  aziendaConCigs: boolean,
  iscrittoPost1996: boolean,
): DettaglioContributiInps {
  // Determina l'aliquota base
  let aliquotaBase: number;
  if (tipoContratto === 'apprendistato') {
    aliquotaBase = ALIQUOTE_INPS.apprendista;
  } else if (aziendaConCigs) {
    aliquotaBase = ALIQUOTE_INPS.conCigs;
  } else {
    aliquotaBase = ALIQUOTE_INPS.baseWorker;
  }

  // Applica il massimale se iscritto post 1996
  const imponibilePrevidenziale = iscrittoPost1996 ? Math.min(ral, ALIQUOTE_INPS.massimale) : ral;

  // Calcola contributi base
  const contributiBase = imponibilePrevidenziale * aliquotaBase;

  // Calcola contributo aggiuntivo 1% sulla parte eccedente la prima fascia
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

/**
 * Calcola l'IRPEF lorda per scaglioni
 */
function calcolaIrpefLorda(imponibile: number, annoFiscale: AnnoFiscale): DettaglioIrpef {
  const scaglioni = annoFiscale === 2025 ? IRPEF_SCAGLIONI_2025 : IRPEF_SCAGLIONI_2026;

  let impostaTotale = 0;
  let imponibileResiduo = imponibile;
  let limiteInferiore = 0;
  const dettaglioScaglioni: DettaglioIrpef['dettaglioScaglioni'] = [];

  for (let i = 0; i < scaglioni.length && imponibileResiduo > 0; i++) {
    const scaglione = scaglioni[i];
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

/**
 * Calcola le detrazioni per lavoro dipendente
 */
function calcolaDetrazioniLavoroDipendente(
  redditoComplessivo: number,
  giorniLavorati: number,
  tipoContratto: TipoContratto,
): DettaglioDetrazioniLavoro {
  const params = DETRAZIONI_LAVORO_DIPENDENTE;
  let detrazioneTeorica = 0;

  if (redditoComplessivo <= 15_000) {
    // Fascia 1: importo fisso €1.955
    detrazioneTeorica = params.importoFissoBase;

    // Applica minimo garantito
    const minimo =
      tipoContratto === 'determinato' ? params.minimoDeterminato : params.minimoIndeterminato;
    detrazioneTeorica = Math.max(detrazioneTeorica, minimo);
  } else if (redditoComplessivo <= 28_000) {
    // Fascia 2: €1.910 + €1.190 × [(28.000 - RC) / 13.000]
    const coefficiente = (28_000 - redditoComplessivo) / 13_000;
    detrazioneTeorica = params.baseDetrazione + params.coefficienteFascia2 * coefficiente;
  } else if (redditoComplessivo <= 50_000) {
    // Fascia 3: €1.910 × [(50.000 - RC) / 22.000]
    const coefficiente = (50_000 - redditoComplessivo) / 22_000;
    detrazioneTeorica = params.baseDetrazione * coefficiente;
  } else {
    // Oltre €50.000: nessuna detrazione
    detrazioneTeorica = 0;
  }

  // Maggiorazione €65 per redditi tra €25.001 e €35.000
  let maggiorazione = 0;
  if (redditoComplessivo > 25_000 && redditoComplessivo <= 35_000) {
    maggiorazione = params.maggiorazioneRedditiMedi;
  }

  // Rapporto ai giorni lavorati
  const coefficienteGiorni = giorniLavorati / 365;
  const detrazioneEffettiva = (detrazioneTeorica + maggiorazione) * coefficienteGiorni;

  return {
    detrazioneTeorica,
    maggiorazione,
    coefficienteGiorni,
    detrazioneEffettiva,
  };
}

/**
 * Calcola la detrazione per coniuge a carico
 */
function calcolaDetrazioneConiuge(redditoComplessivo: number, coniuge?: ConiugeACarico): number {
  if (!coniuge) return 0;

  // Verifica limite reddito coniuge
  if (coniuge.redditoAnnuo > DETRAZIONI_FAMILIARI.limiteRedditoCarico) {
    return 0;
  }

  const percentuale = (coniuge.percentualeCarico ?? 100) / 100;
  const params = DETRAZIONE_CONIUGE;
  let detrazione = 0;

  if (redditoComplessivo <= params.sogliaFascia1) {
    // Fascia 1: €800 - €110 × (RC / 15.000)
    detrazione =
      params.importoBaseFascia1 -
      params.coefficienteRiduzioneFascia1 * (redditoComplessivo / params.sogliaFascia1);
  } else if (redditoComplessivo <= params.sogliaFascia2) {
    // Fascia 2: €690 fissi + eventuali maggiorazioni
    detrazione = params.importoFissoFascia2;

    // Applica maggiorazioni per fasce specifiche
    for (const magg of params.maggiorazioni) {
      if (redditoComplessivo >= magg.min && redditoComplessivo < magg.max) {
        detrazione += magg.importo;
        break;
      }
    }
  } else if (redditoComplessivo <= params.sogliaFascia3) {
    // Fascia 3: €690 × [(80.000 - RC) / 40.000]
    const coefficiente = (params.sogliaFascia3 - redditoComplessivo) / 40_000;
    detrazione = params.importoFissoFascia2 * coefficiente;
  } else {
    // Oltre €80.000: nessuna detrazione
    detrazione = 0;
  }

  return Math.max(0, detrazione * percentuale);
}

/**
 * Calcola la detrazione per figli a carico
 */
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
    // Verifica età: deve essere tra 21 e 30 anni (o disabile senza limite)
    const haDetrazione =
      figlio.disabile ||
      (figlio.eta >= params.etaMinimaFigli && figlio.eta < params.etaMassimaFigli);

    if (!haDetrazione) continue;

    numeroFigliConDetrazione++;
    const percentuale = (figlio.percentualeCarico ?? 100) / 100;

    // Calcola coefficiente base (aumenta di 15k per ogni figlio oltre il primo)
    const coefficienteBase =
      params.coefficienteBaseFigli + (numeroFigliConDetrazione - 1) * params.incrementoPerFiglio;

    // Formula: €950 × [(coefficiente - RC) / coefficiente]
    if (redditoComplessivo < coefficienteBase) {
      const rapporto = (coefficienteBase - redditoComplessivo) / coefficienteBase;
      detrazioneTotale += params.importoTeoricoFigli * rapporto * percentuale;
    }
  }

  return { detrazione: detrazioneTotale, numeroFigli: numeroFigliConDetrazione };
}

/**
 * Calcola la detrazione per ascendenti a carico
 */
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
    // Deve essere convivente (requisito 2025)
    if (!ascendente.convivente) continue;

    // Verifica limite reddito
    if (ascendente.redditoAnnuo > params.limiteRedditoCarico) continue;

    numeroAscendentiConDetrazione++;

    // Formula: €750 × [(80.000 - RC) / 80.000]
    if (redditoComplessivo < params.coefficienteBaseAltri) {
      const rapporto =
        (params.coefficienteBaseAltri - redditoComplessivo) / params.coefficienteBaseAltri;
      detrazioneTotale += params.importoTeoricoAltri * rapporto;
    }
  }

  return { detrazione: detrazioneTotale, numeroAscendenti: numeroAscendentiConDetrazione };
}

/**
 * Calcola il bonus cuneo fiscale 2025
 */
function calcolaCuneoFiscale(
  redditoComplessivo: number,
  redditoLavoroDipendente: number,
): DettaglioCuneoFiscale {
  const params = CUNEO_FISCALE;

  // Verifica se spetta indennità esente (reddito ≤ 20k)
  if (redditoComplessivo <= params.sogliaIndennita) {
    // Determina la percentuale in base alla fascia
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

  // Verifica se spetta detrazione (reddito 20k-40k)
  if (redditoComplessivo <= params.sogliaDetrazione) {
    let detrazione = 0;

    if (redditoComplessivo <= params.sogliaDecalage) {
      // Fascia 20k-32k: €1.000 fissi
      detrazione = params.detrazioneBase;
    } else {
      // Fascia 32k-40k: decalage
      // €1.000 × [(40.000 - RC) / 8.000]
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

  // Reddito > 40k: non spetta nulla
  return {
    spettaIndennita: false,
    spettaDetrazione: false,
    indennitaEsente: 0,
    detrazioneAggiuntiva: 0,
  };
}

/**
 * Calcola il trattamento integrativo
 */
function calcolaTrattamentoIntegrativo(
  redditoComplessivo: number,
  irpefLorda: number,
  detrazioneLavoroDipendente: number,
  totaleDetrazioni: number,
): DettaglioTrattamentoIntegrativo {
  const params = TRATTAMENTO_INTEGRATIVO;

  // Oltre €28.000: non spetta
  if (redditoComplessivo > params.sogliaParziale) {
    return {
      spetta: false,
      motivoNonSpettanza: 'Reddito superiore a €28.000',
      importo: 0,
      importoPieno: false,
    };
  }

  // Fino a €15.000: spetta se IRPEF lorda > (detrazione lavoro - €75)
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

  // Fascia €15.001 - €28.000: spetta in misura ridotta se detrazioni > IRPEF lorda
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

/**
 * Calcola l'addizionale regionale IRPEF
 */
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

/**
 * Calcola l'addizionale comunale IRPEF
 */
function calcolaAddizionaleComunale(
  imponibile: number,
  comune: string,
): { addizionale: number; aliquota: number; esenzioneApplicata: boolean } {
  const config = ADDIZIONALI_COMUNALI[comune.toUpperCase()] ?? ADDIZIONALI_COMUNALI['DEFAULT'];

  // Verifica esenzione
  if (config.esenzione && imponibile <= config.esenzione) {
    return { addizionale: 0, aliquota: config.aliquota, esenzioneApplicata: true };
  }

  const addizionale = imponibile * config.aliquota;

  return { addizionale, aliquota: config.aliquota, esenzioneApplicata: false };
}

/**
 * Calcola lo stipendio netto completo a partire dal RAL
 *
 * @param input - Oggetto contenente tutti i parametri di input
 * @returns Oggetto con tutti i dettagli del calcolo e gli importi netti
 */
export function calcolaStipendioNetto(input: InputCalcoloStipendio): OutputCalcoloStipendio {
  const {
    ral,
    mensilita,
    giorniLavorati = 365,
    tipoContratto,
    aziendaConCigs = false,
    iscrittoPost1996 = true,
    annoFiscale,
    regione,
    comune,
    coniuge,
    figli,
    ascendenti,
    altriRedditi = 0,
    altreDetrazioni = 0,
    fringeBenefit: fringeBenefitInput,
    haFigliACarico = false,
    neoassuntoFuoriSede2025 = false,
    rimborsiTrasferta: rimborsiTrasfertaInput,
    benefitNonTassati: benefitNonTassatiInput,
  } = input;

  // 1. CALCOLO FRINGE BENEFIT
  const haFigliPerFringeBenefit = haFigliACarico || (figli !== undefined && figli.length > 0);
  const fringeBenefit = calcolaFringeBenefit(
    fringeBenefitInput,
    haFigliPerFringeBenefit,
    neoassuntoFuoriSede2025,
    annoFiscale,
  );

  // 2. CALCOLO RIMBORSI TRASFERTA
  const rimborsiTrasferta = calcolaRimborsiTrasferta(rimborsiTrasfertaInput);

  // 3. CALCOLO BENEFIT NON TASSATI
  const benefitNonTassati = calcolaBenefitNonTassati(benefitNonTassatiInput, annoFiscale);

  // 4. CALCOLO IMPONIBILE PREVIDENZIALE
  // L'imponibile previdenziale include RAL + fringe benefit imponibili + rimborsi tassati + benefit eccedenti
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
  // Il reddito da lavoro dipendente è imponibile previdenziale - contributi INPS
  const redditoLavoroDipendente = imponibilePrevidenziale - contributiInps.totaleContributi;

  // Il reddito complessivo include anche altri redditi
  const redditoComplessivo = redditoLavoroDipendente + altriRedditi;

  // 7. CALCOLO IRPEF LORDA
  const irpef = calcolaIrpefLorda(redditoComplessivo, annoFiscale);

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

  // 11. CALCOLO TOTALE DETRAZIONI (per verifica trattamento integrativo)
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

  // IRPEF netta (prima della detrazione cuneo)
  const irpefNetta = Math.max(
    0,
    irpef.irpefLorda -
      detrazioniLavoro.detrazioneEffettiva -
      detrazioniFamiliari.totaleDetrazioniFamiliari -
      altreDetrazioni,
  );

  // IRPEF finale (dopo detrazione cuneo fiscale)
  // La detrazione cuneo opera fino a concorrenza dell'imposta
  const irpefFinale = Math.max(0, irpefNetta - cuneoFiscale.detrazioneAggiuntiva);

  // Totale trattenute
  const totaleTrattenute =
    contributiInps.totaleContributi + irpefFinale + addizionali.totaleAddizionali;

  // Totale bonus (indennità cuneo + trattamento integrativo)
  const totaleBonus = cuneoFiscale.indennitaEsente + trattamentoIntegrativo.importo;

  // Stipendio netto annuo (da RAL + fringe imponibili + rimborsi tassati)
  const baseImponibile =
    ral +
    fringeBenefit.valoreImponibile +
    rimborsiTrasferta.rimborsiTassati +
    benefitNonTassati.totaleTassato;
  const nettoAnnuo = baseImponibile - totaleTrattenute + totaleBonus;

  // Stipendio netto mensile
  const nettoMensile = nettoAnnuo / mensilita;

  // Aliquota effettiva (calcolata solo su RAL per confronto)
  const aliquotaEffettiva = (totaleTrattenute - totaleBonus) / ral;

  // Totale percepito = netto + fringe esenti + rimborsi esenti + benefit esenti
  const totalePercepito =
    nettoAnnuo +
    fringeBenefit.valoreEsente +
    rimborsiTrasferta.totaleEsente +
    benefitNonTassati.totaleEsente;

  return {
    ral,
    annoFiscale,
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

/**
 * Formatta un numero come valuta EUR
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
  }).format(value);
}

/**
 * Formatta un numero come percentuale
 */
export function formatPercent(value: number, decimals: number = 2): string {
  return new Intl.NumberFormat('it-IT', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}
