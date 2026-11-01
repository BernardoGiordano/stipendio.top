import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { form } from '@angular/forms/signals';
import { Section } from './section';

@Component({
  imports: [Section],
  template: `
    <app-section heading="Base"><p>base</p></app-section>
    <app-section variant="row" heading="Figli" [active]="figli()" summary="1 figlio">
      <p>figli</p>
    </app-section>
    <app-section
      variant="row"
      heading="Coniuge a carico"
      [active]="model().enabled"
      [toggle]="f.enabled"
      summary="detrazione 0,00 €"
    >
      <p>campi</p>
    </app-section>
  `,
})
class Host {
  readonly figli = signal(false);
  readonly model = signal({ enabled: false });
  readonly f = form(this.model);
}

function render(setup?: (host: Host) => void) {
  const fixture = TestBed.createComponent(Host);
  setup?.(fixture.componentInstance);
  fixture.detectChanges();
  const el: HTMLElement = fixture.nativeElement;
  const [base, figli, coniuge] = Array.from(el.querySelectorAll('section'));
  return { fixture, host: fixture.componentInstance, base, figli, coniuge };
}

const body = (section: Element) => section.querySelector<HTMLElement>('[id$="-body"]');
const disclosure = (section: Element) =>
  section.querySelector<HTMLButtonElement>('button[aria-expanded]');

describe('Section', () => {
  it('shows a card with a static heading and its fields', () => {
    const { base } = render();
    const heading = base.querySelector('h3')!;
    expect(base.getAttribute('aria-labelledby')).toBe(heading.id);
    expect(disclosure(base)).toBeNull();
    expect(base.textContent).toContain('base');
  });

  it('opens a chevron row on click and keeps it open while inactive', () => {
    const { fixture, figli } = render();
    const button = disclosure(figli)!;
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(button.getAttribute('aria-controls')).toBe(body(figli)!.id);
    expect(body(figli)!.hidden).toBe(true);
    expect(figli.textContent).not.toContain('1 figlio');

    button.click();
    fixture.detectChanges();
    expect(button.getAttribute('aria-expanded')).toBe('true');
    expect(body(figli)!.hidden).toBe(false);
  });

  it('opens an active chevron row and shows its summary', () => {
    const { figli } = render((host) => host.figli.set(true));
    expect(body(figli)!.hidden).toBe(false);
    expect(figli.textContent).toContain('1 figlio');
  });

  it('labels the switch with the row title and opens the body when switched on', () => {
    const { fixture, host, coniuge } = render();
    const toggle = coniuge.querySelector<HTMLInputElement>('input[role="switch"]')!;
    expect(toggle.labels?.[0].textContent).toContain('Coniuge a carico');
    expect(body(coniuge)!.hidden).toBe(true);
    expect(disclosure(coniuge)).toBeNull();

    toggle.click();
    fixture.detectChanges();
    expect(host.model().enabled).toBe(true);
    expect(body(coniuge)!.hidden).toBe(false);
    expect(coniuge.textContent).toContain('detrazione 0,00 €');
  });

  it('lets the user fold an active switch row until it is switched again', () => {
    const { fixture, coniuge } = render((host) => host.model.set({ enabled: true }));
    const toggle = coniuge.querySelector<HTMLInputElement>('input[role="switch"]')!;
    const fold = disclosure(coniuge)!;
    expect(fold.getAttribute('aria-expanded')).toBe('true');

    fold.click();
    fixture.detectChanges();
    expect(body(coniuge)!.hidden).toBe(true);

    toggle.click();
    fixture.detectChanges();
    toggle.click();
    fixture.detectChanges();
    expect(body(coniuge)!.hidden).toBe(false);
  });
});
