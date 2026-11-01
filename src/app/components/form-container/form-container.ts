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
import { TipoAlimentazioneAuto, TipoContratto } from '../../../calculator/types';
import { InfoTooltip } from '../info-tooltip/info-tooltip';
import {
  elencoComuni,
  elencoRegioni,
  haRedditiSostitutiviInSoglia,
} from '../../../calculator/addizionali/2026';
import { FONDI_CONTRATTUALI, FondoContrattuale } from '../../../calculator/fondi/2026';
import { formatCurrency } from '../../utils/intl';

const ALTRO_OPTION = { value: 'DEFAULT', label: 'Non specificato' } as const;

function vociFondi(categoria: FondoContrattuale['categoria']) {
  return FONDI_CONTRATTUALI.filter((fondo) => fondo.categoria === categoria).map((fondo) => ({
    id: fondo.id,
    nome: fondo.nome,
    tooltip: tooltipFondo(fondo),
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
  imports: [FormField, FormsModule, NgSelectComponent, InfoTooltip],
  templateUrl: './form-container.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormContainer {
  readonly stipendioForm = input.required<StipendioFieldTree>();
  readonly formModel = input.required<WritableSignal<StipendioFormModel>>();

  readonly regioniDisponibili: { value: string; label: string }[] = elencoRegioni().map((r) => ({
    value: r.codice,
    label: r.nome,
  }));

  private readonly selectedRegione = computed(() => this.formModel()().regione);

  readonly comuniFiltrati = computed(() => [
    ALTRO_OPTION,
    ...elencoComuni(this.selectedRegione()).map((c) => ({ value: c.codice, label: c.nome })),
  ]);

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

  readonly mensilita = ['15', '14', '13', '12'];

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
