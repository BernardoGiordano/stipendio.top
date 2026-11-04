/** Tipologia di contratto */
export type TipoContratto = 'indeterminato' | 'determinato' | 'apprendistato' | 'borsaDiStudio';

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

/** Quante tra vitto e alloggio sono rimborsate o fornite gratuitamente */
export type VittoAlloggioACarico = 'nessuno' | 'uno' | 'entrambi';

export type DestinazioneTrasferta = 'italia' | 'estero';

/** Giorni di trasferta fuori comune con lo stesso trattamento */
export interface Trasferta {
  destinazione: DestinazioneTrasferta;
  giorni: number;
  /** Indennità giornaliera erogata; se assente, è pari al limite esente */
  indennitaGiornaliera?: number;
  /** Riduce il limite esente di 1/3 o 2/3 (solo sistema misto) */
  vittoAlloggioACarico?: VittoAlloggioACarico;
}

/** Dettaglio rimborsi spese trasferta */
export interface RimborsiTrasferta {
  /** Modalità rimborso trasferte fuori comune */
  modalitaRimborso?: 'forfettario' | 'misto' | 'analitico';
  /** Giorni di trasferta con indennità (forfettario/misto) */
  trasferte?: Trasferta[];
  /** Rimborso vitto documentato (analitico/misto) */
  rimborsoVitto?: number;
  /** Rimborso alloggio documentato (analitico/misto) */
  rimborsoAlloggio?: number;
  /** Rimborso viaggio/trasporto documentato */
  rimborsoViaggio?: number;
  /** Rimborso chilometrico auto propria per trasferte fuori comune, entro le tariffe ACI (esente) */
  rimborsoKm?: number;
  /**
   * Rimborso chilometrico imponibile: spostamenti nel comune sede di lavoro, o quota eccedente
   * le tariffe ACI fuori comune (art. 51, c. 5, TUIR)
   */
  rimborsoKmImponibile?: number;
  /** Indica se i pagamenti sono tracciabili (obbligatorio dal 2025 per vitto/alloggio/taxi) */
  pagamentiTracciabili?: boolean;
}

/**
 * Rimborso affitto per i neoassunti a tempo indeterminato nel 2025 trasferiti per lavoro
 * (art. 1, c. 386-389, L. 207/2024; Circ. AdE 4/E/2025, par. 2.7)
 */
export interface RimborsoAffittoNeoassunto {
  /** Somme erogate o rimborsate dal datore nell'anno per canoni di locazione e spese di manutenzione */
  importo: number;
  /**
   * Requisiti dei commi 386-387 rispettati: assunzione a tempo indeterminato nel 2025, reddito
   * di lavoro dipendente 2024 non superiore a €35.000 e residenza trasferita nel comune di
   * lavoro, distante più di 100 km dal precedente. Senza requisiti l'intero importo è imponibile
   */
  requisiti: boolean;
}

