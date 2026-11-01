import { ChangeDetectionStrategy, Component, inject, input, model } from '@angular/core';
import { FormValueControl } from '@angular/forms/signals';
import { FieldHost } from '../field/field';

export interface SegmentedOption<T> {
  value: T;
  label: string;
}

let nextId = 0;

/**
 * A row of mutually exclusive buttons, built on native radios so arrow keys
 * move the choice. Inside a group Field it is named by the field's label.
 */
@Component({
  selector: 'app-segmented',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div
      role="radiogroup"
      [attr.aria-labelledby]="host?.labelId() ?? null"
      [attr.aria-label]="host ? null : label()"
      [attr.aria-describedby]="host?.describedBy() ?? null"
      class="flex gap-0.5 rounded-lg bg-field p-0.5 shadow-xs ring-1 ring-ring-strong"
    >
      @for (option of options(); track option.value) {
        <label class="flex-1">
          <input
            type="radio"
            class="peer sr-only"
            [name]="group"
            [checked]="option.value === value()"
            (change)="value.set(option.value)"
          />
          <span
            class="flex h-[calc(var(--control-h,2.25rem)-0.25rem)] cursor-pointer items-center justify-center rounded-md px-2 text-sm font-medium whitespace-nowrap text-muted tabular-nums transition-colors peer-checked:bg-primary peer-checked:text-on-primary peer-focus-visible:outline-2 peer-focus-visible:outline-offset-1 peer-focus-visible:outline-focus hover:text-fg peer-checked:hover:text-on-primary"
          >
            {{ option.label }}
          </span>
        </label>
      }
    </div>
  `,
})
export class Segmented<T> implements FormValueControl<T> {
  protected readonly host = inject(FieldHost, { optional: true });

  readonly value = model.required<T>();
  readonly options = input.required<readonly SegmentedOption<T>[]>();
  /** Accessible name when the control is not inside a Field */
  readonly label = input<string>();

  protected readonly group = `segmented-${nextId++}`;
}
