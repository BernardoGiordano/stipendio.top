import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { FormContainer } from './components/form-container/form-container';
import { Results } from './components/results/results';
import {
  createDefaultFormModel,
  createStipendioForm,
  StipendioFormModel,
  toInputCalcoloStipendio,
} from './components/form-container/form-group';
import { calcolaStipendioNetto } from '../calculator/calculator';
import { OutputCalcoloStipendio } from '../calculator/types';

@Component({
  selector: 'app-root',
  imports: [FormContainer, Results],
  templateUrl: './app.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  readonly formModel = signal<StipendioFormModel>(createDefaultFormModel());
  readonly stipendioForm = createStipendioForm(this.formModel);

  readonly calculationResult = computed<OutputCalcoloStipendio | null>(() => {
    // Check form validity before calculating
    if (!this.stipendioForm().valid()) {
      return null;
    }

    const model = this.formModel();
    const input = toInputCalcoloStipendio(model);
    if (!input) {
      return null;
    }
    try {
      return calcolaStipendioNetto(input);
    } catch {
      return null;
    }
  });
}
