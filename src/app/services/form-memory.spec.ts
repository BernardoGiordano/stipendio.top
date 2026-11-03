import { TestBed } from '@angular/core/testing';
import { createDefaultFormModel } from '../components/form-container/form-group';
import { FormMemory } from './form-memory';

const KEY = 'form-state';

describe('FormMemory', () => {
  const model = { ...createDefaultFormModel(), ral: 42000 };

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('uses only sessionStorage by default', () => {
    const memory = TestBed.inject(FormMemory);
    memory.save(model);

    expect(memory.remember()).toBe(false);
    expect(sessionStorage.getItem(KEY)).not.toBeNull();
    expect(localStorage.getItem(KEY)).toBeNull();
    expect(memory.load()?.ral).toBe(42000);
  });

  it('moves the fields to localStorage while remembering', () => {
    const memory = TestBed.inject(FormMemory);
    memory.save(model);
    memory.remember.set(true);
    memory.save(model);

    expect(localStorage.getItem(KEY)).not.toBeNull();
    expect(sessionStorage.getItem(KEY)).toBeNull();
    expect(memory.load()?.ral).toBe(42000);
  });

  it('turns the option on from what localStorage holds', () => {
    localStorage.setItem(KEY, '');

    expect(TestBed.inject(FormMemory).remember()).toBe(true);
  });

  it('wipes only its own key from localStorage when the option is turned off', () => {
    localStorage.setItem('theme', 'dark');
    const memory = TestBed.inject(FormMemory);
    memory.remember.set(true);
    memory.save(model);
    memory.remember.set(false);
    memory.save(model);

    expect(localStorage.getItem(KEY)).toBeNull();
    expect(localStorage.getItem('theme')).toBe('dark');
    expect(memory.load()?.ral).toBe(42000);
  });

  it('follows another tab turning the option off', () => {
    const memory = TestBed.inject(FormMemory);
    memory.remember.set(true);
    window.dispatchEvent(new StorageEvent('storage', { key: KEY, newValue: null }));

    expect(memory.remember()).toBe(false);
  });

  it('keeps a saved form with only default values', () => {
    const memory = TestBed.inject(FormMemory);
    memory.save(createDefaultFormModel());

    expect(memory.load()?.ral).toBe(0);
  });

  it('restores an empty number field as NaN', () => {
    const memory = TestBed.inject(FormMemory);
    memory.save({
      ...createDefaultFormModel(),
      ral: NaN,
      figli: [{ eta: NaN, disabile: false, percentualeCarico: 100, mesiCarico: 12 }],
    });

    expect(memory.load()?.ral).toBeNaN();
    expect(memory.load()?.figli[0].eta).toBeNaN();
  });

  it('discards a value from another version, keeping the option on', () => {
    localStorage.setItem(KEY, 'v0:eyJyYWwiOjQyMDAwfQ');
    const memory = TestBed.inject(FormMemory);

    expect(memory.load()).toBeNull();
    expect(memory.remember()).toBe(true);
  });

  it('discards a value with no version', () => {
    sessionStorage.setItem(KEY, 'eyJyYWwiOjQyMDAwfQ');

    expect(TestBed.inject(FormMemory).load()).toBeNull();
  });

  it('ignores a value it cannot read', () => {
    sessionStorage.setItem(KEY, 'v1:%%%');

    expect(TestBed.inject(FormMemory).load()).toBeNull();
  });
});
