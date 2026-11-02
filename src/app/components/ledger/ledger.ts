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

/**
 * Money entering ('in') or leaving ('out') the busta, or a reduction of a cost
 * ('reduce', such as detrazioni on IRPEF); decides sign and tone.
 */
export type Flow = 'in' | 'out' | 'reduce';

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

/** Signed text and tone of an amount; a zero or missing amount gets neither */
export function signed(amount: number | undefined, flow?: Flow) {
  const text = formatCurrency(amount ?? 0);
  if (!flow || amount === undefined || !(amount > 0)) return { text, tone: null };
  if (flow === 'in') return { text: `+ ${text}`, tone: 'text-pos' };
  if (flow === 'out') return { text: `− ${text}`, tone: 'text-neg' };
  return { text: `− ${text}`, tone: 'text-pos' };
}

/**
 * One dt/dd pair of a results list. The row owns sign, tone, number format and
 * spacing, so templates only say what the value is and which way it flows.
 */
@Component({
  selector: '[appLedgerRow]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
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

  private readonly amountValue = computed(
    () => this.value() === undefined && this.percent() === undefined,
  );
  private readonly signedAmount = computed(() =>
    this.amountValue() ? signed(this.amount(), this.flow()) : null,
  );

  readonly text = computed(() => {
    const text = this.value();
    if (text !== undefined) return text;
    const percent = this.percent();
    if (percent !== undefined) return formatPercent(percent);
    return this.signedAmount()!.text;
  });

  /**
   * Rows draw a dotted rule above themselves, like the lines of a payslip.
   * Details hang off the row before them, totals close a block with a solid rule.
   */
  readonly rowClass = computed(() => {
    const base = 'flex items-baseline justify-between gap-4';
    switch (this.level()) {
      case 'total':
        return `${base} mt-1 border-t border-fg/25 pt-2 pb-1.5 text-sm/5 font-semibold`;
      case 'detail':
        return `${base} -mt-1 pb-1.5 pl-3.5 text-[13px]/[18px]`;
      default:
        return `${base} border-t border-dotted border-ring-strong py-1.5 text-sm/5 first:border-t-0`;
    }
  });

  readonly labelClass = computed(() => {
    switch (this.level()) {
      case 'total':
        return 'min-w-0 text-fg';
      case 'detail':
        return 'min-w-0 text-muted';
      default:
        return 'min-w-0 text-label';
    }
  });

  readonly valueClass = computed(() => {
    const tone =
      this.signedAmount()?.tone ?? (this.level() === 'detail' ? 'text-muted' : 'text-fg');
    const wrapping = this.value() === undefined ? 'whitespace-nowrap' : 'min-w-0 break-words';
    const weight = this.level() === 'row' ? 'font-medium' : '';
    return `text-right tabular-nums ${wrapping} ${tone} ${weight}`;
  });
}

let nextCardId = 0;

/**
 * A section of the payslip: a mono heading ruled off from its rows, with the
 * section total on the right. Consecutive sections share one sheet.
 */
@Component({
  selector: 'app-ledger-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block border-t border-hair first:border-t-0',
  },
  template: `
    <section [attr.aria-labelledby]="id + '-title'" class="px-4 pt-4 pb-3 sm:px-6 sm:pt-5">
      <div class="flex items-baseline justify-between gap-4 border-b border-fg/25 pb-2">
        <h3
          [id]="id + '-title'"
          class="min-w-0 font-mono text-xs/5 font-semibold tracking-widest text-title uppercase"
        >
          {{ heading() }}
        </h3>
        @if (total() !== undefined) {
          <p
            class="text-[15px]/5 font-semibold whitespace-nowrap tabular-nums"
            [class]="totalAmount().tone ?? 'text-fg'"
          >
            {{ totalAmount().text }}
          </p>
        }
      </div>
      <div class="pt-1">
        <ng-content />
      </div>
    </section>
  `,
})
export class LedgerCard {
  readonly heading = input.required<string>();
  readonly total = input<number>();
  readonly flow = input<Flow>();

  readonly id = `ledger-card-${nextCardId++}`;
  protected readonly totalAmount = computed(() => signed(this.total(), this.flow()));
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
