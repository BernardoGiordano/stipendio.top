import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  signal,
} from '@angular/core';
import { FieldTree, FormField } from '@angular/forms/signals';
import { InfoTooltip } from '../info-tooltip/info-tooltip';

let nextId = 0;

/**
 * A form section card: heading, optional description, optional enable switch
 * and the projected fields. Collapsible sections start closed unless active,
 * and show an "attivo" badge while they change the result.
 */
@Component({
  selector: 'app-section',
  imports: [FormField, InfoTooltip],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <section
      [attr.aria-labelledby]="id + '-title'"
      [attr.data-inactive]="active() === false || null"
      class="rounded-xl bg-surface shadow-xs ring-1 ring-ring transition-colors duration-200 data-inactive:bg-page data-inactive:shadow-none"
    >
      @if (collapsible()) {
        <h4>
          <button
            type="button"
            [id]="id + '-title'"
            [attr.aria-expanded]="open()"
            [attr.aria-controls]="id + '-body'"
            (click)="userOpen.set(!open())"
            class="flex w-full cursor-pointer items-center gap-3 rounded-xl p-5 text-left focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus"
          >
            <span class="font-mono text-xs/5 font-semibold tracking-widest text-muted uppercase">
              {{ heading() }}
            </span>
            @if (active()) {
              <span
                class="rounded-full bg-sunken px-2 py-0.5 text-xs font-medium text-fg ring-1 ring-ring ring-inset"
              >
                attivo
              </span>
            }
            <svg
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
              class="ml-auto size-5 shrink-0 text-subtle transition-transform duration-200"
              [class.rotate-180]="open()"
            >
              <path
                fill-rule="evenodd"
                d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
                clip-rule="evenodd"
              />
            </svg>
          </button>
        </h4>
      } @else {
        <h4
          [id]="id + '-title'"
          class="px-5 pt-5 font-mono text-xs/5 font-semibold tracking-widest text-muted uppercase"
        >
          {{ heading() }}
        </h4>
      }

      <div [id]="id + '-body'" [hidden]="!open()" class="px-5 pb-5" [class.pt-4]="!collapsible()">
        <fieldset class="min-w-0">
          <legend class="sr-only">{{ heading() }}</legend>

          @if (description(); as text) {
            <p class="mb-4 text-xs text-subtle">{{ text }}</p>
          }

          @if (toggle(); as field) {
            <div class="mb-4 flex items-center">
              <label class="group flex cursor-pointer items-center gap-3">
                <span
                  class="relative inline-flex h-5 w-9 shrink-0 rounded-full bg-faint transition-colors group-has-checked:bg-primary has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-focus"
                >
                  <input
                    type="checkbox"
                    role="switch"
                    [formField]="field"
                    class="absolute inset-0 size-full cursor-pointer appearance-none rounded-full focus:outline-none"
                  />
                  <span
                    aria-hidden="true"
                    class="pointer-events-none absolute top-0.5 left-0.5 size-4 rounded-full bg-surface shadow-sm transition-transform duration-200 group-has-checked:translate-x-4"
                  ></span>
                </span>
                <span class="text-sm font-medium text-title">{{ toggleLabel() }}</span>
              </label>
              @if (toggleInfo(); as text) {
                <app-info-tooltip [tooltipId]="id + '-toggle-info'" [text]="text" />
              }
            </div>
          }

          <ng-content />
        </fieldset>
      </div>
    </section>
  `,
})
export class Section {
  readonly heading = input.required<string>();
  readonly description = input<string>();

  /** Whether the section changes the result; undefined for sections that are always used */
  readonly active = input<boolean>();
  readonly collapsible = input(false, { transform: booleanAttribute });

  /** Enable switch shown above the fields */
  readonly toggle = input<FieldTree<boolean>>();
  readonly toggleLabel = input('');
  readonly toggleInfo = input<string>();

  readonly id = `section-${nextId++}`;

  /** Set once the user opens or closes the section by hand */
  protected readonly userOpen = signal<boolean | null>(null);
  readonly open = computed(
    () => this.userOpen() ?? (!this.collapsible() || this.active() === true),
  );
}
