import { Injectable, signal } from '@angular/core';
import {
  createDefaultFormModel,
  StipendioFormModel,
} from '../components/form-container/form-group';

type DeepPartial<T> = T extends object ? { [P in keyof T]?: DeepPartial<T[P]> } : T;

@Injectable({ providedIn: 'root' })
export class FormStateShare {
  readonly linkCopied = signal(false);

  /**
   * Serializes the form model by only including non-default values.
   * Returns a URL-safe base64 encoded string.
   */
  serializeFormState(model: StipendioFormModel): string {
    const defaults = createDefaultFormModel();
    const diff = this.getDiff(model, defaults);

    if (Object.keys(diff).length === 0) {
      return '';
    }

    const json = JSON.stringify(diff);
    return this.toUrlSafeBase64(json);
  }

  /**
   * Deserializes a URL-safe base64 encoded string back to a partial form model.
   */
  deserializeFormState(encoded: string): DeepPartial<StipendioFormModel> | null {
    if (!encoded) return null;

    try {
      const json = this.fromUrlSafeBase64(encoded);
      return JSON.parse(json) as DeepPartial<StipendioFormModel>;
    } catch {
      return null;
    }
  }

  /**
   * Returns the current URL with the form state encoded as the "s" query parameter.
   */
  getShareableUrl(model: StipendioFormModel): string {
    const encoded = this.serializeFormState(model);
    const url = new URL(window.location.href);

    // Remove existing "s" param
    url.searchParams.delete('s');

    if (encoded) {
      url.searchParams.set('s', encoded);
    }

    return url.toString();
  }

  /**
   * Reads the "s" query parameter from the current URL.
   */
  getStateFromUrl(): DeepPartial<StipendioFormModel> | null {
    const url = new URL(window.location.href);
    const encoded = url.searchParams.get('s');

    if (!encoded) return null;

    return this.deserializeFormState(encoded);
  }

  /**
   * Merges a partial form model into the default form model.
   */
  mergeWithDefaults(partial: DeepPartial<StipendioFormModel>): StipendioFormModel {
    const defaults = createDefaultFormModel();
    return this.deepMerge(defaults, partial) as StipendioFormModel;
  }

  /**
   * Copies the shareable URL to clipboard and sets linkCopied signal.
   */
  async copyToClipboard(model: StipendioFormModel): Promise<void> {
    const url = this.getShareableUrl(model);
    await navigator.clipboard.writeText(url);
    this.linkCopied.set(true);

    // Reset after 2 seconds
    setTimeout(() => this.linkCopied.set(false), 2000);
  }

  /**
   * Clears the "s" parameter from the URL without reloading.
   */
  clearUrlState(): void {
    const url = new URL(window.location.href);
    if (url.searchParams.has('s')) {
      url.searchParams.delete('s');
      window.history.replaceState({}, '', url.toString());
    }
  }

  // ==========================================================================
  // Private helpers
  // ==========================================================================

  private getDiff(current: unknown, defaults: unknown): Record<string, unknown> {
    if (typeof current !== 'object' || current === null) {
      return current !== defaults ? { value: current } : {};
    }

    if (Array.isArray(current)) {
      const defaultArray = Array.isArray(defaults) ? defaults : [];
      // For arrays, include if different length or different content
      if (
        current.length !== defaultArray.length ||
        JSON.stringify(current) !== JSON.stringify(defaultArray)
      ) {
        return { array: current };
      }
      return {};
    }

    const result: Record<string, unknown> = {};
    const currentObj = current as Record<string, unknown>;
    const defaultObj = (defaults ?? {}) as Record<string, unknown>;

    for (const key of Object.keys(currentObj)) {
      const currentVal = currentObj[key];
      const defaultVal = defaultObj[key];

      if (typeof currentVal === 'object' && currentVal !== null && !Array.isArray(currentVal)) {
        const nestedDiff = this.getDiff(currentVal, defaultVal);
        if (Object.keys(nestedDiff).length > 0) {
          result[key] = nestedDiff;
        }
      } else if (Array.isArray(currentVal)) {
        const defaultArray = Array.isArray(defaultVal) ? defaultVal : [];
        if (
          currentVal.length !== defaultArray.length ||
          JSON.stringify(currentVal) !== JSON.stringify(defaultArray)
        ) {
          result[key] = currentVal;
        }
      } else if (currentVal !== defaultVal) {
        result[key] = currentVal;
      }
    }

    return result;
  }

  private deepMerge(target: unknown, source: unknown): unknown {
    if (typeof source !== 'object' || source === null) {
      return source;
    }

    if (Array.isArray(source)) {
      return source;
    }

    if (typeof target !== 'object' || target === null) {
      return source;
    }

    const result = { ...(target as Record<string, unknown>) };
    const sourceObj = source as Record<string, unknown>;

    for (const key of Object.keys(sourceObj)) {
      const sourceVal = sourceObj[key];
      const targetVal = result[key];

      if (typeof sourceVal === 'object' && sourceVal !== null && !Array.isArray(sourceVal)) {
        result[key] = this.deepMerge(targetVal, sourceVal);
      } else {
        result[key] = sourceVal;
      }
    }

    return result;
  }

  private toUrlSafeBase64(str: string): string {
    // Encode to UTF-8 bytes, then to base64
    const bytes = new TextEncoder().encode(str);
    const binary = Array.from(bytes)
      .map((b) => String.fromCharCode(b))
      .join('');
    const base64 = btoa(binary);

    // Make URL-safe: replace + with -, / with _, remove padding =
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  private fromUrlSafeBase64(str: string): string {
    // Restore standard base64
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');

    // Add padding if needed
    const padding = (4 - (base64.length % 4)) % 4;
    base64 += '='.repeat(padding);

    // Decode from base64 to UTF-8
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder().decode(bytes);
  }
}
