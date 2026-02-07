import { ChangeDetectionStrategy, Component, input, WritableSignal } from '@angular/core';
import { FormField } from '@angular/forms/signals';
import {
  createDefaultAscendente,
  createDefaultFiglio,
  StipendioFieldTree,
  StipendioFormModel,
} from './form-group';
import { TipoAlimentazioneAuto, TipoContratto } from '../../../calculator/types';
import { InfoTooltip } from '../info-tooltip/info-tooltip';
import { ADDIZIONALI_REGIONALI } from '../../../calculator/addizionali/2026.regionali';
import { ADDIZIONALI_COMUNALI } from '../../../calculator/addizionali/2026.comunali';

@Component({
  selector: 'app-form-container',
  imports: [FormField, InfoTooltip],
  templateUrl: './form-container.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormContainer {
  readonly stipendioForm = input.required<StipendioFieldTree>();
  readonly formModel = input.required<WritableSignal<StipendioFormModel>>();

  readonly regioniDisponibili: { value: string; label: string }[] = [
    { value: 'DEFAULT', label: 'Altro' },
    ...Object.keys(ADDIZIONALI_REGIONALI)
      .filter((r) => r !== 'DEFAULT')
      .map((r) => ({ value: r, label: this.formatLabel(r) })),
  ];

  readonly comuniDisponibili: { value: string; label: string }[] = [
    { value: 'DEFAULT', label: 'Altro' },
    ...Object.keys(ADDIZIONALI_COMUNALI)
      .filter((c) => c !== 'DEFAULT')
      .map((c) => ({ value: c, label: this.formatLabel(c) })),
  ];

  private formatLabel(key: string): string {
    return key
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

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
