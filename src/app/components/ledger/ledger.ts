import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { formatCurrency, formatPercent } from '../../utils/intl';

/** Money entering ('in') or leaving ('out') the busta; decides sign and tone */
export type Flow = 'in' | 'out';

/** Row weight: a regular row, a closing total, or an indented breakdown line */
export type Level = 'row' | 'total' | 'detail';

export interface LedgerVoce {
  label: string;
  amount?: number;
  percent?: number;
  value?: string;
  flow?: Flow;
  level?: Level;
}

/**
 * One dt/dd pair of a results list. The row owns sign, tone, number format and
 * separators, so templates only say what the value is and which way it flows.
 * A zero amount never gets a sign or a tone.
 */
@Component({
  selector: '[appLedgerRow]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'flex justify-between gap-4',
    '[class]': 'rowClass()',
    '[attr.data-level]': 'level()',
  },
  template: `
    <dt [class]="labelClass()">{{ label() }}<ng-content /></dt>
    <dd [class]="valueClass()">{{ text() }}</dd>
  `,
})
export class LedgerRow {
  readonly label = input.required<string>();
  readonly amount = input<number>();
  readonly percent = input<number>();
  readonly value = input<string>();
  readonly flow = input<Flow>();
  readonly level = input<Level>('row');

  /** Flow that applies: none when the amount is zero or missing */
  private readonly activeFlow = computed(() => {
    if (this.value() !== undefined || this.percent() !== undefined) return undefined;
    const amount = this.amount();
    return amount !== undefined && amount > 0 ? this.flow() : undefined;
  });

  readonly text = computed(() => {
    const text = this.value();
    if (text !== undefined) return text;
    const percent = this.percent();
    if (percent !== undefined) return formatPercent(percent);
    const value = formatCurrency(this.amount() ?? 0);
    const flow = this.activeFlow();
    return flow === 'out' ? `− ${value}` : flow === 'in' ? `+ ${value}` : value;
  });

  readonly rowClass = computed(() => {
    switch (this.level()) {
      case 'total':
        return 'mt-2 py-2 border-t border-ring-strong font-semibold';
      case 'detail':
        return 'py-1 pl-3';
      default:
        return 'py-1.5 border-b border-dotted border-divider last:border-b-0 has-[+[data-level=total]]:border-b-0 has-[+[data-level=detail]]:border-b-0';
    }
  });

  readonly labelClass = computed(() => {
    switch (this.level()) {
      case 'total':
        return 'text-sm text-title';
      case 'detail':
        return 'text-xs text-subtle';
      default:
        return 'text-sm text-muted';
    }
  });

  readonly valueClass = computed(() => {
    const level = this.level();
    const flow = this.activeFlow();
    const tone =
      flow === 'in'
        ? 'text-pos'
        : flow === 'out'
          ? 'text-neg'
          : level === 'detail'
            ? 'text-subtle'
            : 'text-fg';
    const size = level === 'detail' ? 'text-xs' : 'text-sm';
    const weight = level === 'row' ? 'font-medium' : '';
    const wrapping = this.value() === undefined ? 'whitespace-nowrap' : 'min-w-0 break-words';
    return `${size} text-right tabular-nums ${wrapping} ${tone} ${weight}`;
  });
}

const TWEEN_MS = 450;

/**
 * A euro amount that counts from its previous value to the new one.
 * Jumps straight to the value when the user prefers reduced motion.
 */
@Component({
  selector: 'app-amount',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `{{ text() }}`,
})
export class AnimatedAmount {
  readonly value = input.required<number>();

  private readonly shown = signal<number | null>(null);
  readonly text = computed(() => formatCurrency(this.shown() ?? this.value()));

  private frame = 0;

  constructor() {
    const reduce =
      typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

    effect(() => {
      const target = this.value();
      const from = untracked(this.shown);
      cancelAnimationFrame(this.frame);
      if (reduce || from === null || from === target) {
        this.shown.set(target);
        return;
      }
      const start = performance.now();
      const step = (now: number) => {
        const t = Math.min(1, (now - start) / TWEEN_MS);
        const eased = 1 - (1 - t) ** 3;
        this.shown.set(from + (target - from) * eased);
        if (t < 1) this.frame = requestAnimationFrame(step);
      };
      this.frame = requestAnimationFrame(step);
    });

    inject(DestroyRef).onDestroy(() => cancelAnimationFrame(this.frame));
  }
}
