import type {
  DettaglioAssistenzaSanitaria,
  DettaglioFondoContrattuale,
  DettaglioFondoPensioneIntegrativo,
  FondoContrattualeId,
  FondoPersonalizzato,
  InputCalcoloStipendio,
  OutputCalcoloStipendio,
  TrattamentoFiscaleFondo,
  VoceEntrata,
  VoceTrattenuta,
} from '../types';

/** Gruppi della form: un CCNL per riga */
export type GruppoFondiId =
  | 'commercio'
  | 'dirigentiTerziario'
  | 'metalmeccanici'
  | 'dirigentiIndustria';

export interface GruppoFondi {
  id: GruppoFondiId;
  heading: string;
  description: string;
}

export const GRUPPI_FONDI: readonly GruppoFondi[] = [
  {
    id: 'commercio',
    heading: 'Dipendenti CCNL Commercio e Turismo',
    description:
      'Fondi per i dipendenti non dirigenti di commercio, terziario, servizi e turismo. Quas e Quadrifor riguardano i soli quadri.',
  },
  {
    id: 'dirigentiTerziario',
    heading: 'Dirigenti CCNL Terziario',
    description:
      'Trattenute obbligatorie per i dirigenti del settore terziario (commercio, distribuzione, servizi).',
  },
  {
    id: 'metalmeccanici',
    heading: 'Metalmeccanici',
    description:
      'Fondi del CCNL Metalmeccanici industria (Federmeccanica-Assistal). Per Cometa imposta il preset nella sezione Previdenza complementare.',
  },
  {
    id: 'dirigentiIndustria',
    heading: 'Dirigenti CCNL Industria',
    description:
      'Fondi del CCNL Dirigenti aziende industriali (Confindustria-Federmanager). Per Previndai imposta il preset nella sezione Previdenza complementare.',
  },
];

/** Fondo previsto dal CCNL, con contributi annui fissi */
export interface FondoContrattuale {
  /** Coincide con il flag di input che seleziona il fondo */
  id: FondoContrattualeId;
  nome: string;
  gruppo: GruppoFondiId;
  /** Fondo per dirigenti: porta alle aliquote INPS datore dei dirigenti */
  dirigente: boolean;
  /** Cosa copre il fondo */
  descrizione: string;
  /** Contributo annuo a carico del lavoratore */
  contributoLavoratore: number;
  /** Come si ottiene il contributo lavoratore */
  calcoloContributo?: string;
  /** Contributo annuo a carico del datore */
  contributoDatore: number;
  /** Come si ottiene il contributo datore */
  calcoloContributoDatore?: string;
  /**
   * Parte del contributo datore che finanzia prestazioni per altri (dirigenti pensionati o
   * disoccupati, garanzia LTC) e non concorre al limite di esenzione del lavoratore
   * (Ris. AE 78/E/2004). Resta un costo per l'azienda, soggetto al contributo di solidarietà.
   */
  contributoDatoreSolidale?: number;
  trattamento: TrattamentoFiscaleFondo;
  /** Precisazioni sul contributo, mostrate nel tooltip */
  note?: string;
}

/** Retribuzione convenzionale Fondo Mario Negri 2026 */
const CONVENZIONALE_NEGRI = 59_224.54;
/** Retribuzione convenzionale FASDAC 2026 */
const CONVENZIONALE_FASDAC = 45_940;
/** Premio annuo Long Term Care compreso nel contributo azienda FASDAC */
const PREMIO_LTC_FASDAC = 206.6;
/** Contributo azienda FASI per il dirigente in servizio */
const CONTRIBUTO_AZIENDA_FASI = 2_180;
/**
 * Contributo azienda FASI per l'assistenza ai dirigenti pensionati (art. G del Regolamento),
 * dovuto per ogni dirigente in forza. Importo della circolare FASI 2023.
 */
const QUOTA_PENSIONATI_FASI = 1_600;

