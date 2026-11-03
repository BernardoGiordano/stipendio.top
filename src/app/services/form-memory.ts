import { inject, Injectable, signal } from '@angular/core';
import { StipendioFormModel } from '../components/form-container/form-group';
import { FormStateShare } from './form-state-share';

const STORAGE_KEY = 'form-state';

/**
 * Keeps the form fields across page reloads: in sessionStorage by default,
 * in localStorage while the user asks to remember them.
 */
@Injectable({ providedIn: 'root' })
export class FormMemory {
  private readonly formStateShare = inject(FormStateShare);

  readonly remember = signal(localStorage.getItem(STORAGE_KEY) !== null);

  constructor() {
    // Another tab turned the option on or off, so this one must not undo it on its next save
    window.addEventListener('storage', (event) => {
      if (event.key === STORAGE_KEY) {
        this.remember.set(event.newValue !== null);
      }
    });
  }

  /**
   * Returns the saved form model, or null if there is none or it cannot be read.
   */
  load(): StipendioFormModel | null {
    const stored = localStorage.getItem(STORAGE_KEY) ?? sessionStorage.getItem(STORAGE_KEY);
    if (stored === null) return null;

    // An empty string is a saved form with only default values
    const partial = stored ? this.formStateShare.deserializeFormState(stored) : {};
    return partial && this.formStateShare.mergeWithDefaults(partial);
  }

  /**
   * Saves the form model in the storage the option selects and removes it from the other one.
   */
  save(model: StipendioFormModel): void {
    const encoded = this.formStateShare.serializeFormState(model);
    if (this.remember()) {
      localStorage.setItem(STORAGE_KEY, encoded);
      sessionStorage.removeItem(STORAGE_KEY);
    } else {
      sessionStorage.setItem(STORAGE_KEY, encoded);
      localStorage.removeItem(STORAGE_KEY);
    }
  }
}
