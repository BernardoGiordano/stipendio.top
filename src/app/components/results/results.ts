import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { InputCalcoloStipendio, OutputCalcoloStipendio } from '../../../calculator/types';
import { REGIONE_LABELS } from '../../../calculator/addizionali/2026.regionali';
import { PLAFOND_PREVIDENZA_COMPLEMENTARE } from '../../../calculator/fondi/2026';
import { GraphFunnel } from '../graph-funnel/graph-funnel';
import { GraphProjection } from '../graph-projection/graph-projection';
import { DisplayMode } from '../../services/display-mode';
import { HUE, SERIE } from '../../services/chart-palette';
import { LedgerCard, LedgerRow, LedgerVoce } from '../ledger/ledger';
import { Kpi, Stat, Tray } from '../tray/tray';
import { ripartizioneRal } from '../tray/breakdown';
import { aumentoNetto } from '../../utils/proiezione';
import { formatCurrency, formatPercent } from '../../utils/intl';

type TabId = 'cedolino' | 'flusso' | 'proiezione';

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

  readonly displayMode = inject(DisplayMode);

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
    if (this.displayMode.isPercepito()) {
      return [
        { ...percepitoMensile, note: `${mensilita}, welfare compreso` },
        { ...nettoMensile, note: 'in busta paga' },
        {
          label: 'Totale annuo',
          value: r.totalePercepito,
          note: `netto ${formatCurrency(r.nettoAnnuo)}`,
        },
      ];
    }
    return [
      { ...nettoMensile, note: mensilita },
      { ...percepitoMensile, note: 'welfare compreso' },
      {
        label: 'Netto annuo',
        value: r.nettoAnnuo,
        note: `percepito ${formatCurrency(r.totalePercepito)}`,
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

  /** Riepilogo rows: what reaches the busta, where it goes, and what is paid on top */
  readonly riepilogo = computed<LedgerVoce[]>(() => {
    const r = this.result();
    const ripartizione = this.ripartizione();
    if (!r || !ripartizione) return [];
    const share = (importo: number) => (ripartizione.base > 0 ? importo / ripartizione.base : 0);

    const entrate: LedgerVoce[] = r.ripartizione.entrate
      .filter((voce) => voce.destinazione === 'netto' && voce.categoria !== 'bonus')
      .map((voce) => ({
        label: voce.descrizione,
        amount: voce.importo,
        share: share(voce.importo),
        bar: 'var(--ring-strong)',
      }));

    const trattenute: LedgerVoce[] = ripartizione.quote
      .filter((quota) => quota.id !== 'netto')
      .map((quota) => ({
        label: quota.label,
        amount: quota.importo,
        flow: 'out',
        share: quota.quota,
        bar: HUE[quota.hue].bar,
      }));

    const esenti: LedgerVoce[] = r.ripartizione.entrate
      .filter((voce) => voce.destinazione === 'esente')
      .map((voce) => ({
        label: voce.descrizione,
        amount: voce.importo,
        flow: 'in',
        share: share(voce.importo),
        bar: SERIE.percepito,
      }));

    return [
      ...entrate,
      ...trattenute,
      { label: 'Totale trattenute', amount: r.totaleTrattenute, flow: 'out', level: 'detail' },
      ...(r.totaleBonus > 0
        ? [
            {
              label: 'Bonus fiscali',
              amount: r.totaleBonus,
              flow: 'in',
              share: share(r.totaleBonus),
              bar: HUE.verde.bar,
            } satisfies LedgerVoce,
          ]
        : []),
      {
        label: 'Netto annuo',
        amount: r.nettoAnnuo,
        level: 'total',
        share: share(r.nettoAnnuo),
        bar: HUE.verde.bar,
      },
      { label: 'Aliquota effettiva', percent: r.aliquotaEffettiva, level: 'detail' },
      ...esenti,
      { label: 'Totale percepito', amount: r.totalePercepito, level: 'total' },
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

  setActiveTab(tab: TabId): void {
    this.activeTab.set(tab);
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
    this.activeTab.set(TABS[next].id);
    document.getElementById(`tab-${TABS[next].id}`)?.focus();
  }
}
