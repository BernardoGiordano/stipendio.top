import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { form, FormField, min, validate } from '@angular/forms/signals';
import { Check, Control, Field } from './field';
import { Segmented } from '../segmented/segmented';

@Component({
  imports: [Field, Check, Control, FormField],
  template: `
    <app-field label="RAL" required info="Lordo annuo" hint="Valore annuo">
      <input appControl type="number" [formField]="f.ral" />
    </app-field>
    <app-field label="Giorni">
      <input appControl type="number" [formField]="f.giorni" />
    </app-field>
    <app-check label="CIGS">
      <input appControl type="checkbox" [formField]="f.cigs" />
    </app-check>
  `,
})
class Host {
  readonly model = signal({ ral: 0, giorni: 365, cigs: false });
  readonly f = form(this.model, (path) => {
    min(path.ral, 1, { message: 'Minimo 1' });
    validate(path.ral, ({ value }) =>
      value() < 10 ? { kind: 'troppoBassa', message: 'Troppo bassa' } : null,
    );
  });
}

function render() {
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  const el: HTMLElement = fixture.nativeElement;
  const [ral, giorni, cigs] = Array.from(el.querySelectorAll('input'));
  return { fixture, el, ral, giorni, cigs };
}

describe('Field', () => {
  it('links label and control with a unique id', () => {
    const { el, ral, giorni, cigs } = render();
    const ids = [ral.id, giorni.id, cigs.id];
    expect(new Set(ids).size).toBe(3);
    for (const input of [ral, giorni, cigs]) {
      expect(el.querySelector(`label[for="${input.id}"]`)).not.toBeNull();
    }
  });

  it('gives every error its own id and lists all of them in aria-describedby', () => {
    const { el, ral } = render();
    const errors = Array.from(el.querySelectorAll('[role="alert"]'));
    expect(errors.length).toBe(2);
    expect(new Set(errors.map((e) => e.id)).size).toBe(2);

    const described = ral.getAttribute('aria-describedby')!.split(' ');
    expect(described).toEqual([`${ral.id}-hint`, ...errors.map((e) => e.id)]);
    expect(ral.getAttribute('aria-invalid')).toBe('true');
    expect(ral.getAttribute('aria-required')).toBe('true');
  });

  it('drops error state once the value is valid', () => {
    const { fixture, el, ral } = render();
    fixture.componentInstance.model.update((m) => ({ ...m, ral: 35000 }));
    fixture.detectChanges();
    expect(el.querySelectorAll('[role="alert"]').length).toBe(0);
    expect(ral.hasAttribute('aria-invalid')).toBe(false);
    expect(ral.getAttribute('aria-describedby')).toBe(`${ral.id}-hint`);
  });

  it('leaves optional fields without aria-required or aria-describedby', () => {
    const { giorni } = render();
    expect(giorni.hasAttribute('aria-required')).toBe(false);
    expect(giorni.hasAttribute('aria-describedby')).toBe(false);
  });

  it('hides the required mark from assistive technology', () => {
    const { el, ral } = render();
    const label = el.querySelector(`label[for="${ral.id}"]`)!;
    expect(label.querySelector('[aria-hidden="true"]')?.textContent).toBe('*');
  });

  it('styles checkboxes and text controls differently', () => {
    const { ral, cigs } = render();
    expect(cigs.className).toContain('accent-primary');
    expect(ral.className).toContain('ring-ring-strong');
  });
});

@Component({
  imports: [Field, Check, Control, FormField, Segmented],
  template: `
    <app-field label="RAL" unit="€ / anno">
      <input appControl="lg" type="number" [formField]="f.ral" />
    </app-field>
    <app-field label="Età figlio 1" hideLabel>
      <input appControl type="number" [formField]="f.eta" />
    </app-field>
    <app-field label="Mensilità" group>
      <app-segmented [formField]="f.mensilita" [options]="mensilita" />
    </app-field>
    <app-check label="Fondo EST" note="24,00 € / anno">
      <input appControl type="checkbox" [formField]="f.est" />
    </app-check>
  `,
})
class UnitHost {
  readonly model = signal({ ral: 35000, eta: 8, mensilita: '13', est: false });
  readonly f = form(this.model);
  readonly mensilita = ['12', '13', '14', '15'].map((m) => ({ value: m, label: m }));
}

describe('Field with units and groups', () => {
  function renderUnits() {
    const fixture = TestBed.createComponent(UnitHost);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    return { fixture, el, inputs: Array.from(el.querySelectorAll('input')) };
  }

  it('draws the unit inside the control and reads it as a description', () => {
    const { el, inputs } = renderUnits();
    const ral = inputs[0];
    const unit = el.querySelector(`#${ral.id}-unit`)!;
    expect(unit.textContent).toBe('€ / anno');
    expect(ral.getAttribute('aria-describedby')).toBe(unit.id);
    expect(ral.className).toContain('pr-[4.5rem]');
    expect(ral.className).toContain('h-10');
  });

  it('keeps a hidden label available to assistive technology', () => {
    const { el, inputs } = renderUnits();
    const label = el.querySelector<HTMLElement>(`label[for="${inputs[1].id}"]`)!;
    expect(label.textContent).toContain('Età figlio 1');
    expect(label.parentElement!.classList.contains('sr-only')).toBe(true);
  });

  it('names a radio group with the field label and moves the value', () => {
    const { fixture, el } = renderUnits();
    const group = el.querySelector('[role="radiogroup"]')!;
    const label = el.querySelector(`#${group.getAttribute('aria-labelledby')}`)!;
    expect(label.tagName).toBe('SPAN');
    expect(label.textContent).toContain('Mensilità');

    const radios = Array.from(group.querySelectorAll<HTMLInputElement>('input[type="radio"]'));
    expect(radios.map((r) => r.checked)).toEqual([false, true, false, false]);
    expect(new Set(radios.map((r) => r.name)).size).toBe(1);

    radios[2].click();
    fixture.detectChanges();
    expect(fixture.componentInstance.model().mensilita).toBe('14');
  });

  it('shows a check note next to its label', () => {
    const { el } = renderUnits();
    expect(el.querySelector('app-check')!.textContent).toContain('24,00 € / anno');
  });
});
