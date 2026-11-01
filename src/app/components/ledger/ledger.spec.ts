import { TestBed } from '@angular/core/testing';
import { AnimatedAmount, Flow, LedgerRow, LedgerVoce, Level } from './ledger';
import { formatCurrency, formatPercent } from '../../utils/intl';

function render(inputs: LedgerVoce = { label: 'Importo' }) {
  const fixture = TestBed.createComponent(LedgerRow);
  for (const [name, value] of Object.entries(inputs)) {
    fixture.componentRef.setInput(name, value);
  }
  fixture.detectChanges();
  const row: HTMLElement = fixture.nativeElement;
  return { fixture, row, value: row.querySelector('dd')! };
}

describe('LedgerRow', () => {
  it.each<Flow>(['in', 'out'])('keeps zero unsigned and neutral for %s', (flow) => {
    const { value } = render({ label: 'Bonus', amount: 0, flow });
    expect(value.textContent!.trim()).toBe(formatCurrency(0));
    expect(value.classList.contains('text-fg')).toBe(true);
    expect(value.className).not.toMatch(/text-(pos|neg)/);
  });

  it.each<[Flow, string, string]>([
    ['in', '+', 'text-pos'],
    ['out', '−', 'text-neg'],
  ])('uses the sign and tone for %s', (flow, sign, tone) => {
    const { fixture, value } = render({ label: 'Importo', amount: 1993.15, flow });
    expect(value.textContent!.trim()).toBe(`${sign} ${formatCurrency(1993.15)}`);
    expect(value.classList.contains(tone)).toBe(true);

    fixture.componentRef.setInput('amount', 0);
    fixture.detectChanges();
    expect(value.textContent!.trim()).toBe(formatCurrency(0));
    expect(value.classList.contains(tone)).toBe(false);
  });

  it('formats percentages without a cash-flow sign or tone', () => {
    const { value } = render({ label: 'Aliquota', percent: 0.23, flow: 'out' });
    expect(value.textContent!.trim()).toBe(formatPercent(0.23));
    expect(value.className).not.toMatch(/text-(pos|neg)/);
  });

  it('allows text values to wrap without currency formatting', () => {
    const { value } = render({ label: 'IRPEF', value: 'Esente', flow: 'in' });
    expect(value.textContent!.trim()).toBe('Esente');
    expect(value.classList.contains('whitespace-nowrap')).toBe(false);
    expect(value.className).not.toMatch(/text-(pos|neg)/);
  });

  it.each<[Level, string, string]>([
    ['row', 'py-1.5', 'text-fg'],
    ['total', 'border-t', 'text-fg'],
    ['detail', 'pl-3.5', 'text-muted'],
  ])('applies the %s hierarchy', (level, spacing, tone) => {
    const { row, value } = render({ label: 'Importo', amount: 10, level });
    expect(row.dataset['level']).toBe(level);
    expect(row.classList.contains(spacing)).toBe(true);
    expect(value.classList.contains(tone)).toBe(true);
  });

  it('shows a reduction with a minus in the positive tone', () => {
    const { value } = render({ label: 'Detrazioni applicate', amount: 2676.91, flow: 'reduce' });
    expect(value.textContent!.trim()).toBe(`− ${formatCurrency(2676.91)}`);
    expect(value.classList.contains('text-pos')).toBe(true);
  });

  it('preserves an outgoing flow on detail rows', () => {
    const { value } = render({ label: 'Trattenuta', amount: 100, flow: 'out', level: 'detail' });
    expect(value.textContent!.trim()).toBe(`− ${formatCurrency(100)}`);
    expect(value.classList.contains('text-neg')).toBe(true);
  });
});

describe('AnimatedAmount', () => {
  let frames: Map<number, FrameRequestCallback>;
  let frameId: number;

  beforeEach(() => {
    frames = new Map();
    frameId = 0;
    vi.stubGlobal('matchMedia', () => ({ matches: false }));
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      frames.set(++frameId, callback);
      return frameId;
    });
    vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id));
    vi.spyOn(performance, 'now').mockReturnValue(0);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  function renderAmount() {
    const fixture = TestBed.createComponent(AnimatedAmount);
    fixture.componentRef.setInput('value', 1000);
    fixture.detectChanges();
    return fixture;
  }

  function advance(now: number) {
    const pending = [...frames.values()];
    frames.clear();
    pending.forEach((callback) => callback(now));
  }

  it('shows the initial amount immediately, then reaches the latest value', () => {
    const fixture = renderAmount();
    expect(fixture.nativeElement.textContent).toBe(formatCurrency(1000));
    expect(frames.size).toBe(0);

    fixture.componentRef.setInput('value', 2000);
    fixture.detectChanges();
    advance(225);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toBe(formatCurrency(1875));

    fixture.componentRef.setInput('value', 3000);
    fixture.detectChanges();
    expect(frames.size).toBe(1);
    advance(450);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toBe(formatCurrency(3000));
    expect(frames.size).toBe(0);
  });

  it('skips animation with reduced motion', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }));
    const fixture = renderAmount();
    fixture.componentRef.setInput('value', 2000);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toBe(formatCurrency(2000));
    expect(frames.size).toBe(0);
  });

  it('cancels a pending frame when destroyed', () => {
    const fixture = renderAmount();
    fixture.componentRef.setInput('value', 2000);
    fixture.detectChanges();
    expect(frames.size).toBe(1);
    fixture.destroy();
    expect(frames.size).toBe(0);
  });
});
