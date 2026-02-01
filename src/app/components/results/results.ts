import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { InputCalcoloStipendio, OutputCalcoloStipendio } from '../../../calculator/types';
import { GraphFunnel } from '../graph-funnel/graph-funnel';
import { GraphProjection } from '../graph-projection/graph-projection';
import { DisplayMode } from '../../services/display-mode';

type TabId = 'cedolino' | 'flusso' | 'proiezione';

@Component({
  selector: 'app-results',
  imports: [GraphFunnel, GraphProjection],
  templateUrl: './results.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Results {
  readonly displayMode = inject(DisplayMode);

  readonly result = input<OutputCalcoloStipendio | null>(null);
  readonly baseInput = input<InputCalcoloStipendio | null>(null);

  readonly hasResult = computed(() => this.result() !== null);

  readonly activeTab = signal<TabId>('cedolino');
  readonly hasBaseInput = computed(() => this.baseInput() !== null);

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
