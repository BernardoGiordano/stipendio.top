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
  ADDIZIONALI_REGIONALI,
  REGIONE_LABELS,
} from '../../../calculator/addizionali/2026.regionali';
import { ADDIZIONALI_COMUNALI } from '../../../calculator/addizionali/2026.comunali';

const ALTRO_OPTION = { value: 'DEFAULT', label: 'Non specificato' } as const;

const COMUNI_PER_REGIONE: Record<string, { value: string; label: string }[]> = {};
for (const [key, entry] of Object.entries(ADDIZIONALI_COMUNALI)) {
  const regione = entry.r;
  (COMUNI_PER_REGIONE[regione] ??= []).push({ value: key, label: entry.n });
}
for (const [regione, comuni] of Object.entries(COMUNI_PER_REGIONE)) {
  comuni.sort((a, b) => a.label.localeCompare(b.label, 'it'));
  COMUNI_PER_REGIONE[regione] = [ALTRO_OPTION, ...comuni];
}

const FALLBACK_COMUNI = [ALTRO_OPTION];

@Component({
  selector: 'app-form-container',
  imports: [FormField, FormsModule, NgSelectComponent, InfoTooltip],
  templateUrl: './form-container.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormContainer {
  readonly stipendioForm = input.required<StipendioFieldTree>();
  readonly formModel = input.required<WritableSignal<StipendioFormModel>>();

  readonly regioniDisponibili: { value: string; label: string }[] = Object.keys(
    ADDIZIONALI_REGIONALI,
  )
    .filter((r) => r !== 'DEFAULT')
    .map((r) => ({ value: r, label: REGIONE_LABELS[r] ?? r }))
    .sort((a, b) => a.label.localeCompare(b.label, 'it'));

  private readonly selectedRegione = computed(() => this.formModel()().regione);

  readonly comuniFiltrati = computed(() => {
    return COMUNI_PER_REGIONE[this.selectedRegione()] ?? FALLBACK_COMUNI;
  });

  readonly tipiContratto: { value: TipoContratto; label: string }[] = [
    { value: 'indeterminato', label: 'Tempo indeterminato' },
    { value: 'determinato', label: 'Tempo determinato' },
    { value: 'apprendistato', label: 'Apprendistato' },
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
