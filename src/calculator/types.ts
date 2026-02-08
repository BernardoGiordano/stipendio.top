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

/** Dettaglio Fondo Mario Negri (previdenza dirigenti CCNL Terziario) */
export interface DettaglioFondoNegri {
  /** Contributo annuo a carico del dirigente */
  contributoAnnuo: number;
  /** Contributo mensile (contributoAnnuo / 12) */
  contributoMensile: number;
  /** Risparmio fiscale stimato annuo (aliquota marginale x contributo) */
  risparmoFiscaleStimato: number;
}

/** Dettaglio Fondo Antonio Pastore (assicurativo-previdenziale dirigenti CCNL Terziario) */
export interface DettaglioFondoPastore {
  /** Contributo annuo a carico del dirigente */
  contributoAnnuo: number;
  /** Contributo mensile (contributoAnnuo / 12) */
  contributoMensile: number;
}

/** Dettaglio CFMT (Centro di Formazione Management del Terziario) */
export interface DettaglioCFMT {
  /** Contributo annuo a carico del dirigente */
  contributoAnnuo: number;
  /** Contributo mensile (contributoAnnuo / 12) */
  contributoMensile: number;
}

/** Dettaglio FASDAC (Fondo Assistenza Sanitaria Dirigenti Aziende Commerciali - Fondo Mario Besusso) */
export interface DettaglioFasdac {
  /** Contributo annuo a carico del dirigente */
  contributoAnnuo: number;
  /** Contributo mensile (contributoAnnuo / 12) */
  contributoMensile: number;
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

/** Definizione addizionale comunale */
type AddizionaleComunaleBase = { nome: string; pr: string; regione: string; esenzione?: number };
export type AddizionaleComunale = AddizionaleComunaleBase &
  ({ aliquota: number } | { scaglioni: Array<{ limite: number; aliquota: number }> });

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

  /** Fringe benefit tassabili (oltre soglia esenzione) */
  fringeBenefit?: FringeBenefit;

  /** Indica se il lavoratore ha figli a carico (per soglia fringe benefit) */
  haFigliACarico?: boolean;

  /** Rimborsi spese trasferta */
  rimborsiTrasferta?: RimborsiTrasferta;

  /** Benefit non tassati (welfare aziendale) */
  benefitNonTassati?: BenefitNonTassati;

  /** Contributo Fondo Mario Negri (previdenza complementare dirigenti CCNL Terziario) */
  fondoMarioNegri?: boolean;

  /** Contributo Fondo Antonio Pastore (assicurativo-previdenziale dirigenti CCNL Terziario). Non deducibile: trattenuta diretta dal netto */
  fondoPastore?: boolean;

  /** Contributo CFMT (Centro di Formazione Management del Terziario). Non deducibile: trattenuta diretta dal netto */
  cfmt?: boolean;

  /** Contributo FASDAC (Fondo Assistenza Sanitaria Dirigenti - Fondo Mario Besusso). Non deducibile: trattenuta diretta dal netto */
  fasdac?: boolean;

  /** Regime impatriati (rientro cervelli) - D.Lgs. 209/2023, art. 5 */
  regimeImpatriati?: boolean;

  /** Indica se il lavoratore ha almeno un figlio minorenne residente in Italia (esenzione 60% invece di 50%) */
  regimeImpatriatiMinorenni?: boolean;

  /** Previdenza complementare (fondo pensione integrativo) - D.Lgs. 252/2005 */
  fondoPensioneIntegrativo?: FondoPensioneIntegrativo;
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

/** Input previdenza complementare (fondo pensione integrativo) */
export interface FondoPensioneIntegrativo {
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
}

/** Dettaglio previdenza complementare (fondo pensione integrativo) */
export interface DettaglioFondoPensioneIntegrativo {
  /** Contributo annuo a carico del lavoratore */
  contributoLavoratoreAnnuo: number;
  /** Contributo mensile a carico del lavoratore */
  contributoLavoratoreMensile: number;
  /** Contributo annuo a carico del datore di lavoro */
  contributoDatoreLavoroAnnuo: number;
  /** Contributo annuo EBITEMP (ente bilaterale lavoro somministrato) */
  contributoEbitempAnnuo: number;
  /** Totale contributi (lavoratore + datore + EBITEMP) */
  totaleContributi: number;
  /** Deduzione effettiva dall'imponibile IRPEF (max €5.300 dal 2026) */
  deduzioneEffettiva: number;
  /** Eventuale eccedenza non deducibile */
  eccedenzaNonDeducibile: number;
  /** Risparmio fiscale stimato annuo (aliquota marginale x deduzione effettiva) */
  risparmoFiscaleStimato: number;
}

/** Dettaglio costo aziendale del dipendente */
export interface DettaglioCostoAziendale {
  /** RAL (retribuzione annua lorda) */
  ral: number;
  /** Contributi INPS a carico del datore di lavoro */
  contributiInpsDatore: number;
  /** Aliquota INPS applicata al datore */
  aliquotaInpsDatore: number;
  /** TFR annuo (RAL / 13,5) */
  tfr: number;
  /** Contributo Fondo Mario Negri a carico azienda (se dirigente) */
  fondoNegriDatore: number;
  /** Contributo Fondo Antonio Pastore a carico azienda (se dirigente) */
  fondoPastoreDatore: number;
  /** Contributo CFMT a carico azienda (se dirigente) */
  cfmtDatore: number;
  /** Contributo FASDAC a carico azienda (se dirigente) */
  fasdacDatore: number;
  /** Contributo fondo pensione integrativo a carico datore */
  fondoPensioneIntegrativoDatore: number;
  /** Fringe benefit erogati (valore totale lordo) */
  fringeBenefit: number;
  /** Rimborsi spese trasferta erogati */
  rimborsiTrasferta: number;
  /** Benefit non tassati (welfare aziendale) erogati */
  benefitNonTassati: number;
  /** Costo aziendale totale annuo */
  totaleAnnuo: number;
  /** Costo aziendale mensile (totaleAnnuo / 12) */
  totaleMensile: number;
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

  /** Dettaglio Fondo Mario Negri (se dirigente CCNL Terziario) */
  fondoNegri: DettaglioFondoNegri | null;

  /** Dettaglio Fondo Antonio Pastore (se dirigente CCNL Terziario) */
  fondoPastore: DettaglioFondoPastore | null;

  /** Dettaglio CFMT (se dirigente CCNL Terziario) */
  cfmt: DettaglioCFMT | null;

  /** Dettaglio FASDAC (se dirigente CCNL Terziario) */
  fasdac: DettaglioFasdac | null;

  /** Dettaglio previdenza complementare (se attiva) */
  fondoPensioneIntegrativo: DettaglioFondoPensioneIntegrativo | null;

  /** Dettaglio regime impatriati (se applicabile) */
  regimeImpatriati: DettaglioRegimeImpatriati | null;

  /** Dettaglio costo aziendale del dipendente */
  costoAziendale: DettaglioCostoAziendale;

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
  /** Stipendio netto mensile percepito (include benefit non tassati mensili) */
  nettoMensilePercepito: number;
  /** Aliquota effettiva totale (trattenute/RAL) */
  aliquotaEffettiva: number;
  /** Totale percepito (netto + rimborsi esenti + benefit esenti) */
  totalePercepito: number;
}