/** Dettaglio benefit non tassati (welfare aziendale) */
export interface BenefitNonTassati {
  /**
   * Contributi al fondo pensione versati dal datore tramite welfare aziendale (es. conversione
   * del credito welfare). Concorrono al plafond di deducibilità, non sono una trattenuta.
   */
  previdenzaComplementare?: number;
  /** Contributi assistenza sanitaria integrativa */
  assistenzaSanitaria?: number;
  /** Valore buoni pasto annuo */
  buoniPasto?: number;
  /** Giorni di erogazione dei buoni pasto, di pari importo giornaliero (default 220) */
  giorniBuoniPasto?: number;
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

/** Fondi contrattuali selezionabili. Ogni id è anche il flag di input che seleziona il fondo */
export type FondoContrattualeId =
  | 'fondoMarioNegri'
  | 'fondoPastore'
  | 'cfmt'
  | 'fasdac'
  | 'fondoEst'
  | 'quas'
  | 'quadrifor'
  | 'sanimpresa'
  | 'fondoFast'
  | 'metasalute'
  | 'fasi'
  | 'gsFasi';

/**
 * Trattamento fiscale dei contributi a un fondo contrattuale.
 * - deducibileSenzaLimite: fondo preesistente in squilibrio finanziario (art. 20, c. 7, D.Lgs.
 *   252/2005): il contributo lavoratore è dedotto per intero e riduce il plafond della
 *   previdenza complementare
 * - previdenzaComplementare: contributi di lavoratore e datore deducibili entro il plafond di
 *   €5.300 condiviso con il fondo pensione (art. 10, c. 1, lett. e-bis, TUIR); il contributo
 *   datore è reddito di lavoro dipendente
 * - assistenzaSanitaria: contributi di lavoratore e datore esenti entro €3.615,20 complessivi,
 *   insieme all'assistenza sanitaria della sezione welfare (art. 51, c. 2, lett. a, TUIR)
 * - nonDeducibile: il contributo lavoratore è trattenuto dal netto senza beneficio fiscale,
 *   quello datore non è reddito (es. enti bilaterali per la formazione)
 */
export type TrattamentoFiscaleFondo =
  | 'deducibileSenzaLimite'
  | 'previdenzaComplementare'
  | 'assistenzaSanitaria'
  | 'nonDeducibile';

/** Fondo contrattuale non in tabella, con contributi annui fissi indicati dall'utente */
export interface FondoPersonalizzato {
  /** Nome mostrato nel dettaglio (default "Fondo personalizzato") */
  nome?: string;
  /** Contributo annuo a carico del lavoratore */
  contributoLavoratore: number;
  /** Contributo annuo a carico del datore */
  contributoDatore: number;
  trattamento: TrattamentoFiscaleFondo;
  /** Fondo per dirigenti: porta alle aliquote INPS datore dei dirigenti */
  dirigente?: boolean;
}

/** Dettaglio di un fondo contrattuale selezionato */
export interface DettaglioFondoContrattuale {
  /** Id del fondo in tabella, o "personalizzato-N" per i fondi personalizzati */
  id: string;
  nome: string;
  /** Contributo annuo a carico del lavoratore */
  contributoAnnuo: number;
  /** Contributo mensile (contributoAnnuo / 12) */
  contributoMensile: number;
  /** Contributo annuo a carico del datore */
  contributoDatore: number;
  trattamento: TrattamentoFiscaleFondo;
  /** Quota del contributo lavoratore esclusa dall'imponibile IRPEF */
  deduzione: number;
  /**
   * Quota del contributo datore che concorre al reddito imponibile IRPEF: l'eccedenza oltre il
   * limite di esenzione sanitaria o oltre il plafond della previdenza complementare
   */
  contributoDatoreImponibile: number;
  /**
   * Risparmio fiscale annuo della quota dedotta: quota della differenza di IRPEF,
   * addizionali e bonus tra il calcolo senza e con le deduzioni
   */
  risparmioFiscaleStimato: number;
}

/**
 * Contributi di assistenza sanitaria a casse e fondi (art. 51, c. 2, lett. a, TUIR): fondi
 * contrattuali sanitari (datore e lavoratore) e assistenza sanitaria welfare condividono lo
 * stesso limite annuo di esenzione
 */
export interface DettaglioAssistenzaSanitaria {
  /** Contributi che concorrono al limite */
  contributi: number;
  /** Quota esente da IRPEF */
  esente: number;
  /** Quota oltre il limite, reddito imponibile IRPEF (non INPS) */
  eccedenza: number;
  /** Limite annuo di esenzione (€3.615,20) */
  limite: number;
}

/** Esoneri contributivi per le nuove assunzioni, con quota e tetto mensile predefiniti */
export type TipoEsoneroContributivo = 'giovani' | 'giovaniZes' | 'donne' | 'zes' | 'personalizzato';

/** Esonero dai contributi INPS a carico del datore, esclusi i premi INAIL */
export interface EsoneroContributivo {
  tipo: TipoEsoneroContributivo;
  /** Quota esonerata dei contributi INPS datore (es. 100 = 100%), solo per 'personalizzato' */
  percentuale?: number;
  /** Tetto mensile dell'esonero (€), solo per 'personalizzato'; 0 o assente = senza tetto */
  tettoMensile?: number;
  /** Mesi di esonero nell'anno (default 12) */
  mesi?: number;
}

/** Dove è destinato il TFR che matura: in azienda (o al Fondo di Tesoreria INPS) o al fondo pensione */
export type DestinazioneTfr = 'azienda' | 'fondoPensione';

/** Stima del TFR netto alla cessazione, fuori dal netto annuo in busta */
export interface OpzioniTfr {
  /** Anni interi di servizio previsti alla cessazione (default 1) */
  anniServizio?: number;
  /**
   * In azienda il TFR si rivaluta ogni anno ed è tassato alla cessazione con la tassazione
   * separata; al fondo pensione la prestazione è tassata al 15%, ridotto fino al 9% (default azienda)
   */
  destinazione?: DestinazioneTfr;
  /** Inflazione FOI annua attesa, in percentuale (es. 2 = 2%), per la rivalutazione (default 2) */
  inflazioneAttesa?: number;
}

/** Voci a carico del datore che spostano il costo aziendale, non il netto */
export interface OpzioniDatore {
  /** Tasso INAIL in per mille (es. 4 = 4‰), applicato all'imponibile previdenziale */
  tassoInail?: number;
  /**
   * Rinnovi del contratto a tempo determinato: ciascuno aumenta di 0,5 punti il contributo
   * addizionale NASpI (art. 3, c. 2, D.L. 87/2018)
   */
  rinnoviTempoDeterminato?: number;
  /** Esonero contributivo per l'assunzione */
  esonero?: EsoneroContributivo;
  /** Apprendistato in azienda fino a 9 dipendenti: aliquota ridotta nei primi due anni */
  apprendistatoFinoA9Dipendenti?: boolean;
  /** Anno del contratto di apprendistato (1, 2, 3 o più; default 3) */
  annoApprendistato?: number;
}

/** Informazioni su un figlio a carico */
export interface FiglioACarico {
  /** Età del figlio */
  eta: number;
  /** Indica se il figlio è disabile */
  disabile: boolean;
  /** Reddito annuo del figlio (per verifica limite a carico) */
  redditoAnnuo?: number;
  /** Percentuale di carico (default 100%, 50% se ripartito) */
  percentualeCarico?: number;
  /** Mesi a carico nell'anno (default 12): le detrazioni IRPEF e regionali sono rapportate a mese */
  mesiCarico?: number;
}

/** Dati del coniuge a carico */
export interface ConiugeACarico {
  /** Reddito annuo del coniuge */
  redditoAnnuo: number;
  /** Percentuale di carico (default 100%) */
  percentualeCarico?: number;
  /** Mesi a carico nell'anno (default 12): la detrazione è rapportata a mese */
  mesiCarico?: number;
}

/** Dati di un ascendente a carico */
export interface AscendenteACarico {
  /** Reddito annuo dell'ascendente */
  redditoAnnuo: number;
  /** Indica se è convivente (requisito obbligatorio dal 2025) */
  convivente: boolean;
  /** Mesi a carico nell'anno (default 12): la detrazione è rapportata a mese */
  mesiCarico?: number;
}

/** Input per il calcolo dello stipendio netto */
export interface InputCalcoloStipendio extends Partial<Record<FondoContrattualeId, boolean>> {
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
  /** Redditi sostitutivi rilevanti per i limiti di reddito delle agevolazioni regionali (Bolzano, Campania, Marche) */
  altriRedditiSogliaAddizionale?: number;
  /** Contribuente con disabilità (art. 3, L. 104/1992): aliquota agevolata dell'addizionale regionale in Veneto */
  contribuenteDisabile?: boolean;

