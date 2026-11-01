import { ChangeDetectionStrategy, Component, computed, input, WritableSignal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FormField } from '@angular/forms/signals';
import { NgSelectComponent } from '@ng-select/ng-select';
import {
  createDefaultAscendente,
  createDefaultFiglio,
  StipendioFieldTree,
  StipendioFormModel,
} from './form-group';
import {
  OutputCalcoloStipendio,
  TipoAlimentazioneAuto,
  TipoContratto,
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
  PLAFOND_PREVIDENZA_COMPLEMENTARE,
} from '../../../calculator/fondi/2026';
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
  | 'commercio'
  | 'dirigenti';

function vociFondi(categoria: FondoContrattuale['categoria']) {
  return FONDI_CONTRATTUALI.filter((fondo) => fondo.categoria === categoria).map((fondo) => ({
    id: fondo.id,
    nome: fondo.nome,
    tooltip: tooltipFondo(fondo),
    nota: `${formatCurrency(fondo.contributoLavoratore)} / anno`,
  }));
}

function tooltipFondo(fondo: FondoContrattuale): string {
  const calcolo = fondo.calcoloContributo ? ` (${fondo.calcoloContributo})` : '';
  const effetto = fondo.deducibile
    ? "Riduce l'imponibile IRPEF senza limiti di deducibilità."
    : "NON riduce l'imponibile IRPEF: trattenuta diretta dal netto.";
  return `${fondo.descrizione} Contributo 2026: ${formatCurrency(fondo.contributoLavoratore)}/anno${calcolo}. ${effetto}`;
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

  readonly fondiCommercio = vociFondi('dipendentiCommercio');
  readonly fondiDirigenti = vociFondi('dirigentiTerziario');

  readonly fondoCommercioSelezionato = computed(() =>
    this.fondiCommercio.some((fondo) => this.formModel()()[fondo.id]),
  );
  readonly fondoDirigentiSelezionato = computed(() =>
    this.fondiDirigenti.some((fondo) => this.formModel()()[fondo.id]),
  );

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
      commercio: this.fondoCommercioSelezionato(),
      dirigenti: this.fondoDirigentiSelezionato(),
    };
  });

  readonly sezioniAttive = computed(() => Object.values(this.attive()).filter(Boolean).length);

  /** The figure each active row shows on the right, from the latest result */
  readonly riepiloghi = computed<Partial<Record<Riga, string>>>(() => {
    const r = this.result();
    const m = this.formModel()();
    if (!r) return {};
    const eur = (value: number) => formatCurrency(value);
    const contaFondi = (fondi: { id: string }[]) =>
      r.fondiContrattuali
        .filter((fondo) => fondi.some((f) => f.id === fondo.id))
        .reduce((sum, fondo) => sum + fondo.contributoAnnuo, 0);
    const conta = (n: number, uno: string, molti: string) => `${n} ${n === 1 ? uno : molti}`;

    const fp = r.fondoPensioneIntegrativo;
    const fringe = r.fringeBenefit;
    const famiglia = r.detrazioniFamiliari;
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
      commercio: `− ${eur(contaFondi(this.fondiCommercio))} / anno`,
      dirigenti: `− ${eur(contaFondi(this.fondiDirigenti))} / anno`,
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
}
