import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { HUE, HUE_CLASS, Hue } from '../../services/chart-palette';
import { formatCurrency, formatPercent } from '../../utils/intl';
import { Icon, IconName } from '../icon/icon';
import { AnimatedAmount } from '../ledger/ledger';
import { RipartizioneRal } from './breakdown';

export interface Kpi {
  label: string;
  value: number;
  note: string;
}

export interface Stat {
  label: string;
  value: string;
  hue: Hue;
  icon: IconName;
}

/**
 * The results tray: gradient frame around a white card with the headline
 * figures, where the money paid into the busta goes, and a strip of side
 * figures. The first KPI is the large, animated one.
 */
@Component({
  selector: 'app-tray',
  imports: [AnimatedAmount, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class:
      'block rounded-[18px] bg-linear-145 from-g1 from-28% via-g2 via-70% to-g3 p-1.5 ring-1 ring-black/5 ring-inset sm:rounded-[26px] sm:p-2 dark:ring-white/10',
  },
  template: `
    <div
      class="overflow-hidden rounded-[13px] bg-surface shadow-2xl ring-1 ring-black/5 sm:rounded-[19px] dark:ring-white/10"
    >
      <!-- Headline figures; the negative margins hide the hairlines on the outer edges -->
      <dl class="-mt-px -ml-px flex flex-wrap tabular-nums">
        @for (cell of kpi(); track cell.label; let first = $first) {
          <div
            class="border-t border-l border-hair px-4 pt-4 pb-3.5 sm:px-6 sm:pt-6 sm:pb-5"
            [class]="first ? 'flex-[1.4_1_230px]' : 'flex-[1_1_170px]'"
          >
            <dt
              class="font-mono text-[11px]/[18px] font-semibold tracking-widest text-faint uppercase"
            >
              {{ cell.label }}
            </dt>
            @if (first) {
              <dd
                class="mt-1 text-[36px]/none font-medium tracking-[-0.045em] text-fg sm:mt-1.5 sm:text-[46px]"
              >
                <app-amount [value]="cell.value" />
              </dd>
            } @else {
              <dd class="mt-2 text-[28px]/[1.1] font-medium tracking-[-0.035em] text-fg">
                {{ euro(cell.value) }}
              </dd>
            }
            <dd class="mt-2 text-sm text-muted">{{ cell.note }}</dd>
          </div>
        }
      </dl>

      <div class="border-t border-hair px-4 pt-4 pb-5 sm:px-[26px] sm:pt-5 sm:pb-[22px]">
        <p class="flex flex-wrap justify-between gap-x-4 gap-y-1 text-sm text-label tabular-nums">
          <span>Dove vanno i {{ base() }} {{ oggetto() }}</span>
          <span
            >aliquota effettiva
            <strong class="font-medium text-fg">{{ percent(aliquota()) }}</strong></span
          >
        </p>
        <div aria-hidden="true" class="mt-3 flex h-3.5 gap-[3px] overflow-hidden rounded-full">
          @for (quota of quote(); track quota.id) {
            <div [style.flex]="quota.quota + ' 1 0px'" [style.background-color]="quota.bar"></div>
          }
        </div>
        <ul
          [attr.aria-label]="'Ripartizione ' + oggetto()"
          class="mt-3.5 flex flex-wrap gap-2 text-[13px]/5 tabular-nums"
        >
          @for (quota of quote(); track quota.id) {
            <li class="flex items-center gap-1.5 rounded-full px-2.5 py-1" [class]="quota.pill">
              <span
                aria-hidden="true"
                class="size-2 rounded-full"
                [style.background-color]="quota.bar"
              ></span>
              {{ quota.label }}
              <strong class="font-semibold">{{ euro(quota.importo) }}</strong>
              {{ percent(quota.quota, 1) }}
            </li>
          }
        </ul>
      </div>

      @if (stats().length) {
        <dl class="-mt-px -ml-px flex flex-wrap tabular-nums">
          @for (stat of stats(); track stat.label) {
            <!-- The tile sits in the dt so the row holds only dt and dd -->
            <div
              class="relative flex-[1_1_180px] border-t border-l border-hair py-3.5 pr-4 pl-[60px] sm:py-4 sm:pr-6 sm:pl-[68px]"
            >
              <dt class="text-[12.5px] text-muted">
                <span
                  aria-hidden="true"
                  class="absolute top-1/2 left-4 flex size-8 -translate-y-1/2 items-center justify-center rounded-[9px] sm:left-6"
                  [class]="tile(stat.hue)"
                >
                  <app-icon [name]="stat.icon" class="size-[17px]" />
                </span>
                {{ stat.label }}
              </dt>
              <dd class="mt-0.5 text-base font-medium" [class]="ink(stat.hue)">
                {{ stat.value }}
              </dd>
            </div>
          }
        </dl>
      }
    </div>
  `,
})
export class Tray {
  readonly kpi = input.required<readonly Kpi[]>();
  readonly ripartizione = input.required<RipartizioneRal>();
  readonly aliquota = input.required<number>();
  /** What the base is made of, after "Dove vanno i … €" */
  readonly oggetto = input('di RAL');
  readonly stats = input<readonly Stat[]>([]);

  protected readonly euro = (value: number) => formatCurrency(value);
  protected readonly percent = formatPercent;
  protected readonly tile = (hue: Hue) => HUE_CLASS[hue].tile;
  protected readonly ink = (hue: Hue) => HUE_CLASS[hue].ink;

  protected readonly base = computed(() => formatCurrency(this.ripartizione().base, 0));
  protected readonly quote = computed(() =>
    this.ripartizione().quote.map((quota) => ({
      ...quota,
      bar: HUE[quota.hue].bar,
      pill: HUE_CLASS[quota.hue].tile,
    })),
  );
}
