import { ChangeDetectionStrategy, Component, computed, input, WritableSignal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FormField } from '@angular/forms/signals';
import { NgSelectComponent } from '@ng-select/ng-select';
import {
  createDefaultAscendente,
  createDefaultFiglio,
  createDefaultFondoPersonalizzato,
  createDefaultTrasferta,
  RimborsiTrasfertaFormModel,
  StipendioFieldTree,
  StipendioFormModel,
} from './form-group';
import {
  DestinazioneTfr,
  DestinazioneTrasferta,
  OutputCalcoloStipendio,
  TipoAlimentazioneAuto,
  TipoContratto,
  TipoEsoneroContributivo,
  TrattamentoFiscaleFondo,
  VittoAlloggioACarico,
} from '../../../calculator/types';
import { Check, Control, Field } from '../field/field';
import { Icon } from '../icon/icon';
import { Section } from '../section/section';
import { Segmented, SegmentedOption } from '../segmented/segmented';
import {
  elencoComuni,
  elencoRegioni,
  haAgevolazioneContribuenteDisabile,
  haRedditiSostitutiviInSoglia,
} from '../../../calculator/addizionali/2026';
import {
  FONDI_CONTRATTUALI,
  FondoContrattuale,
  FondoPensionePresetId,
  GRUPPI_FONDI,
  GruppoFondiId,
  LIMITE_ASSISTENZA_SANITARIA,
  PLAFOND_PREVIDENZA_COMPLEMENTARE,
  PRESET_FONDI_PENSIONE,
} from '../../../calculator/fondi/2026';
import { ESONERI_CONTRIBUTIVI } from '../../../calculator/datore/2026';
import {
  conIndennitaTrasferta,
  limiteIndennitaTrasferta,
  QUOTA_IMPONIBILE_TRASFERTISTA,
  regimeTrasfertista,
} from '../../../calculator/impl/2026';
import { HUE } from '../../services/chart-palette';
import { formatCurrency, formatNumber, formatPercent } from '../../utils/intl';

const ALTRO_OPTION = { value: 'DEFAULT', label: 'Non specificato' } as const;

/** Rows of the "Situazione e benefit" card */
type Riga =
  | 'altriRedditi'
  | 'previdenza'
  | 'coniuge'
  | 'figli'
  | 'ascendenti'
  | 'fringeBenefit'
  | 'rimborsi'
  | 'benefit'
  | 'affittoNeoassunto'
  | 'premio'
  | 'borsa'
  | GruppoFondiId
  | 'fondiPersonalizzati'
  | 'tfr'
  | 'datore';

/** What each tax treatment does to the worker's contribution, for tooltips and selects */
export const TRATTAMENTI_FONDO: readonly {
  value: TrattamentoFiscaleFondo;
  label: string;
  effetto: string;
}[] = [
  {
    value: 'assistenzaSanitaria',
    label: 'Assistenza sanitaria (esente entro 3.615,20 €)',
    effetto: `Esente da IRPEF entro ${formatCurrency(LIMITE_ASSISTENZA_SANITARIA)} l'anno, limite condiviso tra contributo azienda, contributo lavoratore e assistenza sanitaria welfare. L'eccedenza è imponibile.`,
  },
  {
    value: 'previdenzaComplementare',
    label: 'Previdenza complementare (plafond 5.300 €)',
    effetto: `Contributi di lavoratore e azienda dedotti entro il plafond di ${formatCurrency(PLAFOND_PREVIDENZA_COMPLEMENTARE, 0)} l'anno, condiviso con il fondo pensione. L'eccedenza è imponibile.`,
  },
  {
    value: 'deducibileSenzaLimite',
    label: 'Deducibile senza limite (fondo in squilibrio)',
    effetto:
      "Il contributo lavoratore riduce l'imponibile IRPEF senza limiti e riduce il plafond della previdenza complementare (art. 20, c. 7, D.Lgs. 252/2005).",
  },
  {
    value: 'nonDeducibile',
    label: 'Non deducibile',
    effetto:
      "NON riduce l'imponibile IRPEF: trattenuta diretta dal netto. Il contributo azienda è solo un costo.",
  },
];

function effettoTrattamento(trattamento: TrattamentoFiscaleFondo): string {
  return TRATTAMENTI_FONDO.find((t) => t.value === trattamento)?.effetto ?? '';
}