/** Fondi contrattuali 2026 */
export const FONDI_CONTRATTUALI: readonly FondoContrattuale[] = [
  // CCNL Terziario Confcommercio, dipendenti e quadri; CCNL Turismo
  {
    id: 'fondoEst',
    nome: 'Fondo EST',
    gruppo: 'commercio',
    dirigente: false,
    descrizione: 'Assistenza sanitaria integrativa per i dipendenti del CCNL Commercio.',
    contributoLavoratore: 24,
    calcoloContributo: '2 euro/mese',
    contributoDatore: 156,
    calcoloContributoDatore: '13 euro/mese dal 1° aprile 2025',
    trattamento: 'assistenzaSanitaria',
  },
  {
    id: 'sanimpresa',
    nome: 'Sanimpresa (Lazio)',
    gruppo: 'commercio',
    dirigente: false,
    descrizione:
      'Assistenza sanitaria integrativa territoriale per i dipendenti del CCNL Terziario nel Lazio, in aggiunta al Fondo EST.',
    contributoLavoratore: 0,
    contributoDatore: 168,
    calcoloContributoDatore: '14 euro/mese dal 1° gennaio 2025',
    trattamento: 'assistenzaSanitaria',
  },
  {
    id: 'fondoFast',
    nome: 'Fondo Fast',
    gruppo: 'commercio',
    dirigente: false,
    descrizione:
      'Assistenza sanitaria integrativa per i dipendenti del CCNL Turismo (Federalberghi, Faita).',
    contributoLavoratore: 24,
    calcoloContributo: '2 euro/mese',
    contributoDatore: 120,
    calcoloContributoDatore: '10 euro/mese',
    trattamento: 'assistenzaSanitaria',
  },
  {
    id: 'quas',
    nome: 'Quas',
    gruppo: 'commercio',
    dirigente: false,
    descrizione: 'Cassa di assistenza sanitaria dei quadri del CCNL Terziario (art. 105).',
    contributoLavoratore: 56,
    contributoDatore: 390,
    calcoloContributoDatore: 'dal 1° gennaio 2026 (370 euro nel 2025)',
    trattamento: 'assistenzaSanitaria',
    note: 'Alla prima iscrizione l’azienda versa anche 340 euro una tantum, non calcolati.',
  },
  {
    id: 'quadrifor',
    nome: 'Quadrifor',
    gruppo: 'commercio',
    dirigente: false,
    descrizione: 'Istituto bilaterale per la formazione dei quadri del CCNL Terziario (art. 109).',
    contributoLavoratore: 25,
    contributoDatore: 50,
    trattamento: 'nonDeducibile',
  },
  // CCNL Dirigenti Terziario Confcommercio-Manageritalia, rinnovo 5 novembre 2025
  {
    id: 'fondoMarioNegri',
    nome: 'Fondo Mario Negri',
    gruppo: 'dirigentiTerziario',
    dirigente: true,
    descrizione: 'Previdenza complementare obbligatoria.',
    contributoLavoratore: 1_184.49,
    calcoloContributo: '2% di 59.224,54 euro',
    contributoDatore: 0.1538 * CONVENZIONALE_NEGRI,
    calcoloContributoDatore: '12,86% ordinario + 2,52% integrativo di 59.224,54 euro',
    trattamento: 'deducibileSenzaLimite',
  },
  {
    id: 'fondoPastore',
    nome: 'Fondo Antonio Pastore',
    gruppo: 'dirigentiTerziario',
    dirigente: true,
    descrizione: 'Fondo assicurativo-previdenziale integrativo obbligatorio.',
    contributoLavoratore: 464.81,
    contributoDatore: 4_856.45,
    trattamento: 'nonDeducibile',
  },
  {
    id: 'cfmt',
    nome: 'CFMT',
    gruppo: 'dirigentiTerziario',
    dirigente: true,
    descrizione: 'Contributo per formazione e aggiornamento professionale.',
    contributoLavoratore: 166,
    calcoloContributo: '148 formazione + 18 piattaforma welfare',
    contributoDatore: 276,
    calcoloContributoDatore: '258 formazione + 18 piattaforma welfare',
    trattamento: 'nonDeducibile',
  },
  {
    id: 'fasdac',
    nome: 'FASDAC',
    gruppo: 'dirigentiTerziario',
    dirigente: true,
    descrizione: 'Assistenza sanitaria integrativa (Fondo Mario Besusso).',
    contributoLavoratore: 859.08,
    calcoloContributo: '1,87% di 45.940 euro',
    contributoDatore: 0.0807 * CONVENZIONALE_FASDAC,
    calcoloContributoDatore:
      '5,29% dirigenti in servizio + 2,78% gestione pensionati di 45.940 euro',
    // La gestione pensionati e il premio LTC non concorrono al limite del dirigente
    contributoDatoreSolidale: 0.0278 * CONVENZIONALE_FASDAC + PREMIO_LTC_FASDAC,
    trattamento: 'assistenzaSanitaria',
  },
  // CCNL Metalmeccanici industria Federmeccanica-Assistal
  {
    id: 'metasalute',
    nome: 'mètaSalute',
    gruppo: 'metalmeccanici',
    dirigente: false,
    descrizione: 'Assistenza sanitaria integrativa, piano base a totale carico dell’azienda.',
    contributoLavoratore: 0,
    contributoDatore: 156,
    calcoloContributoDatore: '13 euro/mese',
    trattamento: 'assistenzaSanitaria',
    note: 'I piani integrativi facoltativi a carico del lavoratore non sono in tabella: usa un fondo personalizzato.',
  },
  // CCNL Dirigenti industria Confindustria-Federmanager, circolari FASI 2026
  {
    id: 'fasi',
    nome: 'FASI',
    gruppo: 'dirigentiIndustria',
    dirigente: true,
    descrizione: 'Assistenza sanitaria integrativa dei dirigenti industriali.',
    contributoLavoratore: 1_120,
    calcoloContributo: '280 euro a trimestre',
    contributoDatore: CONTRIBUTO_AZIENDA_FASI + QUOTA_PENSIONATI_FASI,
    calcoloContributoDatore:
      '545 euro a trimestre + 400 euro a trimestre per i dirigenti pensionati',
    // La quota per i pensionati non concorre al limite del dirigente (Ris. AE 78/E/2004)
    contributoDatoreSolidale: QUOTA_PENSIONATI_FASI,
    trattamento: 'assistenzaSanitaria',
    note: 'La quota per i dirigenti pensionati (art. G del Regolamento FASI) usa l’importo della circolare 2023.',
  },
  {
    id: 'gsFasi',
    nome: 'GS-FASI',
    gruppo: 'dirigentiIndustria',
    dirigente: true,
    descrizione:
      'Gestione Separata FASI: copertura sanitaria dei dirigenti involontariamente disoccupati, finanziata dalle aziende per ogni dirigente in servizio.',
    contributoLavoratore: 0,
    contributoDatore: 100,
    // Finanzia prestazioni per altri dirigenti, non per quello in servizio
    contributoDatoreSolidale: 100,
    trattamento: 'assistenzaSanitaria',
  },
];

