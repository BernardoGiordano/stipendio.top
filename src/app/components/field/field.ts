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
import { FormField } from '@angular/forms/signals';
import { InfoTooltip } from '../info-tooltip/info-tooltip';

let nextId = 0;

/**
 * What a control needs from the wrapper around it: its id, whether it is
 * required or invalid, and the ids of the hint and errors that describe it.
 */
export abstract class FieldHost {
  abstract readonly id: Signal<string>;
  abstract readonly required: Signal<boolean>;
  abstract readonly invalid: Signal<boolean>;
  abstract readonly describedBy: Signal<string | null>;
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

  private readonly autoId = `field-${nextId++}`;
  readonly id = computed(() => this.controlId() ?? this.autoId);

  private readonly formField = contentChild(FormField, { descendants: true });
  private readonly state = computed(() => this.formField()?.state());

  readonly invalid = computed(() => this.state()?.invalid() ?? false);
  readonly errors = computed(() => (this.invalid() ? (this.state()?.errors() ?? []) : []));
}

/** Label, control, hint and error list, stacked */
@Component({
  selector: 'app-field',
  imports: [InfoTooltip],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: FieldHost, useExisting: Field }],
  host: { class: 'flex flex-col gap-1' },
  template: `
    <label [for]="id()" class="flex items-center text-sm text-muted">
      {{ label() }}
      @if (required()) {
        <span aria-hidden="true" class="ml-0.5">*</span>
      }
      @if (info(); as text) {
        <app-info-tooltip [tooltipId]="id() + '-info'" [text]="text" />
      }
    </label>
    <ng-content />
    @if (hint(); as text) {
      <p [id]="id() + '-hint'" class="text-xs text-subtle">{{ text }}</p>
    }
    @for (error of errors(); track $index) {
      <p [id]="id() + '-error-' + $index" class="mt-1 text-xs text-neg" role="alert">
        {{ error.message }}
      </p>
    }
  `,
})
export class Field extends FieldBase {
  /** Help text under the control */
  readonly hint = input<string>();

  readonly describedBy = computed(() => {
    const ids = this.errors().map((_, i) => `${this.id()}-error-${i}`);
    if (this.hint()) ids.unshift(`${this.id()}-hint`);
    return ids.length ? ids.join(' ') : null;
  });
}

/** Checkbox followed by its label */
@Component({
  selector: 'app-check',
  imports: [InfoTooltip],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: FieldHost, useExisting: Check }],
  host: { class: 'flex items-center gap-2' },
  template: `
    <ng-content />
    <label [for]="id()" class="flex items-center text-sm text-muted">
      {{ label() }}
      @if (info(); as text) {
        <app-info-tooltip [tooltipId]="id() + '-info'" [text]="text" />
      }
    </label>
  `,
})
export class Check extends FieldBase {
  readonly describedBy = computed(() => null);
}

const INPUT_CLASS =
  'h-[42px] rounded-lg border border-transparent bg-field px-3 py-2 text-fg shadow-xs ring-1 ring-ring-strong placeholder:text-faint focus:outline-2 focus:-outline-offset-1 focus:outline-focus aria-[invalid=true]:ring-danger aria-[invalid=true]:focus:outline-danger';
const CHECKBOX_CLASS = 'size-4 shrink-0 cursor-pointer accent-primary';

/** Styles a native control and wires it to the surrounding Field or Check */
@Directive({
  selector: 'input[appControl], select[appControl]',
  host: {
    '[id]': 'host.id()',
    '[attr.aria-required]': 'host.required() || null',
    '[attr.aria-invalid]': 'host.invalid() || null',
    '[attr.aria-describedby]': 'host.describedBy()',
    '[class]': 'controlClass',
  },
})
export class Control {
  protected readonly host = inject(FieldHost);
  protected readonly controlClass =
    inject(new HostAttributeToken('type'), { optional: true }) === 'checkbox'
      ? CHECKBOX_CLASS
      : INPUT_CLASS;
}