function vociFondi(gruppo: GruppoFondiId) {
  return FONDI_CONTRATTUALI.filter((fondo) => fondo.gruppo === gruppo).map((fondo) => ({
    id: fondo.id,
    nome: fondo.nome,
    tooltip: tooltipFondo(fondo),
    nota:
      fondo.contributoLavoratore > 0
        ? `${formatCurrency(fondo.contributoLavoratore)} / anno`
        : `azienda ${formatCurrency(fondo.contributoDatore)} / anno`,
  }));
}

function tooltipFondo(fondo: FondoContrattuale): string {
  const calcolo = fondo.calcoloContributo ? ` (${fondo.calcoloContributo})` : '';
  const calcoloDatore = fondo.calcoloContributoDatore ? ` (${fondo.calcoloContributoDatore})` : '';
  const lavoratore =
    fondo.contributoLavoratore > 0
      ? `lavoratore ${formatCurrency(fondo.contributoLavoratore)}/anno${calcolo}, `
      : 'nessuna trattenuta al lavoratore, ';
  const note = fondo.note ? ` ${fondo.note}` : '';
  return `${fondo.descrizione} Contributo 2026: ${lavoratore}azienda ${formatCurrency(fondo.contributoDatore)}/anno${calcoloDatore}. ${effettoTrattamento(fondo.trattamento)}${note}`;
}

