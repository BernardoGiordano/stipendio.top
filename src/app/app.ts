import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  Injector,
  signal,
  viewChild,
} from '@angular/core';
import { FormContainer } from './components/form-container/form-container';
import { FormBorsaContainer } from './components/form-borsa-container/form-borsa-container';
import { Results } from './components/results/results';
import { ResultsBorsa } from './components/results-borsa/results-borsa';
import { Resizer } from './components/resizer/resizer';
import { Hero } from './components/hero/hero';
import { Icon } from './components/icon/icon';
import { AnimatedAmount } from './components/ledger/ledger';
import { LINKS, NAV_LINKS } from './links';
import {
  createDefaultFormModel,
  createStipendioForm,
  RAL_ESEMPIO,
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
  CdkMenuGroup,
  CdkMenuItem,
  CdkMenuItemRadio,
  CdkMenuTrigger,
} from '@angular/cdk/menu';
import buildInfo from '../build.json';

@Component({
  selector: 'app-root',
  imports: [
    FormContainer,
    FormBorsaContainer,
    Results,
    ResultsBorsa,
    Resizer,
    Hero,
    Icon,
    AnimatedAmount,
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
  readonly buildInfo = buildInfo;

  readonly links = LINKS;
  readonly navLinks = NAV_LINKS;

  readonly displayOptions = [
    { mode: 'netto', label: 'Netto', menuLabel: 'Mostra netto' },
    { mode: 'percepito', label: 'Percepito', menuLabel: 'Mostra percepito' },
  ] as const;

  readonly themeOptions = [
    { theme: 'light', label: 'Tema chiaro' },
    { theme: 'dark', label: 'Tema scuro' },
  ] as const;

  /** Desktop bar link: icon only, label slides out on hover */
  readonly barItem =
    'hidden lg:flex items-center gap-2 p-2 rounded-lg text-subtle hover:text-fg hover:bg-sunken focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus transition-all duration-300 overflow-hidden group';
  readonly barLabel =
    'text-sm font-medium whitespace-nowrap max-w-0 group-hover:max-w-xs group-focus-visible:max-w-xs overflow-hidden opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 hover-text-delay';
  readonly menuItem =
    'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-fg hover:bg-sunken focus:bg-sunken focus:outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus cursor-pointer';

  private readonly injector = inject(Injector);
  private readonly results = viewChild(Results);

  readonly themeMode = inject(ThemeMode);
  readonly formStateShare = inject(FormStateShare);
  readonly displayMode = inject(DisplayMode);

  readonly formModel = signal<StipendioFormModel>(this.loadInitialFormState());
  readonly stipendioForm = createStipendioForm(this.formModel);

  readonly isBorsaDiStudio = computed(() => this.formModel().tipoContratto === 'borsaDiStudio');

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

  constructor() {
    console.info(`stipendio.top - build ${this.buildInfo.buildDate} (${this.buildInfo.gitCommit})`);
    effect(() => {
      if (this.loadedFromUrl()) {
        this.calculationResult();
      }
    });
  }

  /** Opens the Flusso tab, scrolls the results to the top and moves focus to the tab */
  showFlow(): void {
    this.results()?.setActiveTab('flusso');
    afterNextRender(
      () => {
        document.getElementById('risultati')?.scrollIntoView({ block: 'start' });
        document.getElementById('tab-flusso')?.focus({ preventScroll: true });
      },
      { injector: this.injector },
    );
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
    return { ...createDefaultFormModel(), ral: RAL_ESEMPIO };
  }
}
