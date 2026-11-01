import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { form } from '@angular/forms/signals';
import { Section } from './section';

@Component({
  imports: [Section],
  template: `
    <app-section heading="Base"><p>base</p></app-section>
    <app-section
      heading="Coniuge"
      collapsible
      [active]="model().enabled"
      [toggle]="f.enabled"
      toggleLabel="Ho un coniuge a carico"
    >
      <p>campi</p>
    </app-section>
  `,
})
class Host {
  readonly model = signal({ enabled: false });
  readonly f = form(this.model);
}

function render() {
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  const el: HTMLElement = fixture.nativeElement;
  const [base, coniuge] = Array.from(el.querySelectorAll('section'));
  return { fixture, base, coniuge };
}

const body = (section: Element) => section.querySelector<HTMLElement>('[id$="-body"]')!;

describe('Section', () => {
  it('keeps plain sections open with a static heading', () => {
    const { base } = render();
    expect(base.querySelector('h4 button')).toBeNull();
    expect(body(base).hidden).toBe(false);
    expect(base.getAttribute('aria-labelledby')).toBe(base.querySelector('h4')!.id);
  });

  it('starts an inactive collapsible section closed and opens it on click', () => {
    const { fixture, coniuge } = render();
    const button = coniuge.querySelector('h4 button')!;
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(button.getAttribute('aria-controls')).toBe(body(coniuge).id);
    expect(body(coniuge).hidden).toBe(true);

    (button as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(button.getAttribute('aria-expanded')).toBe('true');
    expect(body(coniuge).hidden).toBe(false);
  });

  it('marks the section active through its switch', () => {
    const { fixture, coniuge } = render();
    expect(coniuge.hasAttribute('data-inactive')).toBe(true);
    expect(coniuge.textContent).not.toContain('attivo');

    const toggle = coniuge.querySelector<HTMLInputElement>('input[role="switch"]')!;
    expect(toggle.labels?.[0].textContent).toContain('Ho un coniuge a carico');
    toggle.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.model().enabled).toBe(true);
    expect(coniuge.hasAttribute('data-inactive')).toBe(false);
    expect(coniuge.querySelector('h4')!.textContent).toContain('attivo');
  });

  it('opens a collapsible section that is already active', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.model.set({ enabled: true });
    fixture.detectChanges();
    const coniuge = fixture.nativeElement.querySelectorAll('section')[1];
    expect(body(coniuge).hidden).toBe(false);
  });
});