/** Preset per i fondi pensione negoziali, da applicare alla sezione previdenza complementare */
export type FondoPensionePresetId = 'cometa' | 'fonte' | 'previndai';

export interface PresetFondoPensione {
  id: FondoPensionePresetId;
  nome: string;
  ccnl: string;
  /** Percentuale a carico del lavoratore (es. 1.2 = 1,2%) */
  contributoLavoratore: number;
  /** Percentuale a carico del datore */
  contributoDatore: number;
  /** Retribuzione su cui si calcolano le percentuali */
  base: string;
  /** Massimale annuo della base, se previsto */
  massimaleBase?: number;
  descrizione: string;
}

export const PRESET_FONDI_PENSIONE: readonly PresetFondoPensione[] = [
  {
    id: 'cometa',
    nome: 'Cometa',
    ccnl: 'Metalmeccanici industria',
    contributoLavoratore: 1.2,
    contributoDatore: 2,
    base: 'minimi tabellari del livello (non la RAL)',
    descrizione:
      'Lavoratore almeno 1,2% e azienda 2% dei minimi contrattuali; 2,2% azienda per chi si iscrive entro i 35 anni (dal 1° giugno 2022). Il contributo azienda spetta solo con la quota lavoratore. Il TFR conferito non concorre al plafond.',
  },
  {
    id: 'fonte',
    nome: 'Fon.Te.',
    ccnl: 'Terziario Confcommercio',
    contributoLavoratore: 0.55,
    contributoDatore: 1.55,
    base: 'retribuzione utile al TFR',
    descrizione:
      'Lavoratore almeno 0,55% (di cui 0,05% quota associativa) e azienda 1,55% della retribuzione utile al TFR (art. 107 CCNL), se si conferisce anche il TFR. Per i somministrati EBITEMP aggiunge il 2%.',
  },
  {
    id: 'previndai',
    nome: 'Previndai',
    ccnl: 'Dirigenti industria',
    contributoLavoratore: 2,
    contributoDatore: 6,
    base: 'retribuzione globale lorda effettivamente percepita, fino a 200.000 euro',
    massimaleBase: 200_000,
    descrizione:
      'Dal 1° gennaio 2025 dirigente almeno 2% e azienda 6% (4%, con minimo 4.800 euro l’anno, più 2%) della retribuzione globale lorda fino a 200.000 euro. Il contributo azienda spetta solo se il dirigente versa la propria quota. Seleziona FASI per le aliquote INPS dei dirigenti.',
  },
];