  /** Altre detrazioni spettanti (es. interessi mutuo, spese mediche) */
  altreDetrazioni?: number;

  /** Fringe benefit tassabili (oltre soglia esenzione) */
  fringeBenefit?: FringeBenefit;

  /** Indica se il lavoratore ha figli a carico (per soglia fringe benefit) */
  haFigliACarico?: boolean;

  /** Rimborsi spese trasferta */
  rimborsiTrasferta?: RimborsiTrasferta;

  /** Benefit non tassati (welfare aziendale) */
  benefitNonTassati?: BenefitNonTassati;

  /**
   * Rimborso affitto neoassunti 2025 (art. 1, c. 386-389, L. 207/2024): esente da IRPEF entro
   * €5.000 l'anno per i primi due anni dall'assunzione, fuori dalla soglia fringe benefit
   */
  rimborsoAffittoNeoassunto?: RimborsoAffittoNeoassunto;

  /** Regime impatriati (rientro cervelli) - D.Lgs. 209/2023, art. 5 */
  regimeImpatriati?: boolean;

  /** Indica se il lavoratore ha almeno un figlio minorenne residente in Italia (esenzione 60% invece di 50%) */
  regimeImpatriatiMinorenni?: boolean;

  /** Previdenza complementare (fondo pensione integrativo) - D.Lgs. 252/2005 */
  fondoPensioneIntegrativo?: FondoPensioneIntegrativo;

