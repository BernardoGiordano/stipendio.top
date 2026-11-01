import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  Directive,
  HostAttributeToken,
  inject,
  input,
  Signal,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { FormField } from '@angular/forms/signals';
import { InfoTooltip } from '../info-tooltip/info-tooltip';

let nextId = 0;

/**
 * What a control needs from the wrapper around it: its id, the id of its
 * label, whether it is required or invalid, the ids of the hint, unit and
 * errors that describe it, and the unit shown inside it.
 */
export abstract class FieldHost {
  abstract readonly id: Signal<string>;
  abstract readonly labelId: Signal<string>;
  abstract readonly required: Signal<boolean>;
  abstract readonly invalid: Signal<boolean>;
  abstract readonly describedBy: Signal<string | null>;
  abstract readonly unit: Signal<string | undefined>;
}

/** Shared state of Field and Check, read from the projected [formField] control */
@Directive()
abstract class FieldBase extends FieldHost {
  readonly label = input.required<string>();
  /** Tooltip text next to the label */
  readonly info = input<string>();
  /** Fixed id for controls that need a known one, such as ng-select's labelForId */
  readonly controlId = input<string>();
  readonly required = input(false, { transform: booleanAttribute });
  /** Keeps the label for assistive technology only, for controls in a labelled grid */
  readonly hideLabel = input(false, { transform: booleanAttribute });

  private readonly autoId = `field-${nextId++}`;
  readonly id = computed(() => this.controlId() ?? this.autoId);
  readonly labelId = computed(() => `${this.id()}-label`);

  private readonly formField = contentChild(FormField, { descendants: true });
  private readonly state = computed(() => this.formField()?.state());

  readonly invalid = computed(() => this.state()?.invalid() ?? false);
  readonly errors = computed(() => (this.invalid() ? (this.state()?.errors() ?? []) : []));
}

/** Label, control with an optional unit suffix, hint and error list, stacked */
@Component({
  selector: 'app-field',
  imports: [InfoTooltip, NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: FieldHost, useExisting: Field }],
  host: { class: 'flex min-w-0 flex-col gap-1.5' },
  template: `
    <ng-template #labelText>
      {{ label() }}
      @if (required()) {
        <span aria-hidden="true" class="ml-0.5">*</span>
      }
    </ng-template>
    <div class="flex items-center" [class.sr-only]="hideLabel()">
      @if (group()) {
        <span [id]="labelId()" class="text-[13px]/[18px] font-medium text-label">
          <ng-container [ngTemplateOutlet]="labelText" />
        </span>
      } @else {
        <label [id]="labelId()" [for]="id()" class="text-[13px]/[18px] font-medium text-label">
          <ng-container [ngTemplateOutlet]="labelText" />
        </label>
      }
      @if (info(); as text) {
        <app-info-tooltip [tooltipId]="id() + '-info'" [text]="text" />
      }
    </div>
    <div class="relative">
      <ng-content />
      @if (unit(); as text) {
        <span
          [id]="id() + '-unit'"
          class="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-[13px] whitespace-nowrap text-subtle"
          >{{ text }}</span
        >
      }
    </div>
    @if (hint(); as text) {
      <p [id]="id() + '-hint'" class="text-xs text-muted">{{ text }}</p>
    }
    @for (error of errors(); track $index) {
      <p [id]="id() + '-error-' + $index" class="text-xs text-neg" role="alert">
        {{ error.message }}
      </p>
    }
  `,
})
export class Field extends FieldBase {
  /** Help text under the control */
  readonly hint = input<string>();
  /** Unit drawn inside the control, such as "€ / anno" or "%" */
  readonly unit = input<string>();
  /** The control is a group of inputs (radios), so the label names the group instead */
  readonly group = input(false, { transform: booleanAttribute });

  readonly describedBy = computed(() => {
    const ids = this.errors().map((_, i) => `${this.id()}-error-${i}`);
    if (this.hint()) ids.unshift(`${this.id()}-hint`);
    if (this.unit()) ids.unshift(`${this.id()}-unit`);
    return ids.length ? ids.join(' ') : null;
  });
}

/** Checkbox followed by its label, with an optional note on the right */
@Component({
  selector: 'app-check',
  imports: [InfoTooltip],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: FieldHost, useExisting: Check }],
  host: { class: 'flex min-h-[30px] items-center gap-2.5' },
  template: `
    <ng-content />
    <div class="flex min-w-0 flex-1 items-center gap-3" [class.sr-only]="hideLabel()">
      <label [id]="labelId()" [for]="id()" class="flex items-center text-sm text-fg">
        {{ label() }}
        @if (info(); as text) {
          <app-info-tooltip [tooltipId]="id() + '-info'" [text]="text" />
        }
      </label>
      @if (note(); as text) {
        <span class="ml-auto text-xs whitespace-nowrap text-muted tabular-nums">{{ text }}</span>
      }
    </div>
  `,
})
export class Check extends FieldBase {
  /** Short figure next to the label, such as the yearly cost of a fund */
  readonly note = input<string>();
  readonly unit = computed(() => undefined);
  readonly describedBy = computed(() => null);
}

const INPUT_CLASS =
  'w-full min-w-0 rounded-lg bg-field px-3 text-fg tabular-nums shadow-xs ring-1 ring-ring-strong placeholder:text-faint focus:outline-2 focus:-outline-offset-1 focus:outline-focus aria-[invalid=true]:ring-danger aria-[invalid=true]:focus:outline-danger';
/** Height follows --control-h, which compact section bodies lower to 34px */
const SIZE_CLASS = {
  md: 'h-[var(--control-h,2.25rem)] text-sm',
  lg: 'h-10 text-lg font-medium tracking-[-0.02em]',
};
const CHECKBOX_CLASS = 'size-4 shrink-0 cursor-pointer accent-primary';

/**
 * Styles a native control and wires it to the surrounding Field or Check.
 * `appControl="lg"` draws the larger headline input.
 */
@Directive({
  selector: 'input[appControl], select[appControl]',
  host: {
    '[id]': 'host.id()',
    '[attr.aria-required]': 'host.required() || null',
    '[attr.aria-invalid]': 'host.invalid() || null',
    '[attr.aria-describedby]': 'host.describedBy()',
    '[class]': 'controlClass()',
  },
})
export class Control {
  protected readonly host = inject(FieldHost);
  readonly appControl = input<'' | 'lg'>('');

  private readonly checkbox =
    inject(new HostAttributeToken('type'), { optional: true }) === 'checkbox';

  protected readonly controlClass = computed(() => {
    if (this.checkbox) return CHECKBOX_CLASS;
    const unit = this.host.unit();
    const padding = !unit ? '' : unit.length <= 2 ? 'pr-8' : 'pr-[4.5rem]';
    return `${INPUT_CLASS} ${SIZE_CLASS[this.appControl() || 'md']} ${padding}`;
  });
}