/** Limite annuo di deducibilità della previdenza complementare (art. 10, c. 1, lett. e-bis, TUIR) */
export const PLAFOND_PREVIDENZA_COMPLEMENTARE = 5_300;

/** Limite annuo di esenzione dei contributi di assistenza sanitaria (art. 51, c. 2, lett. a, TUIR) */
export const LIMITE_ASSISTENZA_SANITARIA = 3_615.2;

/** Nome del fondo pensione integrativo quando non indicato */
export const NOME_FONDO_PENSIONE = 'Fondo pensione';

/** Il contributo datore è soggetto al contributo di solidarietà del 10% */
export function soggettoSolidarieta(trattamento: TrattamentoFiscaleFondo): boolean {
  return trattamento !== 'nonDeducibile';
}

export type InputFondi = Pick<
  InputCalcoloStipendio,
  FondoContrattualeId | 'fondoPensioneIntegrativo' | 'fondiPersonalizzati'
> & {
  /** Contributo al fondo pensione versato dal datore tramite welfare aziendale (sezione welfare) */
  contributoWelfare: number;
  /** Contributi di assistenza sanitaria versati dal datore tramite welfare aziendale */
  assistenzaSanitariaWelfare: number;
  mensilita: number;
};

/** Effetto dei fondi sul calcolo, prima di conoscere il risparmio fiscale delle deduzioni */
export interface CalcoloFondi {
  fondiContrattuali: Omit<DettaglioFondoContrattuale, 'risparmioFiscaleStimato'>[];
  fondoPensioneIntegrativo: Omit<
    DettaglioFondoPensioneIntegrativo,
    'risparmoFiscaleStimato'
  > | null;
  assistenzaSanitaria: DettaglioAssistenzaSanitaria | null;
  /** Contributi datore, EBITEMP, welfare e fondi contrattuali al fondo pensione, reddito di lavoro dipendente (art. 51 TUIR) */
  redditoFondoPensione: number;
  /** Contributi datore di assistenza sanitaria oltre il limite, reddito imponibile IRPEF ma non INPS */
  redditoAssistenzaSanitaria: number;
  /** Assistenza sanitaria welfare entro il limite */
  assistenzaSanitariaWelfareEsente: number;
  /** Deduzione dall'imponibile IRPEF */
  deduzione: number;
  /** Contributi datore soggetti al contributo di solidarietà del 10% */
  baseContributoSolidarieta: number;
  /** Contributi a carico del datore, accantonati per il lavoratore */
  entrate: VoceEntrata[];
  /** Contributi a carico del lavoratore, trattenuti dal netto */
  trattenute: VoceTrattenuta[];
  isDirigente: boolean;
}

