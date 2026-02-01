import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormContainer } from './components/form-container/form-container';
import { Results } from './components/results/results';
import {
  createDefaultFormModel,
  createStipendioForm,
  StipendioFormModel,
  toInputCalcoloStipendio,
} from './components/form-container/form-group';
import { calcolaStipendioNetto } from '../calculator/calculator';
import { InputCalcoloStipendio, OutputCalcoloStipendio } from '../calculator/types';
import { ThemeMode } from './services/theme-mode';
import { FormStateShare } from './services/form-state-share';
import { DisplayMode } from './services/display-mode';

@Component({
  selector: 'app-root',
  imports: [FormContainer, Results],
  templateUrl: './app.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  readonly themeMode = inject(ThemeMode);
  readonly formStateShare = inject(FormStateShare);
  readonly displayMode = inject(DisplayMode);

  readonly formModel = signal<StipendioFormModel>(this.loadInitialFormState());
  readonly stipendioForm = createStipendioForm(this.formModel);

  /** Whether the form was loaded from a shared URL */
  readonly loadedFromUrl = signal(false);

  /** The input model for projections (derived from form) */
  readonly calculationInput = computed<InputCalcoloStipendio | null>(() => {
    if (!this.stipendioForm().valid()) {
      return null;
    }
    const model = this.formModel();
    return toInputCalcoloStipendio(model);
  });

  readonly calculationResult = computed<OutputCalcoloStipendio | null>(() => {
    const input = this.calculationInput();
    if (!input) {
      return null;
    }
    try {
      return calcolaStipendioNetto(input);
    } catch {
      return null;
    }
  });

  formatCurrency(value: number | null | undefined): string {
    if (value === null || value === undefined) return '-';
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }

  copyShareableLink(): void {
    this.formStateShare.copyToClipboard(this.formModel());
  }

  private loadInitialFormState(): StipendioFormModel {
    const urlState = this.formStateShare.getStateFromUrl();
    if (urlState) {
      // Mark as loaded from URL and clear the URL param
      setTimeout(() => {
        this.loadedFromUrl.set(true);
        this.formStateShare.clearUrlState();
      });
      return this.formStateShare.mergeWithDefaults(urlState);
    }
    return createDefaultFormModel();
  }
}