@Component({
  selector: 'app-form-container',
  imports: [
    FormField,
    FormsModule,
    NgSelectComponent,
    Field,
    Check,
    Control,
    Icon,
    Section,
    Segmented,
  ],
  templateUrl: './form-container.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormContainer {
  readonly stipendioForm = input.required<StipendioFieldTree>();
  readonly formModel = input.required<WritableSignal<StipendioFormModel>>();
  /** Latest result, for the summaries next to each section */
  readonly result = input<OutputCalcoloStipendio | null>(null);

  readonly regioniDisponibili: { value: string; label: string }[] = elencoRegioni().map((r) => ({
    value: r.codice,
    label: r.nome,
  }));

  private readonly selectedRegione = computed(() => this.formModel()().regione);

  readonly comuniFiltrati = computed(() => [
    ALTRO_OPTION,
    ...elencoComuni(this.selectedRegione()).map((c) => ({ value: c.codice, label: c.nome })),
  ]);

  readonly altriRedditiAttivi = computed(() => {
    const m = this.formModel()();
    return m.altriRedditi > 0 || m.altreDetrazioni > 0 || m.altriRedditiSogliaAddizionale > 0;
  });

  readonly mostraRedditiSostitutivi = computed(() =>
    haRedditiSostitutiviInSoglia(this.selectedRegione()),
  );

  readonly mostraContribuenteDisabile = computed(() =>
    haAgevolazioneContribuenteDisabile(this.selectedRegione()),
  );

  /** One row per CCNL, with its funds */
  readonly gruppiFondi = GRUPPI_FONDI.map((gruppo) => ({ ...gruppo, fondi: vociFondi(gruppo.id) }));

  /** Tax treatments of a custom fund */
  readonly trattamentiFondo = TRATTAMENTI_FONDO;
  readonly infoTrattamenti = [
    'Trattamento fiscale del contributo:',
    ...TRATTAMENTI_FONDO.map((t) => `${t.label}: ${t.effetto}`),
  ].join(' ');

  /** Presets of the pension fund section */
  readonly presetFondiPensione: {
    value: FondoPensionePresetId | 'personalizzato';
    label: string;
  }[] = [
    { value: 'personalizzato', label: 'Personalizzato' },
    ...PRESET_FONDI_PENSIONE.map((preset) => ({
      value: preset.id,
      label: `${preset.nome} (${preset.ccnl})`,
    })),
  ];
  readonly infoPresetFondiPensione = [
    'Un preset imposta le percentuali del CCNL e, come base, la RAL inserita: correggila se il contratto usa una base diversa.',
    ...PRESET_FONDI_PENSIONE.map(
      (preset) => `${preset.nome}: ${preset.descrizione} Base: ${preset.base}.`,
    ),
  ].join(' ');

  /** Hint under the reference RAL fields, from the chosen preset */
  readonly basePreset = computed(() => {
    const preset = PRESET_FONDI_PENSIONE.find(
      (p) => p.id === this.formModel()().fondoPensioneIntegrativo.fondo,
    );
    return preset ? `${preset.nome}: ${preset.base}` : undefined;
  });

  readonly tipiContratto: { value: TipoContratto; label: string }[] = [
    { value: 'indeterminato', label: 'Tempo indeterminato' },
    { value: 'determinato', label: 'Tempo determinato' },
    { value: 'apprendistato', label: 'Apprendistato' },
    { value: 'borsaDiStudio', label: 'Borsa di studio (dottorato, specializzazione)' },
  ];

  readonly anniFiscali = ['2026', '2027', '2028', '2029', '2030'];

  readonly mensilita: SegmentedOption<string>[] = ['12', '13', '14', '15'].map((m) => ({
    value: m,
    label: m,
  }));

  readonly quoteCarico: SegmentedOption<number>[] = [
    { value: 50, label: '50%' },
    { value: 100, label: '100%' },
  ];

  /** Which rows of "Situazione e benefit" change the result */
  readonly attive = computed<Record<Riga, boolean>>(() => {
    const m = this.formModel()();
    return {
      altriRedditi: this.altriRedditiAttivi(),
      previdenza: m.fondoPensioneIntegrativo.enabled,
      coniuge: m.coniuge.enabled,
      figli: m.haFigliACarico || m.figli.length > 0,
      ascendenti: m.ascendenti.length > 0,
      fringeBenefit: m.fringeBenefit.enabled,
      rimborsi: m.rimborsiTrasferta.enabled,
      benefit: m.benefitNonTassati.enabled,
      affittoNeoassunto: m.rimborsoAffittoNeoassunto.enabled,
      premio: m.premioRisultato.enabled,
      borsa: m.borsaDiStudio.enabled,
      ...(Object.fromEntries(
        this.gruppiFondi.map((gruppo) => [gruppo.id, gruppo.fondi.some((fondo) => m[fondo.id])]),
      ) as Record<GruppoFondiId, boolean>),
      fondiPersonalizzati: m.fondiPersonalizzati.length > 0,
      tfr: m.tfr.enabled,
      datore: m.opzioniDatore.enabled,
    };
  });

  readonly sezioniAttive = computed(() => Object.values(this.attive()).filter(Boolean).length);

  /** The figure each active row shows on the right, from the latest result */
  readonly riepiloghi = computed<Partial<Record<Riga, string>>>(() => {
    const r = this.result();
    const m = this.formModel()();
    if (!r) return {};
    const eur = (value: number) => formatCurrency(value);
    // The worker's yearly share, or the employer's when the worker pays nothing
    const riepilogoFondi = (ids: string[]) => {
      const fondi = r.fondiContrattuali.filter((fondo) => ids.includes(fondo.id));
      const lavoratore = fondi.reduce((sum, fondo) => sum + fondo.contributoAnnuo, 0);
      const datore = fondi.reduce((sum, fondo) => sum + fondo.contributoDatore, 0);
      return lavoratore > 0 ? `− ${eur(lavoratore)} / anno` : `azienda ${eur(datore)} / anno`;
    };
    const conta = (n: number, uno: string, molti: string) => `${n} ${n === 1 ? uno : molti}`;

    const fp = r.fondoPensioneIntegrativo;
    const fringe = r.fringeBenefit;
    const affitto = r.rimborsoAffittoNeoassunto;
    const famiglia = r.detrazioniFamiliari;
    const datore = r.contributiDatore;
    return {
      altriRedditi: [
        m.altriRedditi > 0 ? `+ ${eur(m.altriRedditi)} redditi` : '',
        m.altreDetrazioni > 0 ? `${eur(m.altreDetrazioni)} detrazioni` : '',
      ]
        .filter(Boolean)
        .join(' · '),
      previdenza: fp ? `− ${eur(fp.contributoLavoratoreAnnuo)} / anno` : undefined,
      coniuge: `detrazione ${eur(famiglia.detrazioneConiuge)}`,
      figli: m.figli.length
        ? `${conta(m.figli.length, 'figlio', 'figli')} · detrazione ${eur(famiglia.detrazioneFigli)}`
        : undefined,
      ascendenti: m.ascendenti.length
        ? `${conta(m.ascendenti.length, 'ascendente', 'ascendenti')} · detrazione ${eur(famiglia.detrazioneAscendenti)}`
        : undefined,
      fringeBenefit:
        fringe.valoreImponibile > 0
          ? `${eur(fringe.valoreImponibile)} imponibili`
          : fringe.valoreEsente > 0
            ? `${eur(fringe.valoreEsente)} esenti`
            : undefined,
      rimborsi:
        [
          r.rimborsiTrasferta.totaleEsente > 0
            ? `+ ${eur(r.rimborsiTrasferta.totaleEsente)} esenti`
            : '',
          r.rimborsiTrasferta.totaleTassato > 0
            ? `${eur(r.rimborsiTrasferta.totaleTassato)} tassati`
            : '',
        ]
          .filter(Boolean)
          .join(' · ') || undefined,
      benefit:
        r.benefitNonTassati.totaleEsente > 0
          ? `+ ${eur(r.benefitNonTassati.totaleEsente)} esenti`
          : undefined,
      affittoNeoassunto: affitto
        ? [
            affitto.importoEsente > 0 ? `+ ${eur(affitto.importoEsente)} esenti` : '',
            affitto.importoImponibile > 0 ? `${eur(affitto.importoImponibile)} imponibili` : '',
          ]
            .filter(Boolean)
            .join(' · ')
        : undefined,
      premio: r.premioRisultato
        ? r.premioRisultato.imponibileSostitutiva > 0
          ? `${eur(r.premioRisultato.imponibileSostitutiva)} al ${formatPercent(r.premioRisultato.aliquotaSostitutiva, 0)}`
          : r.premioRisultato.agevolabile
            ? `+ ${eur(r.premioRisultato.importo)} lordi`
            : 'tassato ordinariamente'
        : undefined,
      borsa: r.borsaDiStudio ? `+ ${eur(r.borsaDiStudio.nettoAnnuo)} netti` : undefined,
      ...(Object.fromEntries(
        this.gruppiFondi.map((gruppo) => [
          gruppo.id,
          riepilogoFondi(gruppo.fondi.map((fondo) => fondo.id)),
        ]),
      ) as Record<GruppoFondiId, string>),
      fondiPersonalizzati: riepilogoFondi(
        r.fondiContrattuali
          .filter((fondo) => fondo.id.startsWith('personalizzato-'))
          .map((fondo) => fondo.id),
      ),
      tfr: r.tfr ? `${eur(r.tfr.nettoAnnuo)} netti / anno` : undefined,
      datore:
        [
          datore.premioInail > 0 ? `INAIL ${eur(datore.premioInail)}` : '',
          datore.esonero > 0 ? `esonero − ${eur(datore.esonero)}` : '',
        ]
          .filter(Boolean)
          .join(' · ') || `costo ${eur(r.costoAziendale)}`,
    };
  });

  /** Share of the deduction ceiling the pension fund uses */
  readonly deducibile = computed(() => {
    const fp = this.result()?.fondoPensioneIntegrativo;
    if (!fp) return null;
    return {
      usato: formatCurrency(fp.deduzioneEffettiva, 0),
      plafond: formatCurrency(PLAFOND_PREVIDENZA_COMPLEMENTARE, 0),
      quota: Math.min(1, fp.deduzioneEffettiva / PLAFOND_PREVIDENZA_COMPLEMENTARE),
    };
  });

  readonly violaBar = HUE.viola.bar;

  readonly removeButton =
    'ml-auto flex size-[34px] shrink-0 cursor-pointer items-center justify-center rounded-lg text-muted transition-colors hover:bg-sunken hover:text-neg focus-visible:outline-2 focus-visible:outline-focus';
  readonly addButton =
    'mt-2 inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full bg-field px-3 text-[13px] font-medium text-fg shadow-xs ring-1 ring-ring-strong transition-colors hover:bg-sunken focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus';

  readonly esoneri: { value: TipoEsoneroContributivo | 'nessuno'; label: string }[] = [
    { value: 'nessuno', label: 'Nessuno' },
    ...ESONERI_CONTRIBUTIVI.map((esonero) => ({
      value: esonero.id,
      label: `${esonero.nome} (fino a ${formatCurrency(esonero.tettoMensile, 0)} / mese)`,
    })),
    { value: 'personalizzato', label: 'Personalizzato' },
  ];

  /** Tooltip of the exemption select, listing what each preset covers */
  readonly infoEsoneri = [
    'Esonero dai contributi INPS a carico del datore per alcune assunzioni, per un massimo di 24 mesi. Non riduce il premio INAIL, il contributo addizionale NASpI e il contributo di solidarietà.',
    ...ESONERI_CONTRIBUTIVI.map((esonero) => `${esonero.nome}: ${esonero.descrizione}`),
    'Verifica i requisiti e le finestre di assunzione con le circolari INPS: per esoneri diversi, proroghe o quote ridotte usa Personalizzato.',
  ].join(' ');

  readonly destinazioniTfr: SegmentedOption<DestinazioneTfr>[] = [
    { value: 'azienda', label: 'Azienda' },
    { value: 'fondoPensione', label: 'Fondo pensione' },
  ];

  readonly anniApprendistato: SegmentedOption<number>[] = [
    { value: 1, label: '1°' },
    { value: 2, label: '2°' },
    { value: 3, label: 'Dal 3°' },
  ];

  readonly modalitaRimborso: {
    value: RimborsiTrasfertaFormModel['modalitaRimborso'];
    label: string;
  }[] = [
    { value: 'nessuna', label: '-- Seleziona --' },
    { value: 'forfettario', label: 'Forfettario (solo indennità)' },
    { value: 'misto', label: 'Misto (indennità con vitto o alloggio)' },
    { value: 'analitico', label: 'Analitico (solo rimborsi)' },
    { value: 'trasfertista', label: 'Trasfertista (indennità fissa)' },
  ];

  readonly destinazioni: { value: DestinazioneTrasferta; label: string }[] = [
    { value: 'italia', label: 'Italia' },
    { value: 'estero', label: 'Estero' },
  ];

  readonly vittoAlloggio: { value: VittoAlloggioACarico; label: string }[] = [
    { value: 'nessuno', label: 'Nessuno' },
    { value: 'uno', label: 'Uno dei due (−1/3)' },
    { value: 'entrambi', label: 'Entrambi (−2/3)' },
  ];

  /** Two aligned lines in the form column, one line where the four fields fit */
  readonly grigliaMisto =
    'grid grid-cols-2 gap-x-2.5 gap-y-2 @min-[36rem]:grid-cols-[6rem_4rem_1fr_1fr]';
  /** The allowance takes its own line where the three fields don't fit */
  readonly grigliaForfettario =
    'grid grid-cols-2 gap-x-2.5 gap-y-2 @min-[24rem]:grid-cols-[1fr_4rem_1.2fr]';
  readonly indennitaForfettario = 'col-span-2 @min-[24rem]:col-span-1';
  /** Allowance and meals take a line each where two columns would cut their text */
  readonly campoMisto = 'col-span-2 @min-[20rem]:col-span-1';

  /** Per trip row: the exempt daily ceiling and the texts of the allowance field */
  readonly righeTrasferta = computed(() => {
    const rimborsi = this.formModel()().rimborsiTrasferta;
    return rimborsi.trasferte.map((trasferta) => {
      const limite = limiteIndennitaTrasferta(trasferta, rimborsi.modalitaRimborso);
      const eccedente = trasferta.indennitaGiornaliera - limite;
      return {
        limite: formatNumber(limite, 2),
        info: `Importo giornaliero erogato. Se lo lasci vuoto vale il limite esente di ${formatCurrency(limite)}. La parte oltre il limite si somma all'imponibile: paga INPS, IRPEF e addizionali.`,
        tassata:
          eccedente > 0
            ? `${formatCurrency(limite)} esenti, ${formatCurrency(eccedente)} tassati`
            : undefined,
      };
    });
  });

  /** Whether the reimbursement method pays a daily allowance */
  readonly conIndennita = computed(() =>
    conIndennitaTrasferta(this.formModel()().rimborsiTrasferta.modalitaRimborso),
  );

  /** Whether the trasfertista regime replaces daily allowances and exemptions */
  readonly trasfertista = computed(() =>
    regimeTrasfertista(this.formModel()().rimborsiTrasferta.modalitaRimborso),
  );

  /** Taxable share of the trasfertista allowance, for the tooltips */
  readonly quotaTrasfertista = formatPercent(QUOTA_IMPONIBILE_TRASFERTISTA, 0);

  /** Reimbursements that the selected method taxes in full or doesn't expect */
  readonly avvisoRimborsi = computed(() => {
    const rimborsi = this.formModel()().rimborsiTrasferta;
    if (
      this.trasfertista() &&
      (rimborsi.rimborsoVitto > 0 ||
        rimborsi.rimborsoAlloggio > 0 ||
        rimborsi.rimborsoViaggio > 0 ||
        rimborsi.rimborsoKm > 0)
    ) {
      return "Per i trasfertisti i rimborsi spese non sono esenti: si sommano per intero all'imponibile e pagano INPS, IRPEF e addizionali.";
    }
    if (!(rimborsi.rimborsoVitto > 0 || rimborsi.rimborsoAlloggio > 0)) return null;
    const trasferte = rimborsi.trasferte.filter((trasferta) => trasferta.giorni > 0);
    if (rimborsi.modalitaRimborso === 'forfettario') {
      return trasferte.length > 0
        ? 'Con vitto o alloggio rimborsati il sistema è misto: seleziona «Misto». Nel forfettario questi rimborsi sono tassati.'
        : 'Senza giorni di indennità il sistema è analitico: seleziona «Analitico». Nel forfettario questi rimborsi sono tassati.';
    }
    if (
      rimborsi.modalitaRimborso === 'misto' &&
      trasferte.length > 0 &&
      trasferte.every((trasferta) => trasferta.vittoAlloggioACarico === 'nessuno')
    ) {
      return 'Con vitto o alloggio rimborsati il limite esente si riduce: indica i giorni interessati in «Vitto e alloggio».';
    }
    return null;
  });

  readonly tipiAlimentazione: { value: TipoAlimentazioneAuto; label: string }[] = [
    { value: 'elettrico', label: 'Elettrico' },
    { value: 'ibrido_plugin', label: 'Ibrido plug-in' },
    { value: 'altro', label: 'Altro (benzina, diesel, GPL, metano)' },
  ];

  onRegioneChange(): void {
    this.formModel().update((m) => ({ ...m, comune: 'DEFAULT' }));
  }

  onComuneChange(value: string): void {
    this.formModel().update((m) => ({ ...m, comune: value }));
  }

  addFiglio(): void {
    this.formModel().update((model) => ({
      ...model,
      figli: [...model.figli, createDefaultFiglio()],
    }));
  }

  removeFiglio(index: number): void {
    this.formModel().update((model) => ({
      ...model,
      figli: model.figli.filter((_, i) => i !== index),
    }));
  }

  addTrasferta(): void {
    this.formModel().update((model) => ({
      ...model,
      rimborsiTrasferta: {
        ...model.rimborsiTrasferta,
        trasferte: [...model.rimborsiTrasferta.trasferte, createDefaultTrasferta()],
      },
    }));
  }

  removeTrasferta(index: number): void {
    this.formModel().update((model) => ({
      ...model,
      rimborsiTrasferta: {
        ...model.rimborsiTrasferta,
        trasferte: model.rimborsiTrasferta.trasferte.filter((_, i) => i !== index),
      },
    }));
  }

  addAscendente(): void {
    this.formModel().update((model) => ({
      ...model,
      ascendenti: [...model.ascendenti, createDefaultAscendente()],
    }));
  }

  removeAscendente(index: number): void {
    this.formModel().update((model) => ({
      ...model,
      ascendenti: model.ascendenti.filter((_, i) => i !== index),
    }));
  }

  addFondoPersonalizzato(): void {
    this.formModel().update((model) => ({
      ...model,
      fondiPersonalizzati: [...model.fondiPersonalizzati, createDefaultFondoPersonalizzato()],
    }));
  }

  removeFondoPersonalizzato(index: number): void {
    this.formModel().update((model) => ({
      ...model,
      fondiPersonalizzati: model.fondiPersonalizzati.filter((_, i) => i !== index),
    }));
  }

  /** Fills the pension fund percentages from the CCNL preset, with the RAL as reference base */
  onPresetFondoPensioneChange(value: string): void {
    const preset = PRESET_FONDI_PENSIONE.find((p) => p.id === value);
    this.formModel().update((model) => {
      const base = Math.min(model.ral || 0, preset?.massimaleBase ?? Infinity);
      return {
        ...model,
        fondoPensioneIntegrativo: {
          ...model.fondoPensioneIntegrativo,
          fondo: preset?.id ?? 'personalizzato',
          ...(preset && {
            contributoLavoratore: preset.contributoLavoratore,
            ralLavoratore: base,
            contributoDatoreLavoro: preset.contributoDatore,
            ralDatoreLavoro: base,
          }),
        },
      };
    });
  }
}
