import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  Injector,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { InputCalcoloStipendio, OutputCalcoloStipendio } from '../../../calculator/types';
import { REGIONE_LABELS } from '../../../calculator/addizionali/2026.regionali';
import { PLAFOND_PREVIDENZA_COMPLEMENTARE } from '../../../calculator/fondi/2026';
import { GraphFunnel } from '../graph-funnel/graph-funnel';
import { GraphProjection } from '../graph-projection/graph-projection';
import { LedgerCard, LedgerRow, LedgerVoce } from '../ledger/ledger';
import { Kpi, Stat, Tray } from '../tray/tray';
import { ripartizioneRal } from '../tray/breakdown';
import { aumentoNetto } from '../../utils/proiezione';
import { formatCurrency, formatPercent } from '../../utils/intl';

type TabId = 'cedolino' | 'flusso' | 'proiezione';

/** Tailwind's lg breakpoint, where the tab bar pins to the top */
const PINNED_BAR_QUERY = '(min-width: 64rem)';

const TABS: readonly { id: TabId; label: string }[] = [
  { id: 'cedolino', label: 'Dettaglio' },
  { id: 'flusso', label: 'Flusso' },
  { id: 'proiezione', label: 'Proiezione' },
];

@Component({
  selector: 'app-results',
  imports: [GraphFunnel, GraphProjection, LedgerCard, LedgerRow, Tray],
  templateUrl: './results.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Results {
  readonly formatPercent = formatPercent;
  readonly formatCurrency = formatCurrency;
  readonly plafond = PLAFOND_PREVIDENZA_COMPLEMENTARE;
  readonly tabs = TABS;
  /** A line of context under a card's rows */
  readonly note = 'pt-0.5 pb-1.5 pl-3.5 text-[13px]/[18px] text-muted';
  /** Panels clear the pinned tab bar when scrolled into view */
  readonly panel =
    'scroll-mt-[74px] rounded-[20px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus';

  /** The tab bar while pinned: a frosted sheet flush with the top of the viewport */
  readonly pinnedBar =
    'lg:rounded-b-xl lg:bg-surface/95 lg:shadow-md lg:ring-1 lg:ring-ring-card lg:backdrop-blur-md';

  private readonly injector = inject(Injector);
  private readonly bar = viewChild<ElementRef<HTMLElement>>('bar');

  /** True while the tab bar sits pinned at the top of the viewport */
  readonly barStuck = signal(false);

  readonly result = input<OutputCalcoloStipendio | null>(null);
  readonly baseInput = input<InputCalcoloStipendio | null>(null);

  readonly ripartizione = computed(() => {
    const r = this.result();
    return r ? ripartizioneRal(r) : null;
  });

  /** Extra netto annuo from 1.000 € more RAL */
  readonly aumento = computed(() => {
    const base = this.baseInput();
    return base ? aumentoNetto(base) : null;
  });

  readonly kpi = computed<Kpi[]>(() => {
    const r = this.result();
    if (!r) return [];
    const mensilita = `su ${r.mensilita} mensilità`;
    const percepitoMensile = { label: 'Percepito mensile', value: r.nettoMensilePercepito };
    const nettoMensile = { label: 'Netto mensile', value: r.nettoMensile };
    return [
      { ...percepitoMensile, note: `${mensilita}, welfare compreso` },
      { ...nettoMensile, note: 'in busta paga' },
      {
        label: 'Percepito annuo',
        value: r.totalePercepito,
        note: `netto ${formatCurrency(r.nettoAnnuo)}`,
      },
    ];
  });

  readonly stats = computed<Stat[]>(() => {
    const r = this.result();
    if (!r) return [];
    const stats: Stat[] = [
      {
        label: 'Costo aziendale',
        value: formatCurrency(r.costoAziendale),
        hue: 'terracotta',
        icon: 'building',
      },
    ];
    const aumento = this.aumento();
    if (aumento !== null) {
      stats.push({
        label: 'Con 1.000 € di RAL in più',
        value: `+ ${formatCurrency(aumento)} netti l'anno`,
        hue: 'verde',
        icon: 'trend',
      });
    }
    if (r.fondoPensioneIntegrativo) {
      stats.push({
        label: 'Risparmio fondo pensione',
        value: `${formatCurrency(r.fondoPensioneIntegrativo.risparmoFiscaleStimato)} l'anno`,
        hue: 'viola',
        icon: 'sprout',
      });
    }
    return stats;
  });

  /**
   * Riepilogo rows, read top to bottom like a payslip: what reaches the busta,
   * the trattenute with their breakdown, the netto, then what is paid on top.
   */
  readonly riepilogo = computed<LedgerVoce[]>(() => {
    const r = this.result();
    const ripartizione = this.ripartizione();
    if (!r || !ripartizione) return [];
    const entrate: LedgerVoce[] = r.ripartizione.entrate
      .filter((voce) => voce.destinazione === 'netto' && voce.categoria !== 'bonus')
      .map((voce) => ({ label: voce.descrizione, amount: voce.importo }));

    const trattenute: LedgerVoce[] = ripartizione.quote
      .filter((quota) => quota.id !== 'netto')
      .map((quota) => ({
        label: quota.label,
        amount: quota.importo,
        flow: 'out',
        level: 'detail',
      }));

    const esenti: LedgerVoce[] = r.ripartizione.entrate
      .filter((voce) => voce.destinazione === 'esente')
      .map((voce) => ({ label: voce.descrizione, amount: voce.importo, flow: 'in' }));

    const bonus: LedgerVoce[] =
      r.totaleBonus > 0 ? [{ label: 'Bonus fiscali', amount: r.totaleBonus, flow: 'in' }] : [];

    return [
      ...entrate,
      { label: 'Trattenute', amount: r.totaleTrattenute, flow: 'out' },
      ...trattenute,
      ...bonus,
      { label: 'Netto annuo', amount: r.nettoAnnuo, level: 'total' },
      { label: 'Aliquota effettiva', percent: r.aliquotaEffettiva, level: 'detail' },
      ...(esenti.length
        ? [
            ...esenti,
            { label: 'Totale percepito', amount: r.totalePercepito, level: 'total' } as const,
          ]
        : []),
    ];
  });

  /** Detrazioni that actually lowered IRPEF, and the part left unused */
  readonly detrazioniIrpef = computed(() => {
    const r = this.result();
    if (!r) return null;
    const applicate = r.irpef.irpefLorda - r.irpefFinale;
    const nonUtilizzabili = r.riepilogoDetrazioni.totale - applicate;
    return { applicate, nonUtilizzabili: nonUtilizzabili >= 0.005 ? nonUtilizzabili : 0 };
  });

  readonly entrateDatore = computed(
    () => this.result()?.ripartizione.entrate.filter((voce) => voce.pagatore === 'datore') ?? [],
  );

  /** INPS the employer pays on top of the worker's share */
  readonly inpsDatore = computed(
    () =>
      this.result()
        ?.ripartizione.entrate.filter((voce) => voce.categoria === 'contributiDatore')
        .reduce((sum, voce) => sum + voce.importo, 0) ?? 0,
  );

  readonly fondiTotale = computed(
    () => this.result()?.fondiContrattuali.reduce((sum, f) => sum + f.contributoAnnuo, 0) ?? 0,
  );

  readonly regione = computed(() => {
    const codice = this.baseInput()?.regione;
    return codice ? REGIONE_LABELS[codice] : undefined;
  });

  readonly comuneNonIndicato = computed(() => this.baseInput()?.comune === 'DEFAULT');

  /** Daily value of the buoni pasto, when they are set */
  readonly buonoPastoGiornaliero = computed(() => {
    const benefit = this.baseInput()?.benefitNonTassati;
    if (!benefit?.buoniPasto || !benefit.giorniBuoniPasto) return null;
    return {
      importo: benefit.buoniPasto / benefit.giorniBuoniPasto,
      giorni: benefit.giorniBuoniPasto,
    };
  });

  readonly activeTab = signal<TabId>('cedolino');

  constructor() {
    effect((onCleanup) => {
      const bar = this.bar()?.nativeElement;
      if (!bar || typeof IntersectionObserver === 'undefined') return;
      // A pinned bar sits at top 0, so the 1px inset clips it and its ratio drops below 1
      const observer = new IntersectionObserver(
        ([entry]) =>
          this.barStuck.set(entry.intersectionRatio < 1 && entry.boundingClientRect.top < 1),
        { rootMargin: '-1px 0px 0px 0px', threshold: 1 },
      );
      observer.observe(bar);
      onCleanup(() => {
        observer.disconnect();
        this.barStuck.set(false);
      });
    });
  }

  /** Selects a tab; with the bar pinned, brings the top of the new panel into view */
  setActiveTab(tab: TabId): void {
    this.activeTab.set(tab);
    if (!this.barStuck() || !matchMedia(PINNED_BAR_QUERY).matches) return;
    afterNextRender(() => document.getElementById(`panel-${tab}`)?.scrollIntoView(), {
      injector: this.injector,
    });
  }

  /** Arrow keys, Home and End move between tabs and select them */
  onTabKeydown(event: KeyboardEvent): void {
    const index = TABS.findIndex((tab) => tab.id === this.activeTab());
    const next =
      event.key === 'ArrowRight'
        ? (index + 1) % TABS.length
        : event.key === 'ArrowLeft'
          ? (index - 1 + TABS.length) % TABS.length
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? TABS.length - 1
              : -1;
    if (next < 0) return;
    event.preventDefault();
    this.setActiveTab(TABS[next].id);
    document.getElementById(`tab-${TABS[next].id}`)?.focus({ preventScroll: true });
  }
}