  /** Fondi contrattuali non in tabella, con contributi annui indicati dall'utente */
  fondiPersonalizzati?: FondoPersonalizzato[];

  /** Borsa di studio post-laurea (tassata dal 7/6/2025) - D.L. 45/2025, convertito in L. 79/2025 */
  borsaDiStudio?: BorsaDiStudio;

  /** Indica se il borsista ha altra copertura pensionistica obbligatoria (riduce GS da 35,03% a 24%).
   *  Rilevante solo quando tipoContratto = 'borsaDiStudio'. */
  altraCoperturaPensionistica?: boolean;

  /** INAIL, rinnovi, esoneri e aliquote agevolate a carico del datore */
  opzioniDatore?: OpzioniDatore;

  /** Anni di servizio, destinazione e inflazione attesa per la stima del TFR netto */
  tfr?: OpzioniTfr;
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

/** Dettaglio dei contributi, premi e accantonamenti a carico del datore */
export interface DettaglioContributiDatore {
  /** Aliquota INPS datore applicata */
  aliquotaInps: number;
  /** Contributi INPS datore prima dell'esonero */
  contributiInpsLordi: number;
  /** Esonero contributivo sottratto ai contributi INPS datore */
  esonero: number;
  /** Aliquota del contributo addizionale NASpI (tempo determinato), 0 se non dovuto */
  aliquotaAddizionaleNaspi: number;
  /** Contributo addizionale NASpI (art. 2, c. 28, L. 92/2012) */
  addizionaleNaspi: number;
  /** Tasso INAIL applicato (es. 0,004 = 4‰), 0 se non indicato o compreso nell'aliquota INPS */
  tassoInail: number;
  /** Premio INAIL */
  premioInail: number;
  /** Contributi datore a previdenza complementare e assistenza sanitaria */
  baseContributoSolidarieta: number;
  /** Contributo di solidarietà 10% (art. 16 D.Lgs. 252/2005, art. 9-bis D.L. 103/1991) */
  contributoSolidarieta: number;
  /** TFR maturato (retribuzione / 13,5) */
  tfrLordo: number;
  /** Contributo aggiuntivo IVS 0,50% recuperato sul TFR (art. 3, c. 15-16, L. 297/1982) */
  riduzioneTfr: number;
}

/**
 * Stima del TFR netto alla cessazione, a RAL costante. Il TFR non entra nel netto annuo: matura
 * come accantonamento del datore ed è tassato a parte alla liquidazione.
 */
export interface DettaglioTfr {
  destinazione: DestinazioneTfr;
  /** Anni interi di servizio alla cessazione */
  anniServizio: number;
  /** Quota accantonata ogni anno (RAL / 13,5 meno lo 0,50% IVS) */
  quotaAnnua: number;
  /** Quote accantonate negli anni di servizio, imponibile della tassazione separata */
  quoteAccantonate: number;
  /** Tasso di rivalutazione annuo (1,5% + 75% dell'inflazione FOI), 0 al fondo pensione */
  tassoRivalutazione: number;
  /** Rivalutazioni lorde maturate (art. 2120 c.c.) */
  rivalutazione: number;
  /** Imposta sostitutiva del 17% sulle rivalutazioni, trattenuta dal fondo */
  impostaSostitutiva: number;
  /** TFR lordo alla cessazione: quote più rivalutazioni, meno l'imposta sostitutiva */
  montanteLordo: number;
  /** Reddito di riferimento (art. 19 TUIR): quote accantonate / anni di servizio × 12 */
  redditoRiferimento: number;
  /** Aliquota media IRPEF sul reddito di riferimento, o aliquota 15%-9% del fondo pensione */
  aliquota: number;
  /** Imposta prima della detrazione (quote accantonate × aliquota) */
  impostaLorda: number;
  /** Detrazione del D.M. 20 marzo 2008, solo in tassazione separata */
  detrazione: number;
  /** Imposta alla cessazione, al netto della detrazione */
  imposta: number;
  /** TFR netto stimato alla cessazione */
  nettoTotale: number;
  /** TFR netto per anno di servizio */
  nettoAnnuo: number;
  /** (Imposta + imposta sostitutiva) / (quote + rivalutazioni) */
  aliquotaEffettiva: number;
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
  /** Trattenuta auto aziendale pagata dal dipendente */
  trattenutaAutoDipendente: number;
  /** Soglia esenzione applicabile */
  sogliaEsenzione: number;
  /** Indica se soglia superata (tutto tassabile) */
  sogliaSuperata: boolean;
  /** Valore imponibile (se soglia superata = totale, altrimenti 0) */
  valoreImponibile: number;
  /** Valore esente */
  valoreEsente: number;
  /** Valore fringe benefit monetari imponibili (esclusa auto, sono soldi ricevuti) */
  valoreMonetarioImponibile: number;
  /** Valore auto aziendale imponibile (non è denaro ricevuto, solo per calcolo tasse) */
  valoreAutoImponibile: number;
}

/** Dettaglio rimborsi trasferta */
export interface DettaglioRimborsiTrasferta {
  /** Totale rimborsi forfettari esenti */
  rimborsoForfettarioEsente: number;
  /** Totale rimborsi documentati esenti */
  rimborsoDocumentatoEsente: number;
  /** Parte dell'indennità di trasferta oltre il limite esente */
  indennitaEccedente: number;
  /** Rimborsi spese tassati: vitto e alloggio non tracciabili o nel forfettario, km imponibili */
  rimborsiSpeseTassati: number;
  /** Totale tassato: indennità eccedente + rimborsi spese tassati */
  rimborsiTassati: number;
  /** Totale rimborsi esenti */
  totaleEsente: number;
  /** Totale rimborsi */
  totaleRimborsi: number;
}

/** Dettaglio benefit non tassati */
export interface DettaglioBenefitNonTassati {
  /** Contributi al fondo pensione versati tramite welfare aziendale (gestiti nel fondo pensione) */
  previdenzaComplementare: number;
  /** Contributi assistenza sanitaria (esenti) */
  assistenzaSanitaria: number;
  /**
   * Contributi assistenza sanitaria oltre il limite condiviso con i fondi sanitari contrattuali:
   * reddito imponibile IRPEF, esclusi dall'imponibile previdenziale (art. 12, c. 4, lett. f,
   * L. 153/1969) e soggetti al contributo di solidarietà
   */
  assistenzaSanitariaTassata: number;
  /** Buoni pasto (esenti) */
  buoniPastoEsenti: number;
  /** Buoni pasto eccedenti (tassati) */
  buoniPastoTassati: number;
  /** Altri welfare (esenti) */
  altriWelfare: number;
  /** Totale benefit esenti */
  totaleEsente: number;
  /** Totale benefit tassati che entrano in busta (eccedenze buoni pasto) */
  totaleTassato: number;
}

/** Dettaglio rimborso affitto neoassunti 2025 */
export interface DettaglioRimborsoAffittoNeoassunto {
  /** Somme erogate o rimborsate nell'anno (per intero nell'imponibile previdenziale) */
  importo: number;
  /** Requisiti dei commi 386-387 rispettati */
  requisiti: boolean;
  /** Limite annuo di non concorrenza al reddito (€5.000), franchigia */
  limiteEsenzione: number;
  /** Quota esente da IRPEF (entro il limite, se i requisiti sono rispettati) */
  importoEsente: number;
  /** Quota imponibile IRPEF: eccedenza oltre il limite, o intero importo senza requisiti */
  importoImponibile: number;
}

/** Input borsa di studio (dottorato/post-laurea, tassata dal 7/6/2025 - D.L. 45/2025, L. 79/2025) */
export interface BorsaDiStudio {
  /** Importo annuo lordo della borsa */
  importoAnnuo: number;
}

/** Input previdenza complementare (fondo pensione integrativo) */
export interface FondoPensioneIntegrativo {
  /** Nome del fondo (es. Cometa, Fon.Te., Previndai), solo per il dettaglio */
  nome?: string;
  /** Percentuale contributo a carico del lavoratore (es. 1.0 = 1%) */
  contributoLavoratore: number;
  /** RAL di riferimento per il contributo lavoratore */
  ralLavoratore?: number;
  /** Percentuale contributo a carico del datore di lavoro (es. 1.5 = 1.5%) */
  contributoDatoreLavoro?: number;
  /** RAL di riferimento per il contributo datore */
  ralDatoreLavoro?: number;
  /** Percentuale contributo EBITEMP (ente bilaterale lavoro somministrato, es. 2.0 = 2%) */
  contributoEbitemp?: number;
  /** RAL di riferimento per il contributo EBITEMP */
  ralEbitemp?: number;
  /** Ripartisci il contributo mensile per il numero di mensilità anziché per 12 */
  ripartizionePerMensilita?: boolean;
}

/** Dettaglio previdenza complementare (fondo pensione integrativo) */
export interface DettaglioFondoPensioneIntegrativo {
  /** Nome del fondo ("Fondo pensione" se non indicato) */
  nome: string;
  /** Contributo annuo a carico del lavoratore */
  contributoLavoratoreAnnuo: number;
  /** Contributo mensile a carico del lavoratore */
  contributoLavoratoreMensile: number;
  /** Contributo annuo a carico del datore di lavoro */
  contributoDatoreLavoroAnnuo: number;
  /** Contributo annuo EBITEMP (ente bilaterale lavoro somministrato) */
  contributoEbitempAnnuo: number;
  /** Contributo annuo versato dal datore tramite welfare aziendale (da sezione welfare) */
  contributoWelfareAnnuo: number;
  /**
   * Contributi annui (lavoratore e datore) dei fondi contrattuali di previdenza complementare,
   * che condividono il plafond
   */
  contributoFondiContrattualiAnnuo: number;
  /** Totale contributi (lavoratore + datore + EBITEMP + welfare + fondi contrattuali) */
  totaleContributi: number;
  /** Deduzione effettiva dall'imponibile IRPEF (max €5.300 dal 2026) */
  deduzioneEffettiva: number;
  /** Eventuale eccedenza non deducibile */
  eccedenzaNonDeducibile: number;
  /**
   * Risparmio fiscale annuo della deduzione effettiva: quota della differenza di IRPEF,
   * addizionali e bonus tra il calcolo senza e con le deduzioni
   */
  risparmoFiscaleStimato: number;
}

/** Dettaglio borsa di studio (dottorato/post-laurea tassata) */
export interface DettaglioBorsaDiStudio {
  /** Importo lordo annuo della borsa */
  importoLordo: number;
  /** Aliquota INPS Gestione Separata totale (35,03% nel 2026) */
  aliquotaGestioneSeparata: number;
  /** Contributo Gestione Separata totale (lordo × aliquota) */
  contributoGestioneSeparataTotale: number;
  /** Contributo Gestione Separata a carico del borsista (1/3 del totale) */
  contributoGestioneSeparataBorsista: number;
  /** Contributo Gestione Separata a carico dell'ente (2/3 del totale) */
  contributoGestioneSeparataEnte: number;
  /** Imponibile IRPEF della borsa (lordo − contributo borsista) */
  imponibileIrpef: number;
  /** Netto annuo della borsa (lordo − contributo borsista − IRPEF e addizionali quota borsa) */
  nettoAnnuo: number;
  /** Netto mensile della borsa (nettoAnnuo / 12) */
  nettoMensile: number;
}

/**
 * Chi paga una voce di entrata.
 * - datore: datore di lavoro, o ente erogatore quando la borsa di studio è il contratto
 * - ente: ente che eroga una borsa di studio in aggiunta al lavoro dipendente
 * - stato: indennità e bonus fiscali pagati in busta
 */
export type PagatoreVoce = 'datore' | 'ente' | 'stato';

/**
 * Dove arriva una voce di entrata.
 * - netto: pagata in denaro, al lordo delle trattenute
 * - esente: percepita a parte, senza trattenute
 * - inNatura: tassata ma non pagata in denaro
 * - accantonata: contributi, fondi e TFR, non percepiti nell'anno
 */
export type DestinazioneVoce = 'netto' | 'esente' | 'inNatura' | 'accantonata';

export type CategoriaEntrata =
  | 'retribuzione'
  | 'contributiDatore'
  | 'inail'
  | 'tfr'
  | 'fondi'
  | 'fringeBenefit'
  | 'rimborsiTrasferta'
  | 'welfare'
  | 'affittoNeoassunto'
  | 'borsaDiStudio'
  | 'bonus';

export type CategoriaTrattenuta =
  | 'contributi'
  | 'irpef'
  | 'addizionali'
  | 'fondi'
  | 'autoAziendale';

/** Importo annuo pagato da qualcuno verso il lavoratore o per suo conto */
export interface VoceEntrata {
  descrizione: string;
  importo: number;
  categoria: CategoriaEntrata;
  pagatore: PagatoreVoce;
  destinazione: DestinazioneVoce;
  /** Aliquota applicata, se l'importo è una percentuale di un imponibile */
  aliquota?: number;
}

/** Importo annuo sottratto alle entrate che arrivano al netto */
export interface VoceTrattenuta {
  descrizione: string;
  importo: number;
  categoria: CategoriaTrattenuta;
}

/**
 * Voci annue non nulle del calcolo. Costo aziendale, trattenute, bonus, netto e percepito sono
 * somme di queste voci.
 */
export interface Ripartizione {
  entrate: VoceEntrata[];
  trattenute: VoceTrattenuta[];
}

/** Dettaglio regime impatriati (rientro cervelli) */
export interface DettaglioRegimeImpatriati {
  /** Percentuale di esenzione applicata (0.50 o 0.60) */
  percentualeEsenzione: number;
  /** Reddito su cui si applica l'agevolazione (max €600.000) */
  redditoAgevolabile: number;
  /** Importo esente da IRPEF */
  importoEsente: number;
  /** Indica se ha figli minorenni (per esenzione 60%) */
  haFigliMinorenni: boolean;
}

/** Voci di una singola busta paga, mensilità ordinaria o aggiuntiva */
export interface BustaPaga {
  /** Lordo della mensilità (RAL / mensilità) */
  lordo: number;
  /** Contributi INPS a carico del lavoratore */
  contributiInps: number;
  /** Contributi ai fondi (fondo pensione, fondi contrattuali) trattenuti nel mese */
  fondi: number;
  /** Imponibile IRPEF della mensilità */
  imponibileIrpef: number;
  /** IRPEF lorda della mensilità */
  irpefLorda: number;
  /** Detrazioni che riducono l'IRPEF lorda del mese */
  detrazioni: number;
  /** IRPEF trattenuta (lorda − detrazioni) */
  irpef: number;
  /** Addizionali regionale e comunale */
  addizionali: number;
  /** Indennità cuneo fiscale e trattamento integrativo */
  bonus: number;
  /** Altre voci tassate pagate in busta (fringe benefit, rimborsi, welfare oltre soglia, borsa) */
  altreEntrate: number;
  /** Altre trattenute (auto aziendale, Gestione Separata borsista) */
  altreTrattenute: number;
  /** Netto della mensilità */
  netto: number;
}

/**
 * Mensilità ordinaria e mensilità aggiuntive (tredicesima, quattordicesima). Ogni voce annua è
 * ripartita: 12 × ordinaria + numeroAggiuntive × aggiuntiva = importo annuo.
 */
export interface DettaglioBustePaga {
  /** Mensilità oltre le dodici ordinarie (0 con 12 mensilità) */
  numeroAggiuntive: number;
  /** Una delle dodici mensilità ordinarie, con detrazioni, bonus e addizionali */
  ordinaria: BustaPaga;
  /**
   * Tredicesima o quattordicesima: stesso lordo e contributi, IRPEF sugli scaglioni mensili
   * senza detrazioni, niente addizionali né bonus. Assente con 12 mensilità.
   */
  aggiuntiva: BustaPaga | null;
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

