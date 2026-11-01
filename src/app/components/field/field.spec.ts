import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { form, FormField, min, validate } from '@angular/forms/signals';
import { Check, Control, Field } from './field';

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