/** Un fondo selezionato, di tabella o personalizzato, prima del calcolo */
interface FondoSelezionato {
  id: string;
  nome: string;
  trattamento: TrattamentoFiscaleFondo;
  dirigente: boolean;
  contributoLavoratore: number;
  contributoDatore: number;
  /** Parte del contributo datore fuori dal limite di esenzione sanitaria del lavoratore */
  contributoDatoreSolidale: number;
}

function fondiSelezionati(input: InputFondi): FondoSelezionato[] {
  const tabella = FONDI_CONTRATTUALI.filter((fondo) => input[fondo.id]).map(
    (fondo): FondoSelezionato => ({
      id: fondo.id,
      nome: fondo.nome,
      trattamento: fondo.trattamento,
      dirigente: fondo.dirigente,
      contributoLavoratore: fondo.contributoLavoratore,
      contributoDatore: fondo.contributoDatore,
      contributoDatoreSolidale: fondo.contributoDatoreSolidale ?? 0,
    }),
  );
  const personalizzati = (input.fondiPersonalizzati ?? []).map(
    (fondo: FondoPersonalizzato, indice): FondoSelezionato => ({
      id: `personalizzato-${indice}`,
      nome: fondo.nome?.trim() || `Fondo personalizzato${indice > 0 ? ` ${indice + 1}` : ''}`,
      trattamento: fondo.trattamento,
      dirigente: fondo.dirigente ?? false,
      contributoLavoratore: Math.max(0, fondo.contributoLavoratore || 0),
      contributoDatore: Math.max(0, fondo.contributoDatore || 0),
      contributoDatoreSolidale: 0,
    }),
  );
  return [...tabella, ...personalizzati];
}

