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
import { HUE_CLASS, Hue } from '../../services/chart-palette';
import { formatCurrency, formatPercent } from '../../utils/intl';
import { Icon, IconName } from '../icon/icon';

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
  /** Share of the reference amount, drawn as a bar next to the value */
  share?: number;
  bar?: string;
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
    <dd [class]="valueClass()">
      @if (share() !== undefined) {
        <span
          aria-hidden="true"
          class="hidden h-1.5 w-[140px] shrink-0 overflow-hidden rounded-[3px] bg-sunken sm:block"
        >
          <span
            class="block h-full rounded-[3px]"
            [style.width.%]="barWidth()"
            [style.background-color]="bar()"
          ></span>
        </span>
        <span class="text-right sm:min-w-[7.5rem]">{{ text() }}</span>
      } @else {
        {{ text() }}
      }
    </dd>
  `,
})
export class LedgerRow {
  readonly label = input.required<string>();
  readonly amount = input<number>();
  readonly percent = input<number>();
  readonly value = input<string>();
  readonly flow = input<Flow>();
  readonly level = input<Level>('row');
  readonly share = input<number>();
  readonly bar = input<string>();

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

  readonly barWidth = computed(() => Math.min(1, Math.max(0, this.share() ?? 0)) * 100);

  readonly rowClass = computed(() => {
    const align = this.share() !== undefined ? 'items-center' : 'items-baseline';
    const base = `flex justify-between gap-4 ${align}`;
    switch (this.level()) {
      case 'total':
        return `${base} mt-1.5 border-t border-ring-card pt-2.5 pb-[7px] text-[14.5px]/[21px] font-medium`;
      case 'detail':
        return `${base} -mt-[3px] pb-1.5 pl-3.5 text-[13px]/[18px]`;
      default:
        return `${base} py-[7px] text-[14.5px]/[21px]`;
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
    const layout = this.share() !== undefined ? 'flex items-center gap-4' : '';
    return `text-right tabular-nums ${wrapping} ${tone} ${layout}`;
  });
}

let nextCardId = 0;

/**
 * A card of the Dettaglio tab: tinted icon tile, title and the section total
 * in its sign colour, then the projected rows. Stacked cards share bento corners.
 */
@Component({
  selector: 'app-ledger-card',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class:
      'block rounded-lg bg-surface shadow-xs ring-1 ring-ring-card first:rounded-t-[20px] last:rounded-b-[20px]',
  },
  template: `
    <section [attr.aria-labelledby]="id + '-title'">
      <div class="flex items-center gap-3.5 px-4 pt-4 pb-3 sm:px-6">
        <span
          aria-hidden="true"
          class="flex size-8 shrink-0 items-center justify-center rounded-[9px]"
          [class]="tile()"
        >
          <app-icon [name]="icon()" class="size-[17px]" />
        </span>
        <h3
          [id]="id + '-title'"
          class="min-w-0 flex-1 text-base/[22px] font-medium tracking-[-0.01em] text-fg"
        >
          {{ heading() }}
        </h3>
        @if (total() !== undefined) {
          <p
            class="text-base/[22px] font-medium whitespace-nowrap tabular-nums"
            [class]="totalAmount().tone ?? 'text-fg'"
          >
            {{ totalAmount().text }}
          </p>
        }
      </div>
      <div class="px-4 pb-3.5 sm:pr-6 sm:pl-[70px]">
        <ng-content />
      </div>
    </section>
  `,
})
export class LedgerCard {
  readonly heading = input.required<string>();
  readonly hue = input.required<Hue>();
  readonly icon = input.required<IconName>();
  readonly total = input<number>();
  readonly flow = input<Flow>();

  readonly id = `ledger-card-${nextCardId++}`;
  protected readonly tile = computed(() => HUE_CLASS[this.hue()].tile);
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
