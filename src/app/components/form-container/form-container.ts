import { ChangeDetectionStrategy, Component, computed, input, WritableSignal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FormField } from '@angular/forms/signals';
import { NgSelectComponent } from '@ng-select/ng-select';
import {
  createDefaultAscendente,
  createDefaultFiglio,
  createDefaultFondoPersonalizzato,
  StipendioFieldTree,
  StipendioFormModel,
} from './form-group';
import {
  OutputCalcoloStipendio,
  TipoAlimentazioneAuto,
  TipoContratto,
  TipoEsoneroContributivo,
  TrattamentoFiscaleFondo,
} from '../../../calculator/types';
import { Check, Control, Field } from '../field/field';
import { Icon } from '../icon/icon';
import { Section } from '../section/section';
import { Segmented, SegmentedOption } from '../segmented/segmented';
import {
  elencoComuni,
  elencoRegioni,
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
import { HUE } from '../../services/chart-palette';
import { formatCurrency } from '../../utils/intl';

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
  | 'borsa'
  | GruppoFondiId
  | 'fondiPersonalizzati'
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
      borsa: m.borsaDiStudio.enabled,
      ...(Object.fromEntries(
        this.gruppiFondi.map((gruppo) => [gruppo.id, gruppo.fondi.some((fondo) => m[fondo.id])]),
      ) as Record<GruppoFondiId, boolean>),
      fondiPersonalizzati: m.fondiPersonalizzati.length > 0,
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
        r.rimborsiTrasferta.totaleEsente > 0
          ? `+ ${eur(r.rimborsiTrasferta.totaleEsente)} esenti`
          : undefined,
      benefit:
        r.benefitNonTassati.totaleEsente > 0
          ? `+ ${eur(r.benefitNonTassati.totaleEsente)} esenti`
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

  readonly anniApprendistato: SegmentedOption<number>[] = [
    { value: 1, label: '1°' },
    { value: 2, label: '2°' },
    { value: 3, label: 'Dal 3°' },
  ];

  readonly modalitaRimborso: {
    value: 'nessuna' | 'forfettario' | 'misto' | 'analitico';
    label: string;
  }[] = [
    { value: 'nessuna', label: '-- Seleziona --' },
    { value: 'forfettario', label: 'Forfettario' },
    { value: 'misto', label: 'Misto' },
    { value: 'analitico', label: 'Analitico' },
  ];

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
