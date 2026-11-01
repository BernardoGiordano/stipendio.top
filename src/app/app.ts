import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  signal,
} from '@angular/core';
import { FormContainer } from './components/form-container/form-container';
import { FormBorsaContainer } from './components/form-borsa-container/form-borsa-container';
import { Results } from './components/results/results';
import { ResultsBorsa } from './components/results-borsa/results-borsa';
import { Resizer } from './components/resizer/resizer';
import { Icon } from './components/icon/icon';
import { AnimatedAmount } from './components/ledger/ledger';
import { ShareLink } from './components/share-link/share-link';
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
import {
  CdkMenu,
  CdkMenuGroup,
  CdkMenuItem,
  CdkMenuItemRadio,
  CdkMenuTrigger,
} from '@angular/cdk/menu';
import buildInfo from '../build.json';

const FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus';

@Component({
  selector: 'app-root',
  imports: [
    FormContainer,
    FormBorsaContainer,
    Results,
    ResultsBorsa,
    Resizer,
    Icon,
    AnimatedAmount,
    ShareLink,
    CdkMenu,
    CdkMenuItem,
    CdkMenuItemRadio,
    CdkMenuGroup,
    CdkMenuTrigger,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'relative block overflow-clip' },
})
export class App {
  readonly buildInfo = buildInfo;
  readonly year = new Date().getFullYear();
  /** Build date as YYYY-MM-DD, from the YYYYMMDD-HHmm build stamp */
  readonly version = buildInfo.buildDate.replace(/^(\d{4})(\d{2})(\d{2}).*$/, '$1-$2-$3');

  readonly links = LINKS;
  readonly navLinks = NAV_LINKS;
  readonly headerLinks = [LINKS.github, LINKS.paypal];
  readonly licenseHref = `${LINKS.github.href}/blob/main/LICENSE`;

  readonly themeOptions = [
    { theme: 'light', label: 'Tema chiaro' },
    { theme: 'dark', label: 'Tema scuro' },
  ] as const;

  /** Desktop links reveal their labels on hover or keyboard focus. */
  readonly barItem = `group hidden h-11 items-center overflow-hidden rounded-lg px-3 text-muted transition-colors hover:bg-sunken hover:text-fg lg:flex ${FOCUS}`;
  readonly barLabel =
    'hover-text-delay max-w-0 overflow-hidden text-sm font-medium whitespace-nowrap opacity-0 group-hover:max-w-xs group-hover:opacity-100 group-focus-visible:max-w-xs group-focus-visible:opacity-100';
  readonly iconButton = `size-11 cursor-pointer items-center justify-center rounded-lg text-fg hover:bg-sunken ${FOCUS}`;
  readonly creditLink = `rounded-sm font-medium text-fg underline decoration-fg/30 underline-offset-4 hover:decoration-fg ${FOCUS}`;
  readonly menuItem =
    'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-fg hover:bg-sunken focus:bg-sunken focus:outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus cursor-pointer';

  readonly themeMode = inject(ThemeMode);
  readonly formStateShare = inject(FormStateShare);

  readonly formModel = signal<StipendioFormModel>(this.loadInitialFormState());
  readonly stipendioForm = createStipendioForm(this.formModel);

  readonly isBorsaDiStudio = computed(() => this.formModel().tipoContratto === 'borsaDiStudio');

  /** Whether the form was loaded from a shared URL */
  readonly loadedFromUrl = signal(false);

  /** Width share of the form column on desktop, 0.3 to 0.5; the default matches flex 1 : 1.2 */
  readonly splitRatio = signal(0.45);

  /** Whether the results fill the upper half of the viewport, for the mobile bar */
  private readonly resultsInView = signal(false);

  /** Where the mobile bar jumps: down to the results, or back up to the form */
  readonly barTarget = computed(() =>
    this.resultsInView()
      ? ({ href: '#dati', label: 'Modifica dati', icon: 'arrow-up' } as const)
      : ({ href: '#risultati', label: 'Risultati', icon: 'arrow-down' } as const),
  );

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

    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const results = document.getElementById('risultati');
      if (!results || typeof IntersectionObserver !== 'function') return;
      const observer = new IntersectionObserver(
        ([entry]) => this.resultsInView.set(entry.isIntersecting),
        { rootMargin: '0px 0px -50% 0px' },
      );
      observer.observe(results);
      destroyRef.onDestroy(() => observer.disconnect());
    });
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
