import { inject, Injectable, signal } from '@angular/core';
import { StipendioFormModel } from '../components/form-container/form-group';
import { FormStateShare } from './form-state-share';

const STORAGE_KEY = 'form-state';
/**
 * Prefix of the saved value. Increase it when a field of StipendioFormModel is renamed or changes
 * type: new fields are filled in by mergeWithDefaults, but these would be copied as they are.
 */
const STORAGE_VERSION = 'v1:';

/**
 * Keeps the form fields across page reloads: in sessionStorage by default,
 * in localStorage while the user asks to remember them.
 *
 * With the option on, all tabs write to the same value and the last one to save wins.
 */
@Injectable({ providedIn: 'root' })
export class FormMemory {
  private readonly formStateShare = inject(FormStateShare);

  /** There is no saved flag: the option is on while the key exists in localStorage */
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
   * Returns the saved form model, or null if there is none, it comes from another
   * version of the model or it cannot be read.
   */
  load(): StipendioFormModel | null {
    const stored = localStorage.getItem(STORAGE_KEY) ?? sessionStorage.getItem(STORAGE_KEY);
    if (!stored?.startsWith(STORAGE_VERSION)) return null;

    // An empty value is a saved form with only default values
    const encoded = stored.slice(STORAGE_VERSION.length);
    const partial = encoded ? this.formStateShare.deserializeFormState(encoded) : {};
    if (!partial) return null;

    // The app loads this value on startup, so a shape that fails to merge would break every reload
    try {
      return this.formStateShare.mergeWithDefaults(partial);
    } catch {
      return null;
    }
  }

  /**
   * Saves the form model in the storage the option selects and removes it from the other one.
   */
  save(model: StipendioFormModel): void {
    const encoded = STORAGE_VERSION + this.formStateShare.serializeFormState(model);
    if (this.remember()) {
      localStorage.setItem(STORAGE_KEY, encoded);
      sessionStorage.removeItem(STORAGE_KEY);
    } else {
      sessionStorage.setItem(STORAGE_KEY, encoded);
      localStorage.removeItem(STORAGE_KEY);
    }
  }
}
