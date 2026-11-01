import type {
  DettaglioFondoContrattuale,
  DettaglioFondoPensioneIntegrativo,
  FondoContrattualeId,
  InputCalcoloStipendio,
  OutputCalcoloStipendio,
  VoceEntrata,
  VoceTrattenuta,
} from '../types';

/** Fondo previsto dal CCNL, con contributi annui fissi */
export interface FondoContrattuale {
  /** Coincide con il flag di input che seleziona il fondo */
  id: FondoContrattualeId;
  nome: string;
  /** Lavoratori a cui si applica. Un fondo dirigenti porta alle aliquote INPS datore dirigenti */
  categoria: 'dirigentiTerziario' | 'dipendentiCommercio';
  /** Cosa copre il fondo */
  descrizione: string;
  /** Contributo annuo a carico del lavoratore */
  contributoLavoratore: number;
  /** Come si ottiene il contributo lavoratore */
  calcoloContributo?: string;
  /** Contributo annuo a carico del datore */
  contributoDatore: number;
  /**
   * Il contributo lavoratore si deduce dall'imponibile IRPEF senza limite e riduce il plafond
   * della previdenza complementare (fondo in squilibrio, art. 20, c. 7, D.Lgs. 252/2005).
   * Un fondo non deducibile è una trattenuta diretta dal netto.
   */
  deducibile: boolean;
}

/** Fondi contrattuali 2026 */
export const FONDI_CONTRATTUALI: readonly FondoContrattuale[] = [
  {
    id: 'fondoMarioNegri',
    nome: 'Fondo Mario Negri',
    categoria: 'dirigentiTerziario',
    descrizione: 'Previdenza complementare obbligatoria.',
    contributoLavoratore: 1_184.49,
    calcoloContributo: '2% di 59.224,54 euro',
    // Ordinario 12,86% + integrativo 2,52% della retribuzione convenzionale
    contributoDatore: 0.1538 * 59_224.54,
    deducibile: true,
  },
  {
    id: 'fondoPastore',
    nome: 'Fondo Antonio Pastore',
    categoria: 'dirigentiTerziario',
    descrizione: 'Fondo assicurativo-previdenziale integrativo obbligatorio.',
    contributoLavoratore: 464.81,
    contributoDatore: 4_856.45,
    deducibile: false,
  },
  {
    id: 'cfmt',
    nome: 'CFMT',
    categoria: 'dirigentiTerziario',
    descrizione: 'Contributo per formazione e aggiornamento professionale.',
    contributoLavoratore: 166,
    calcoloContributo: '148 formazione + 18 piattaforma welfare',
    // €258 formazione + €18 piattaforma welfare
    contributoDatore: 276,
    deducibile: false,
  },
  {
    id: 'fasdac',
    nome: 'FASDAC',
    categoria: 'dirigentiTerziario',
    descrizione: 'Assistenza sanitaria integrativa (Fondo Mario Besusso).',
    contributoLavoratore: 859.08,
    calcoloContributo: '1,87% di 45.940 euro',
    // Dirigenti in servizio 5,29% + gestione pensionati 2,78% della retribuzione convenzionale
    contributoDatore: 0.0807 * 45_940,
    deducibile: false,
  },
  {
    id: 'fondoEst',
    nome: 'Fondo EST',
    categoria: 'dipendentiCommercio',
    descrizione: 'Assistenza sanitaria integrativa per dipendenti CCNL Commercio.',
    contributoLavoratore: 24,
    calcoloContributo: '2 euro/mese',
    // €13/mese
    contributoDatore: 156,
    deducibile: false,
  },
];

/** Limite annuo di deducibilità della previdenza complementare (art. 10, c. 1, lett. e-bis, TUIR) */
export const PLAFOND_PREVIDENZA_COMPLEMENTARE = 5_300;

export type InputFondi = Pick<
  InputCalcoloStipendio,
  FondoContrattualeId | 'fondoPensioneIntegrativo'
> & {
  /** Contributo al fondo pensione versato dal datore tramite welfare aziendale (sezione welfare) */
  contributoWelfare: number;
  mensilita: number;
};

