import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { OutputCalcoloStipendio } from '../../../calculator/types';
import { GraphFunnel } from '../graph-funnel/graph-funnel';

type TabId = 'cedolino' | 'grafico';

@Component({
  selector: 'app-results',
  imports: [GraphFunnel],
  templateUrl: './results.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Results {
  readonly result = input<OutputCalcoloStipendio | null>(null);

  readonly hasResult = computed(() => this.result() !== null);

  readonly activeTab = signal<TabId>('cedolino');

  setActiveTab(tab: TabId): void {
    this.activeTab.set(tab);
  }

  formatCurrency(value: number | null | undefined): string {
    if (value === null || value === undefined) return '-';
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }

  formatPercent(value: number | null | undefined): string {
    if (value === null || value === undefined) return '-';
    return new Intl.NumberFormat('it-IT', {
      style: 'percent',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }
}
