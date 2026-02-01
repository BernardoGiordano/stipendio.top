import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormContainer } from './components/form-container/form-container';
import { Results } from './components/results/results';
import { Resizer } from './components/resizer/resizer';
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
import {
  CdkMenu,
  CdkMenuItem,
  CdkMenuItemRadio,
  CdkMenuGroup,
  CdkMenuTrigger,
} from '@angular/cdk/menu';

@Component({
  selector: 'app-root',
  imports: [
    FormContainer,
    Results,
    Resizer,
    CdkMenu,
    CdkMenuItem,
    CdkMenuItemRadio,
    CdkMenuGroup,
    CdkMenuTrigger,
  ],
  templateUrl: './app.html',
  styleUrl: 'app.css',
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

  /** Split ratio for desktop layout (0.3 to 0.7, default 0.5) */
  readonly splitRatio = signal(0.5);

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

  onResize(delta: number): void {
    // Limit splitRatio: min 0.3 for left side, max 0.5 so right side is always at least 50%
    const newRatio = Math.min(0.5, Math.max(0.3, this.splitRatio() + delta));
    this.splitRatio.set(newRatio);
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
