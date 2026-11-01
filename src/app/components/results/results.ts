import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { InputCalcoloStipendio, OutputCalcoloStipendio } from '../../../calculator/types';
import { GraphFunnel } from '../graph-funnel/graph-funnel';
import { GraphProjection } from '../graph-projection/graph-projection';
import { DisplayMode } from '../../services/display-mode';
import { AnimatedAmount, LedgerRow, LedgerVoce } from '../ledger/ledger';
import { formatPercent } from '../../utils/intl';

type TabId = 'cedolino' | 'flusso' | 'proiezione';

@Component({
  selector: 'app-results',
  imports: [GraphFunnel, GraphProjection, LedgerRow, AnimatedAmount],
  templateUrl: './results.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Results {
  readonly formatPercent = formatPercent;

  readonly displayMode = inject(DisplayMode);

  readonly result = input<OutputCalcoloStipendio | null>(null);
  readonly baseInput = input<InputCalcoloStipendio | null>(null);

  readonly hasResult = computed(() => this.result() !== null);

  /** Cash entries and totals calculated from the same ripartizione as the charts. */
  readonly riepilogo = computed<LedgerVoce[]>(() => {
    const r = this.result();
    if (!r) return [];
    const entrate = r.ripartizione.entrate
      .filter((voce) => voce.destinazione === 'netto' && voce.categoria !== 'bonus')
      .map((voce) => ({ label: voce.descrizione, amount: voce.importo }));

    return [
      ...entrate,
      { label: 'Totale Trattenute', amount: r.totaleTrattenute, flow: 'out' },
      { label: 'Totale Bonus', amount: r.totaleBonus, flow: 'in' },
      { label: 'Netto Annuo', amount: r.nettoAnnuo, level: 'total' },
      { label: 'Aliquota Effettiva', percent: r.aliquotaEffettiva },
      { label: 'Totale Percepito', amount: r.totalePercepito },
    ];
  });

  readonly entrateDatore = computed(
    () => this.result()?.ripartizione.entrate.filter((voce) => voce.pagatore === 'datore') ?? [],
  );

  readonly activeTab = signal<TabId>('cedolino');

  setActiveTab(tab: TabId): void {
    this.activeTab.set(tab);
  }
}