/** Effetto dei fondi sul calcolo, prima di conoscere l'aliquota marginale IRPEF */
export interface CalcoloFondi {
  fondiContrattuali: Omit<DettaglioFondoContrattuale, 'risparmioFiscaleStimato'>[];
  fondoPensioneIntegrativo: Omit<
    DettaglioFondoPensioneIntegrativo,
    'risparmoFiscaleStimato'
  > | null;
  /** Contributi datore, EBITEMP e welfare al fondo pensione, reddito di lavoro dipendente (art. 51 TUIR) */
  redditoFondoPensione: number;
  /** Deduzione dall'imponibile IRPEF */
  deduzione: number;
  /** Contributi a carico del datore, accantonati per il lavoratore */
  entrate: VoceEntrata[];
  /** Contributi a carico del lavoratore, trattenuti dal netto */
  trattenute: VoceTrattenuta[];
  isDirigente: boolean;
}

export function calcolaFondi(input: InputFondi): CalcoloFondi {
  const selezionati = FONDI_CONTRATTUALI.filter((fondo) => input[fondo.id]);
  const deduzioneFondiContrattuali = somma(
    selezionati.filter((fondo) => fondo.deducibile).map((fondo) => fondo.contributoLavoratore),
  );
  const previdenza = calcolaPrevidenzaComplementare(input, deduzioneFondiContrattuali);

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

  return {
    fondiContrattuali: selezionati.map((fondo) => ({
      id: fondo.id,
      nome: fondo.nome,
      contributoAnnuo: fondo.contributoLavoratore,
      contributoMensile: fondo.contributoLavoratore / 12,
      contributoDatore: fondo.contributoDatore,
      deducibile: fondo.deducibile,
    })),
    fondoPensioneIntegrativo: previdenza,
    redditoFondoPensione: previdenza
      ? previdenza.contributoDatoreLavoroAnnuo +
        previdenza.contributoEbitempAnnuo +
        previdenza.contributoWelfareAnnuo
      : 0,
    deduzione: deduzioneFondiContrattuali + (previdenza?.deduzioneEffettiva ?? 0),
    entrate,
    trattenute,
    isDirigente: selezionati.some((fondo) => fondo.categoria === 'dirigentiTerziario'),
  };
}

/** Dettagli per l'output, con il risparmio fiscale stimato all'aliquota marginale IRPEF */
export function dettagliFondi(
  fondi: CalcoloFondi,
  aliquotaMarginaleIrpef: number,
): Pick<OutputCalcoloStipendio, 'fondiContrattuali' | 'fondoPensioneIntegrativo'> {
  const previdenza = fondi.fondoPensioneIntegrativo;

  return {
    fondiContrattuali: fondi.fondiContrattuali.map((fondo) => ({
      ...fondo,
      risparmioFiscaleStimato: fondo.deducibile
        ? fondo.contributoAnnuo * aliquotaMarginaleIrpef
        : 0,
    })),
    fondoPensioneIntegrativo: previdenza && {
      ...previdenza,
      risparmoFiscaleStimato: previdenza.deduzioneEffettiva * aliquotaMarginaleIrpef,
    },
  };
}

/**
 * Contributi lavoratore, datore, EBITEMP e welfare condividono il plafond, che i fondi
 * contrattuali deducibili riducono.
 */
function calcolaPrevidenzaComplementare(
  input: InputFondi,
  deduzioneFondiContrattuali: number,
): CalcoloFondi['fondoPensioneIntegrativo'] {
  const fondo = input.fondoPensioneIntegrativo;
  const contributoWelfare = input.contributoWelfare;
  if (!fondo && contributoWelfare <= 0) {
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
    contributoWelfare;

  const plafondResiduo = Math.max(0, PLAFOND_PREVIDENZA_COMPLEMENTARE - deduzioneFondiContrattuali);

  return {
    contributoLavoratoreAnnuo,
    contributoLavoratoreMensile:
      contributoLavoratoreAnnuo / (fondo?.ripartizionePerMensilita ? input.mensilita : 12),
    contributoDatoreLavoroAnnuo,
    contributoEbitempAnnuo,
    contributoWelfareAnnuo: contributoWelfare,
    totaleContributi,
    deduzioneEffettiva: Math.min(totaleContributi, plafondResiduo),
    eccedenzaNonDeducibile: Math.max(0, totaleContributi - plafondResiduo),
  };
}

function somma(importi: number[]): number {
  return importi.reduce((totale, importo) => totale + importo, 0);
}