export function calcolaFondi(input: InputFondi): CalcoloFondi {
  const selezionati = fondiSelezionati(input);
  const deduzioni = new Map<string, number>();
  const datoreImponibile = new Map<string, number>();

  // Fondi in squilibrio: deduzione integrale, che riduce il plafond della previdenza
  const deduzioneSenzaLimite = somma(
    selezionati
      .filter((fondo) => fondo.trattamento === 'deducibileSenzaLimite')
      .map((fondo) => {
        deduzioni.set(fondo.id, fondo.contributoLavoratore);
        return fondo.contributoLavoratore;
      }),
  );

  // Fondi sanitari e welfare condividono il limite: prima i contributi datore, poi il welfare,
  // infine le quote lavoratore. L'ordine non cambia l'imponibile, solo a chi si attribuisce
  // l'eccedenza
  const sanitari = selezionati.filter((fondo) => fondo.trattamento === 'assistenzaSanitaria');
  const welfare = Math.max(0, input.assistenzaSanitariaWelfare);
  let residuo = LIMITE_ASSISTENZA_SANITARIA;
  let contributiSanitari = welfare;
  for (const fondo of sanitari) {
    const nelLimite = Math.max(0, fondo.contributoDatore - fondo.contributoDatoreSolidale);
    const esente = Math.min(nelLimite, residuo);
    residuo -= esente;
    datoreImponibile.set(fondo.id, nelLimite - esente);
    contributiSanitari += nelLimite + fondo.contributoLavoratore;
  }
  const welfareEsente = Math.min(welfare, residuo);
  residuo -= welfareEsente;
  for (const fondo of sanitari) {
    const deduzione = Math.min(fondo.contributoLavoratore, residuo);
    residuo -= deduzione;
    deduzioni.set(fondo.id, deduzione);
  }
  const assistenzaSanitaria: DettaglioAssistenzaSanitaria | null =
    contributiSanitari > 0
      ? {
          contributi: contributiSanitari,
          esente: LIMITE_ASSISTENZA_SANITARIA - residuo,
          eccedenza: contributiSanitari - (LIMITE_ASSISTENZA_SANITARIA - residuo),
          limite: LIMITE_ASSISTENZA_SANITARIA,
        }
      : null;

  // Fondi di previdenza complementare: nel plafond del fondo pensione, in proporzione
  const previdenziali = selezionati.filter(
    (fondo) => fondo.trattamento === 'previdenzaComplementare',
  );
  const previdenza = calcolaPrevidenzaComplementare(input, deduzioneSenzaLimite, {
    lavoratore: somma(previdenziali.map((fondo) => fondo.contributoLavoratore)),
    datore: somma(previdenziali.map((fondo) => fondo.contributoDatore)),
  });
  const quotaDedotta =
    previdenza && previdenza.totaleContributi > 0
      ? previdenza.deduzioneEffettiva / previdenza.totaleContributi
      : 0;
  for (const fondo of previdenziali) {
    deduzioni.set(fondo.id, fondo.contributoLavoratore * quotaDedotta);
    datoreImponibile.set(fondo.id, fondo.contributoDatore * (1 - quotaDedotta));
  }

  const entrate = selezionati.map(
    (fondo): VoceEntrata => ({
      descrizione: `${fondo.nome} (azienda)`,
      importo: fondo.contributoDatore,
      categoria: 'fondi',
      pagatore: 'datore',
      destinazione: 'accantonata',
    }),
  );
  const trattenute = selezionati.map(
    (fondo): VoceTrattenuta => ({
      descrizione: fondo.nome,
      importo: fondo.contributoLavoratore,
      categoria: 'fondi',
    }),
  );
  if (previdenza) {
    entrate.push(
      {
        descrizione: 'Fondo Pensione (datore)',
        importo: previdenza.contributoDatoreLavoroAnnuo,
        categoria: 'fondi',
        pagatore: 'datore',
        destinazione: 'accantonata',
      },
      {
        descrizione: 'Fondo Pensione (welfare)',
        importo: previdenza.contributoWelfareAnnuo,
        categoria: 'fondi',
        pagatore: 'datore',
        destinazione: 'accantonata',
      },
    );
    trattenute.push({
      descrizione: 'Fondo Pensione (lavoratore)',
      importo: previdenza.contributoLavoratoreAnnuo,
      categoria: 'fondi',
    });
  }

  const deduzioneFondi = somma([...deduzioni.values()]);
  const deduzioneFondiPrevidenziali = somma(
    previdenziali.map((fondo) => deduzioni.get(fondo.id) ?? 0),
  );

  return {
    fondiContrattuali: selezionati.map((fondo) => ({
      id: fondo.id,
      nome: fondo.nome,
      contributoAnnuo: fondo.contributoLavoratore,
      contributoMensile: fondo.contributoLavoratore / 12,
      contributoDatore: fondo.contributoDatore,
      trattamento: fondo.trattamento,
      deduzione: deduzioni.get(fondo.id) ?? 0,
      contributoDatoreImponibile: datoreImponibile.get(fondo.id) ?? 0,
    })),
    fondoPensioneIntegrativo: previdenza,
    assistenzaSanitaria,
    redditoFondoPensione: previdenza
      ? previdenza.contributoDatoreLavoroAnnuo +
        previdenza.contributoEbitempAnnuo +
        previdenza.contributoWelfareAnnuo +
        somma(previdenziali.map((fondo) => fondo.contributoDatore))
      : 0,
    redditoAssistenzaSanitaria:
      somma(sanitari.map((fondo) => datoreImponibile.get(fondo.id) ?? 0)) +
      (welfare - welfareEsente),
    assistenzaSanitariaWelfareEsente: welfareEsente,
    // La deduzione della previdenza comprende già le quote dei fondi previdenziali
    deduzione: deduzioneFondi - deduzioneFondiPrevidenziali + (previdenza?.deduzioneEffettiva ?? 0),
    // I contributi datore a previdenza e sanità integrative, welfare compreso, non il TFR conferito
    baseContributoSolidarieta:
      somma(
        selezionati
          .filter((fondo) => soggettoSolidarieta(fondo.trattamento))
          .map((fondo) => fondo.contributoDatore),
      ) +
      welfare +
      (previdenza ? previdenza.contributoDatoreLavoroAnnuo + previdenza.contributoWelfareAnnuo : 0),
    entrate,
    trattenute,
    isDirigente: selezionati.some((fondo) => fondo.dirigente),
  };
}

