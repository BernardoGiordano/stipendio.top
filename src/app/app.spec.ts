import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { createDefaultFormModel, RAL_ESEMPIO } from './components/form-container/form-group';
import { FormMemory } from './services/form-memory';
import { FormStateShare } from './services/form-state-share';

const KEY = 'form-state';

function render() {
  const fixture = TestBed.createComponent(App);
  fixture.detectChanges();
  const app = fixture.componentInstance;

  /** Replaces the fields the way a form edit does, with a new model object */
  const edit = (ral: number) => {
    app.formModel.update((model) => ({ ...model, ral }));
    fixture.detectChanges();
  };

  return { fixture, app, edit };
}

const savedRal = () => TestBed.inject(FormMemory).load()?.ral;
const urlParam = () => new URL(window.location.href).searchParams.get('s');

function openSharedLink(ral: number) {
  const encoded = TestBed.inject(FormStateShare).serializeFormState({
    ...createDefaultFormModel(),
    ral,
  });
  window.history.replaceState({}, '', `/?s=${encoded}`);
}

describe('App form memory', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    // jsdom has no matchMedia, which ThemeMode needs without a saved theme
    localStorage.setItem('theme', 'light');
    window.history.replaceState({}, '', '/');
    // Silences the build stamp App logs on startup
    vi.spyOn(console, 'info').mockImplementation(() => undefined);
  });

  afterEach(() => {
    window.history.replaceState({}, '', '/');
    vi.restoreAllMocks();
  });

  it('restores the saved fields on startup', () => {
    TestBed.inject(FormMemory).save({ ...createDefaultFormModel(), ral: 42000 });

    expect(render().app.formModel().ral).toBe(42000);
  });

  it('falls back to the example RAL when the saved one is empty', () => {
    TestBed.inject(FormMemory).save({ ...createDefaultFormModel(), ral: NaN });

    expect(render().app.formModel().ral).toBe(RAL_ESEMPIO);
  });

  describe('with a shared link', () => {
    beforeEach(() => TestBed.inject(FormMemory).save({ ...createDefaultFormModel(), ral: 42000 }));

    it('keeps the saved fields and the URL until the first edit', async () => {
      openSharedLink(60000);
      const { app, edit } = render();

      // Lets the startup timer mark the link as loaded
      await new Promise((resolve) => setTimeout(resolve));

      expect(app.loadedFromUrl()).toBe(true);
      expect(app.formModel().ral).toBe(60000);
      expect(savedRal()).toBe(42000);
      expect(urlParam()).not.toBeNull();

      edit(61000);

      expect(savedRal()).toBe(61000);
      expect(urlParam()).toBeNull();
    });

    it('saves the shared fields when the memory option changes', () => {
      openSharedLink(60000);
      const { app, fixture } = render();

      app.toggleRemember();
      fixture.detectChanges();

      expect(localStorage.getItem(KEY)).not.toBeNull();
      expect(savedRal()).toBe(60000);
      expect(urlParam()).toBeNull();
    });

    it('saves the shared fields again when a reset is undone', () => {
      openSharedLink(60000);
      const { app, fixture } = render();

      app.resetForm();
      fixture.detectChanges();
      app.undoReset();
      fixture.detectChanges();

      expect(app.formModel().ral).toBe(60000);
      expect(savedRal()).toBe(60000);
    });
  });

  describe('reset', () => {
    it('sets the default fields and saves them', () => {
      const { app, fixture, edit } = render();
      edit(50000);

      app.resetForm();
      fixture.detectChanges();

      // Signal forms tag array rows with a symbol, which the serialized fields leave out
      const share = TestBed.inject(FormStateShare);
      expect(share.serializeFormState(app.formModel())).toBe(
        share.serializeFormState({ ...createDefaultFormModel(), ral: RAL_ESEMPIO }),
      );
      expect(savedRal()).toBe(RAL_ESEMPIO);
    });

    it('announces the reset and restores the previous fields on undo', () => {
      const { app, fixture, edit } = render();
      edit(50000);
      app.resetForm();
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement;
      const status = el.querySelector('[role="status"]');
      expect(status?.textContent).toContain('Valori predefiniti ripristinati.');

      status?.querySelector('button')?.click();
      fixture.detectChanges();

      expect(app.formModel().ral).toBe(50000);
      expect(savedRal()).toBe(50000);
      expect(status?.textContent?.trim()).toBe('');
    });

    it('can no longer be undone after an edit', () => {
      const { app, fixture, edit } = render();
      app.resetForm();
      fixture.detectChanges();

      edit(51000);

      expect(app.canUndoReset()).toBe(false);
    });
  });
});
