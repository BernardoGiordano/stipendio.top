import { computed, Injectable, signal } from '@angular/core';

type DisplayModeType = 'netto' | 'percepito';

@Injectable({
  providedIn: 'root',
})
export class DisplayMode {
  readonly mode = signal<DisplayModeType>('percepito');

  readonly isPercepito = computed(() => this.mode() === 'percepito');
  readonly isNetto = computed(() => this.mode() === 'netto');

  setMode(mode: DisplayModeType): void {
    this.mode.set(mode);
  }
}
