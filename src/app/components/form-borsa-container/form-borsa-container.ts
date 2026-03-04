import { ChangeDetectionStrategy, Component, input, WritableSignal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FormField } from '@angular/forms/signals';
import { StipendioFieldTree, StipendioFormModel } from '../form-container/form-group';
import { TipoContratto } from '../../../calculator/types';
import { InfoTooltip } from '../info-tooltip/info-tooltip';

@Component({
  selector: 'app-form-borsa-container',
  imports: [FormField, FormsModule, InfoTooltip],
  templateUrl: './form-borsa-container.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormBorsaContainer {
  readonly stipendioForm = input.required<StipendioFieldTree>();
  readonly formModel = input.required<WritableSignal<StipendioFormModel>>();

  readonly tipiContratto: { value: TipoContratto; label: string }[] = [
    { value: 'indeterminato', label: 'Tempo indeterminato' },
    { value: 'determinato', label: 'Tempo determinato' },
    { value: 'apprendistato', label: 'Apprendistato' },
    { value: 'borsaDiStudio', label: 'Borsa di studio (dottorato, specializzazione)' },
  ];

  readonly anniFiscali = ['2026', '2027', '2028', '2029', '2030'];
}
