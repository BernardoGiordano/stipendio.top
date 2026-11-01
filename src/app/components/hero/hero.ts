import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { OutputCalcoloStipendio } from '../../../calculator/types';
import { DisplayMode } from '../../services/display-mode';
import { formatCurrency } from '../../utils/intl';
import { Icon } from '../icon/icon';

/** Gradient panel under the header that leads with the monthly result */
@Component({
  selector: 'app-hero',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block relative' },
  template: `
    <div
      aria-hidden="true"
      class="absolute inset-2 bottom-0 rounded-4xl bg-linear-115 from-g1 from-28% via-g2 via-70% to-g3 ring-1 ring-ring ring-inset sm:bg-linear-145"
    ></div>
    <section
      aria-labelledby="hero-title"
      class="relative mx-auto max-w-7xl px-6 py-12 sm:py-16 lg:px-10"
    >
      <p
        class="inline-flex rounded-full bg-tray px-3 py-1 text-sm font-medium text-fg shadow-glow ring-1 ring-ring ring-inset"
      >
        Aggiornato alla legge di bilancio 2026
      </p>
      <h2
        id="hero-title"
        class="mt-8 font-mono text-xs/5 font-semibold tracking-widest text-fg uppercase"
      >
        {{ eyebrow() }}
      </h2>
      <p
        class="mt-2 text-5xl/none font-medium tracking-tighter text-fg tabular-nums sm:text-7xl/none"
      >
        {{ headline() }}
      </p>
      <p class="mt-6 max-w-lg text-lg/7 text-fg">
        @if (result()) {
          Il netto in busta, i contributi e le tasse, voce per voce. Gratuito e open source.
        } @else {
          Inserisci la RAL per vedere il netto in busta, i contributi e le tasse.
        }
      </p>
      <div class="mt-8 flex flex-wrap items-center gap-3">
        <button
          type="button"
          class="inline-flex cursor-pointer items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-on-primary shadow-md transition-colors hover:bg-primary/85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          (click)="share.emit()"
        >
          <app-icon [name]="linkCopied() ? 'check-bold' : 'link'" class="size-4" />
          {{ linkCopied() ? 'Copiato!' : 'Copia link' }}
        </button>
        @if (result() && !isBorsa()) {
          <button
            type="button"
            class="inline-flex cursor-pointer items-center gap-2 rounded-full bg-tray px-4 py-2 text-sm font-medium text-fg shadow-glow ring-1 ring-ring ring-inset transition-colors hover:bg-surface/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            (click)="showFlow.emit()"
          >
            Vedi il flusso
            <app-icon name="arrow-right" class="size-4" />
          </button>
        }
        @if (loadedFromUrl()) {
          <p class="text-sm font-medium text-fg">Configurazione caricata da link condiviso.</p>
        }
      </div>
    </section>
  `,
})
export class Hero {
  private readonly displayMode = inject(DisplayMode);

  readonly result = input<OutputCalcoloStipendio | null>(null);
  readonly isBorsa = input(false, { transform: booleanAttribute });
  readonly loadedFromUrl = input(false, { transform: booleanAttribute });
  readonly linkCopied = input(false, { transform: booleanAttribute });

  readonly share = output();
  readonly showFlow = output();

  private readonly percepito = computed(() => !this.isBorsa() && this.displayMode.isPercepito());

  readonly eyebrow = computed(() => {
    const r = this.result();
    const label = this.percepito() ? 'Percepito mensile' : 'Netto mensile';
    if (!r) return label;
    return `${label} · ${this.isBorsa() ? 'Borsa' : 'RAL'} ${formatCurrency(r.ral, 0)}`;
  });

  readonly headline = computed(() => {
    const r = this.result();
    if (!r) return '– €';
    return formatCurrency(this.percepito() ? r.nettoMensilePercepito : r.nettoMensile);
  });
}
