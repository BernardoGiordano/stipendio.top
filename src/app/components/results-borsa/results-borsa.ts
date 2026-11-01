import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { OutputCalcoloStipendio } from '../../../calculator/types';
import { DisplayMode } from '../../services/display-mode';
import { AnimatedAmount, LedgerRow } from '../ledger/ledger';

@Component({
  selector: 'app-results-borsa',
  imports: [LedgerRow, AnimatedAmount],
  templateUrl: './results-borsa.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResultsBorsa {
  readonly displayMode = inject(DisplayMode);

  readonly result = input<OutputCalcoloStipendio | null>(null);

  readonly hasResult = computed(() => this.result() !== null);
}
