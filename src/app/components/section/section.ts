import { ChangeDetectionStrategy, Component, computed, input, linkedSignal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { FieldTree, FormField } from '@angular/forms/signals';
import { Icon } from '../icon/icon';
import { InfoTooltip } from '../info-tooltip/info-tooltip';

let nextId = 0;

/**
 * A form section in one of two shapes.
 *
 * A card holds the always-used fields under a mono heading; the host carries
 * the bento radius through its class.
 *
 * A row is one line of a list: a switch for sections with an enabled flag,
 * otherwise a disclosure chevron, then the title and a summary while active.
 * The body opens while the section is active, and the user can open or close
 * it by hand. A switch row forgets that choice whenever it is switched.
 */
@Component({
  selector: 'app-section',
  imports: [FormField, Icon, InfoTooltip, NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <ng-template #content><ng-content /></ng-template>
    @if (variant() === 'card') {
      <section
        [attr.aria-labelledby]="id + '-title'"
        class="rounded-[inherit] bg-surface px-4 pt-[18px] pb-5 shadow-xs ring-1 ring-ring-card sm:px-5"
      >
        <h3
          [id]="id + '-title'"
          class="font-mono text-[11px]/[18px] font-semibold tracking-widest text-faint uppercase"
        >
          {{ heading() }}
        </h3>
        <fieldset class="mt-3.5 min-w-0">
          <legend class="sr-only">{{ heading() }}</legend>
          @if (description(); as text) {
            <p class="mb-3 text-xs text-muted">{{ text }}</p>
          }
          <ng-container [ngTemplateOutlet]="content" />
        </fieldset>
      </section>
    } @else {
      <section [attr.aria-labelledby]="id + '-title'" class="border-t border-hair">
        <div class="flex min-h-[46px] items-center gap-3 py-1.5 pr-3 pl-4 sm:pr-4 sm:pl-5">
          @if (toggle(); as field) {
            <span
              class="group/switch relative inline-flex h-[22px] w-9 shrink-0 rounded-full bg-switch-off ring-1 ring-switch-ring ring-inset transition-colors motion-reduce:transition-none has-checked:bg-accent has-checked:ring-black/8 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-focus"
            >
              <input
                type="checkbox"
                role="switch"
                [id]="id + '-switch'"
                [formField]="field"
                class="absolute inset-0 size-full cursor-pointer appearance-none rounded-full focus:outline-none"
              />
              <span
                aria-hidden="true"
                class="pointer-events-none absolute top-[3px] left-[3px] size-4 rounded-full bg-white shadow-sm transition-transform duration-200 motion-reduce:transition-none group-has-checked/switch:translate-x-3.5"
              ></span>
            </span>
            <h4 [id]="id + '-title'" class="flex min-w-0 items-center text-sm font-medium text-fg">
              <label [for]="id + '-switch'" class="cursor-pointer">{{ heading() }}</label>
              <ng-container [ngTemplateOutlet]="infoTip" />
            </h4>
          } @else {
            <h4 [id]="id + '-title'" class="flex min-w-0 items-center text-sm font-medium text-fg">
              <button
                type="button"
                [attr.aria-expanded]="open()"
                [attr.aria-controls]="id + '-body'"
                (click)="userOpen.set(!open())"
                class="-my-1 -ml-1 flex cursor-pointer items-center gap-3 rounded-md py-1 pr-1 pl-1 text-left focus-visible:outline-2 focus-visible:outline-focus"
              >
                <span class="flex w-9 shrink-0 justify-center">
                  <app-icon
                    name="chevron-down"
                    class="size-5 text-subtle transition-transform duration-200 motion-reduce:transition-none"
                    [class.-rotate-90]="!open()"
                  />
                </span>
                {{ heading() }}
              </button>
              <ng-container [ngTemplateOutlet]="infoTip" />
            </h4>
          }
          <ng-template #infoTip>
            @if (info(); as text) {
              <app-info-tooltip [tooltipId]="id + '-info'" [text]="text" />
            }
          </ng-template>
          <span class="ml-auto"></span>
          @if (active() && summary(); as text) {
            <span class="text-right text-[13px] text-muted tabular-nums">{{ text }}</span>
          }
          @if (toggle() && active()) {
            <button
              type="button"
              [attr.aria-expanded]="open()"
              [attr.aria-controls]="id + '-body'"
              [attr.aria-label]="'Campi di ' + heading()"
              (click)="userOpen.set(!open())"
              class="-mr-1 flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-subtle hover:bg-sunken hover:text-fg focus-visible:outline-2 focus-visible:outline-focus"
            >
              <app-icon
                name="chevron-down"
                class="size-5 transition-transform duration-200 motion-reduce:transition-none"
                [class.rotate-180]="open()"
              />
            </button>
          }
        </div>

        <div
          [id]="id + '-body'"
          [hidden]="!open()"
          class="pr-4 pb-4 pl-4 [--control-h:2.125rem] sm:pr-5 sm:pl-[68px]"
        >
          <fieldset class="min-w-0">
            <legend class="sr-only">{{ heading() }}</legend>
            @if (description(); as text) {
              <p class="mb-3 text-xs text-muted">{{ text }}</p>
            }
            <ng-container [ngTemplateOutlet]="content" />
          </fieldset>
        </div>
      </section>
    }
  `,
})
export class Section {
  readonly heading = input.required<string>();
  readonly variant = input<'card' | 'row'>('card');
  /** Short text at the top of the body */
  readonly description = input<string>();
  /** Tooltip next to the row title */
  readonly info = input<string>();

  /** Whether the section changes the result */
  readonly active = input(false);
  /** Right-aligned figure shown while the row is active */
  readonly summary = input<string>();

  /** Enable switch at the start of the row */
  readonly toggle = input<FieldTree<boolean>>();

  readonly id = `section-${nextId++}`;

  /** Set once the user opens or closes the row by hand */
  protected readonly userOpen = linkedSignal<boolean, boolean | null>({
    source: this.active,
    computation: (_, previous) => (this.toggle() ? null : (previous?.value ?? null)),
  });

  readonly open = computed(() => {
    if (this.variant() === 'card') return true;
    const userOpen = this.userOpen();
    if (this.toggle()) return this.active() && userOpen !== false;
    return userOpen ?? this.active();
  });
}
