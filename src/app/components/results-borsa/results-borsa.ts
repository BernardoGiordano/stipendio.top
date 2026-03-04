import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { OutputCalcoloStipendio } from '../../../calculator/types';
import { DisplayMode } from '../../services/display-mode';
import { formatCurrency, formatPercent } from '../../utils/intl';

@Component({
  selector: 'app-results-borsa',
  templateUrl: './results-borsa.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResultsBorsa {
  readonly formatCurrency = formatCurrency;
  readonly formatPercent = formatPercent;

  readonly displayMode = inject(DisplayMode);

  readonly result = input<OutputCalcoloStipendio | null>(null);

  readonly hasResult = computed(() => this.result() !== null);
}