  /** Dettaglio rimborso affitto neoassunti 2025 (se presente) */
  rimborsoAffittoNeoassunto: DettaglioRimborsoAffittoNeoassunto | null;

  /** Fondi contrattuali selezionati */
  fondiContrattuali: DettaglioFondoContrattuale[];

  /** Dettaglio previdenza complementare (se attiva) */
  fondoPensioneIntegrativo: DettaglioFondoPensioneIntegrativo | null;

  /** Contributi di assistenza sanitaria e limite di esenzione (se presenti) */
  assistenzaSanitaria: DettaglioAssistenzaSanitaria | null;

  /** Dettaglio regime impatriati (se applicabile) */
  regimeImpatriati: DettaglioRegimeImpatriati | null;

  /** Dettaglio borsa di studio (se presente) */
  borsaDiStudio: DettaglioBorsaDiStudio | null;

  /** Voci di entrata e di trattenuta da cui derivano i totali */
  ripartizione: Ripartizione;

  /** Contributi, premi e accantonamenti a carico del datore */
  contributiDatore: DettaglioContributiDatore;

  /** Stima del TFR netto alla cessazione (null per le borse di studio, che non maturano TFR) */
  tfr: DettaglioTfr | null;

  /** Costo aziendale annuo (entrate pagate dal datore) */
  costoAziendale: number;

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
  /** Totale trattenute (contributi, IRPEF finale, addizionali, fondi, trattenuta auto) */
  totaleTrattenute: number;
  /** Totale bonus (indennità cuneo + trattamento integrativo) */
  totaleBonus: number;

  /** Stipendio netto annuo */
  nettoAnnuo: number;
  /**
   * Netto della mensilità ordinaria, quella percepita dodici volte l'anno: con tredicesima e
   * quattordicesima è più alto della media nettoAnnuo / mensilità, perché detrazioni, bonus e
   * addizionali competono alle sole mensilità ordinarie
   */
  nettoMensile: number;
  /** Netto mensile più le entrate esenti ripartite su 12 mesi, fringe benefit esclusi */
  nettoMensilePercepito: number;
  /** Netto di tredicesima o quattordicesima (0 con 12 mensilità) */
  nettoMensilitaAggiuntiva: number;
  /** Mensilità ordinaria e aggiuntiva, voce per voce */
  bustePaga: DettaglioBustePaga;
  /** Aliquota effettiva totale ((trattenute esclusa auto - bonus) / RAL) */
  aliquotaEffettiva: number;
  /** Totale percepito (netto + rimborsi esenti + benefit esenti + affitto neoassunto esente) */
  totalePercepito: number;
}
