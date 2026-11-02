import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { Icon } from '../icon/icon';

/**
 * Copies the link to the current calculation. In the pinned tab bar of the
 * results the label hides and the icon carries the action.
 */
@Component({
  selector: 'app-share-link',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      class="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full px-3 text-sm font-medium text-muted transition-colors hover:bg-sunken hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus lg:group-data-[stuck]/bar:px-2.5"
      [title]="label()"
      (click)="share.emit()"
    >
      <app-icon [name]="copied() ? 'check-bold' : 'link'" class="size-4 shrink-0" />
      <span class="lg:group-data-[stuck]/bar:sr-only">{{ label() }}</span>
    </button>
    <span class="sr-only" aria-live="polite">
      {{ copied() ? 'Link al calcolo copiato negli appunti' : '' }}
    </span>
  `,
})
export class ShareLink {
  readonly copied = input(false);
  readonly share = output<void>();

  protected readonly label = computed(() =>
    this.copied() ? 'Copiato!' : 'Copia il link al calcolo',
  );
}