/**
 * Dettagli per l'output. Il risparmio fiscale complessivo delle deduzioni (differenza di carico
 * fiscale tra il calcolo senza e con le deduzioni) è ripartito tra i fondi in proporzione alla
 * quota dedotta da ciascuno.
 */
export function dettagliFondi(
  fondi: CalcoloFondi,
  risparmioFiscaleDeduzioni: number,
): Pick<OutputCalcoloStipendio, 'fondiContrattuali' | 'fondoPensioneIntegrativo'> {
  const previdenza = fondi.fondoPensioneIntegrativo;
  const quota = (deduzione: number) =>
    fondi.deduzione > 0 ? (risparmioFiscaleDeduzioni * deduzione) / fondi.deduzione : 0;
  const deduzioneFondiPrevidenziali = somma(
    fondi.fondiContrattuali
      .filter((fondo) => fondo.trattamento === 'previdenzaComplementare')
      .map((fondo) => fondo.deduzione),
  );

  return {
    fondiContrattuali: fondi.fondiContrattuali.map((fondo) => ({
      ...fondo,
      risparmioFiscaleStimato: quota(fondo.deduzione),
    })),
    fondoPensioneIntegrativo: previdenza && {
      ...previdenza,
      risparmoFiscaleStimato: quota(previdenza.deduzioneEffettiva - deduzioneFondiPrevidenziali),
    },
  };
}

/**
 * Contributi lavoratore, datore, EBITEMP, welfare e fondi contrattuali previdenziali
 * condividono il plafond, che i fondi in squilibrio riducono.
 */
function calcolaPrevidenzaComplementare(
  input: InputFondi,
  deduzioneSenzaLimite: number,
  fondiContrattuali: { lavoratore: number; datore: number },
): CalcoloFondi['fondoPensioneIntegrativo'] {
  const fondo = input.fondoPensioneIntegrativo;
  const contributoWelfare = input.contributoWelfare;
  const contributoFondiContrattualiAnnuo = fondiContrattuali.lavoratore + fondiContrattuali.datore;
  if (!fondo && contributoWelfare <= 0 && contributoFondiContrattualiAnnuo <= 0) {
    return null;
  }

  const contributoLavoratoreAnnuo =
    (fondo?.ralLavoratore || 0) * ((fondo?.contributoLavoratore || 0) / 100);
  const contributoDatoreLavoroAnnuo =
    (fondo?.ralDatoreLavoro || 0) * ((fondo?.contributoDatoreLavoro || 0) / 100);
  const contributoEbitempAnnuo = (fondo?.ralEbitemp || 0) * ((fondo?.contributoEbitemp || 0) / 100);
  const totaleContributi =
    contributoLavoratoreAnnuo +
    contributoDatoreLavoroAnnuo +
    contributoEbitempAnnuo +
    contributoWelfare +
    contributoFondiContrattualiAnnuo;

  const plafondResiduo = Math.max(0, PLAFOND_PREVIDENZA_COMPLEMENTARE - deduzioneSenzaLimite);

  return {
    nome: fondo?.nome?.trim() || NOME_FONDO_PENSIONE,
    contributoLavoratoreAnnuo,
    contributoLavoratoreMensile:
      contributoLavoratoreAnnuo / (fondo?.ripartizionePerMensilita ? input.mensilita : 12),
    contributoDatoreLavoroAnnuo,
    contributoEbitempAnnuo,
    contributoWelfareAnnuo: contributoWelfare,
    contributoFondiContrattualiAnnuo,
    totaleContributi,
    deduzioneEffettiva: Math.min(totaleContributi, plafondResiduo),
    eccedenzaNonDeducibile: Math.max(0, totaleContributi - plafondResiduo),
  };
}

function somma(importi: number[]): number {
  return importi.reduce((totale, importo) => totale + importo, 0);
}
