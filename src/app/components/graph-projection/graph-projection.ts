import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { InputCalcoloStipendio, OutputCalcoloStipendio } from '../../../calculator/types';
import { ChartPalette, HUE } from '../../services/chart-palette';
import { formatCurrency, formatNumber, formatPercent } from '../../utils/intl';
import {
  aumentoNetto,
  confrontoRal,
  conRal,
  grigliaWelfare,
  serieRal,
} from '../../utils/proiezione';

type Periodo = 'mensile' | 'annuale';

const HEIGHT = 236;
const PAD = { left: 52, right: 12, top: 14, bottom: 24 };

/** The pointer snaps to this many euro of RAL */
const SCATTO = 500;
/** Arrow keys and Page keys move the cursor by these amounts */
const PASSO_TASTO = 1_000;
const PASSO_PAGINA = 5_000;

/** Round step for about `count` axis divisions over `span` */
function passo(span: number, count: number): number {
  const raw = span / count;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].find((m) => m * magnitude >= raw)! * magnitude;
  return step;
}

function hex(colour: string): [number, number, number] {
  const n = parseInt(colour.slice(1), 16);
  return [n >> 16, (n >> 8) & 255, n & 255];
}

/** Colour at `t` (0 to 1) along a scale of [stop, colour] pairs */
function interpola(scale: [number, string][], t: number): string {
  const i = Math.max(
    1,
    scale.findIndex(([stop]) => stop >= t),
  );
  const [s0, c0] = scale[i - 1];
  const [s1, c1] = scale[Math.min(i, scale.length - 1)];
  const k = s1 === s0 ? 0 : (t - s0) / (s1 - s0);
  const [a, b] = [hex(c0), hex(c1)];
  return `rgb(${a.map((v, j) => Math.round(v + (b[j] - v) * k)).join(' ')})`;
}

/**
 * The Proiezione tab: netto and percepito across RAL as a line chart, the
 * gain from a raise, a table of nearby RALs and a heat table of RAL against
 * extra welfare. All figures come from the calculator with the form's options.
 */
@Component({
  selector: 'app-graph-projection',
  templateUrl: './graph-projection.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex flex-col gap-2' },
})
export class GraphProjection {
  private readonly palette = inject(ChartPalette);

  readonly result = input<OutputCalcoloStipendio | null>(null);
  readonly baseInput = input<InputCalcoloStipendio | null>(null);

  readonly periodo = signal<Periodo>('mensile');
  readonly periodi: readonly { id: Periodo; label: string }[] = [
    { id: 'mensile', label: 'Mensile' },
    { id: 'annuale', label: 'Annuale' },
  ];

  protected readonly euro = (value: number) => formatCurrency(value);
  protected readonly euroTondi = (value: number) => formatCurrency(value, 0);
  protected readonly numero = (value: number) => formatNumber(value);
  protected readonly percent = formatPercent;
  protected readonly verde = HUE.verde.bar;
  protected readonly height = HEIGHT;
  protected readonly eyebrow =
    'font-mono text-[11px]/[18px] font-semibold tracking-widest text-faint uppercase';
  protected readonly insight =
    'flex-[1_1_200px] rounded-[10px] bg-sunken px-3 py-2.5 ring-1 ring-hair ring-inset';

  private readonly box = viewChild<ElementRef<HTMLElement>>('chartBox');
  /** Drawing width in CSS pixels, so the chart text keeps its real size */
  private readonly width = signal(600);

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const el = this.box()?.nativeElement;
      if (!el || typeof ResizeObserver !== 'function') return;
      const observer = new ResizeObserver(([entry]) =>
        this.width.set(Math.max(280, Math.round(entry.contentRect.width))),
      );
      observer.observe(el);
      destroyRef.onDestroy(() => observer.disconnect());
    });
  }

  private readonly serie = computed(() => {
    const base = this.baseInput();
    return base ? serieRal(base) : [];
  });

  readonly chart = computed(() => {
    const punti = this.serie();
    const base = this.baseInput();
    if (punti.length < 2 || !base) return null;

    const w = this.width();
    const [x0, x1] = [punti[0].ral, punti.at(-1)!.ral];
    const valori = punti.flatMap((p) => [p.nettoMensile, p.percepitoMensile]);
    const stepY = passo(Math.max(...valori) - Math.min(...valori), 6);
    const y0 = Math.floor(Math.min(...valori) / stepY) * stepY;
    const y1 = Math.ceil(Math.max(...valori) / stepY) * stepY;

    const x = (ral: number) => PAD.left + ((ral - x0) / (x1 - x0)) * (w - PAD.left - PAD.right);
    const y = (v: number) =>
      HEIGHT - PAD.bottom - ((v - y0) / (y1 - y0)) * (HEIGHT - PAD.top - PAD.bottom);
    type Pick = (p: (typeof punti)[number]) => number;
    const linea = (pick: Pick) =>
      punti.map((p) => `${x(p.ral).toFixed(1)},${y(pick(p)).toFixed(1)}`).join(' ');

    // Height of a drawn line at any RAL, so the cursor dot sits on it
    const lungo = (ral: number, pick: Pick) => {
      const found = punti.findIndex((p) => p.ral >= ral);
      const i = found < 0 ? punti.length - 1 : Math.max(1, found);
      const [a, b] = [punti[i - 1], punti[i]];
      const k = b.ral === a.ral ? 0 : (ral - a.ral) / (b.ral - a.ral);
      return y(pick(a) + (pick(b) - pick(a)) * k);
    };

    const yTicks: { y: number; label: string }[] = [];
    for (let v = y0; v <= y1 + 0.5; v += stepY) yTicks.push({ y: y(v), label: formatNumber(v) });

    const stepX = passo(x1 - x0, Math.max(3, Math.floor(w / 90)));
    const xTicks: { x: number; label: string }[] = [];
    for (let v = Math.ceil(x0 / stepX) * stepX; v <= x1; v += stepX) {
      xTicks.push({ x: x(v), label: `${formatNumber(v / 1000)}k` });
    }

    const tu = punti.find((p) => p.ral === base.ral) ?? punti[0];
    const tuX = x(tu.ral);
    const percepito = punti.some((p) => Math.abs(p.percepitoMensile - p.nettoMensile) >= 0.5);
    const bottom = HEIGHT - PAD.bottom;

    return {
      w,
      x0,
      x1,
      x,
      nettoA: (ral: number) => lungo(ral, (p) => p.nettoMensile),
      percepitoA: (ral: number) => lungo(ral, (p) => p.percepitoMensile),
      ralA: (px: number) =>
        x0 + ((px - PAD.left) / (w - PAD.left - PAD.right)) * (x1 - x0),
      left: PAD.left,
      right: w - PAD.right,
      top: PAD.top - 2,
      bottom,
      yTicks,
      xTicks,
      netto: linea((p) => p.nettoMensile),
      area: `${linea((p) => p.nettoMensile)} ${x(x1).toFixed(1)},${bottom} ${x(x0).toFixed(1)},${bottom}`,
      percepito: percepito ? linea((p) => p.percepitoMensile) : null,
      tu: {
        x: tuX,
        y: y(tu.nettoMensile),
        // Labels flip to the left of the marker near the right edge
        flip: tuX > w - 170,
        ral: tu.ral,
        netto: tu.nettoMensile,
      },
      label:
        `Netto mensile da ${formatCurrency(punti[0].nettoMensile, 0)} con RAL ${formatCurrency(x0, 0)} ` +
        `a ${formatCurrency(punti.at(-1)!.nettoMensile, 0)} con RAL ${formatCurrency(x1, 0)}. ` +
        `Con RAL ${formatCurrency(tu.ral, 0)} il netto è ${formatCurrency(tu.nettoMensile)}. ` +
        'Usa le frecce per spostare il cursore su altre RAL.',
    };
  });

  /** RAL under the pointer or the keyboard cursor; null hides the cursor */
  readonly cursorRal = signal<number | null>(null);

  /**
   * The movable cursor: real calculator figures at its RAL, a dot on each
   * drawn line and a readout box that stays inside the plot.
   */
  readonly cursore = computed(() => {
    const c = this.chart();
    const base = this.baseInput();
    const ral = this.cursorRal();
    if (!c || !base || ral === null) return null;
    const result = conRal(base, ral);
    if (!result) return null;

    const righe = [
      { testo: `RAL ${formatCurrency(ral, 0)}`, forte: true },
      { testo: `${formatCurrency(result.nettoMensile)} netti`, forte: false },
      ...(c.percepito
        ? [{ testo: `${formatCurrency(result.nettoMensilePercepito)} percepiti`, forte: false }]
        : []),
    ];
    const x = c.x(ral);
    const y = c.nettoA(ral);
    const boxW = 20 + Math.max(...righe.map((r) => r.testo.length)) * 6.6;
    const boxH = 10 + righe.length * 16;
    const flip = x + 10 + boxW > c.right;
    const below = y < (c.top + c.bottom) / 2;
    const boxY = Math.min(Math.max(below ? y + 12 : y - 12 - boxH, c.top), c.bottom - boxH);

    return {
      ral,
      x,
      y,
      yPercepito: c.percepito ? c.percepitoA(ral) : null,
      righe,
      box: { x: flip ? x - 10 - boxW : x + 10, y: boxY, w: boxW, h: boxH },
      testo:
        `RAL ${formatCurrency(ral, 0)}: netto ${formatCurrency(result.nettoMensile)} al mese` +
        (c.percepito ? `, percepito ${formatCurrency(result.nettoMensilePercepito)}` : ''),
    };
  });

  /** Spoken value of the chart slider: the cursor, or your RAL when there is none */
  readonly valueText = computed(() => {
    const c = this.chart();
    if (!c) return '';
    return (
      this.cursore()?.testo ??
      `RAL ${formatCurrency(c.tu.ral, 0)}: netto ${formatCurrency(c.tu.netto)} al mese`
    );
  });

  private sposta(ral: number) {
    const c = this.chart();
    if (c) this.cursorRal.set(Math.min(Math.max(ral, c.x0), c.x1));
  }

  protected punta(event: PointerEvent) {
    const c = this.chart();
    const svg = event.currentTarget as SVGSVGElement;
    if (!c) return;
    const rect = svg.getBoundingClientRect();
    const px = ((event.clientX - rect.left) / rect.width) * c.w;
    this.sposta(Math.round(c.ralA(px) / SCATTO) * SCATTO);
  }

  /** A mouse clears the cursor on leaving; a finger leaves it where it lifted */
  protected lascia(event: PointerEvent) {
    if (event.pointerType === 'mouse') this.cursorRal.set(null);
  }

  protected mostra() {
    const base = this.baseInput();
    if (base && this.cursorRal() === null) this.sposta(base.ral);
  }

  protected tasto(event: KeyboardEvent) {
    const c = this.chart();
    const base = this.baseInput();
    if (!c || !base) return;
    const ral = this.cursorRal() ?? base.ral;
    const target: Record<string, number> = {
      ArrowRight: ral + PASSO_TASTO,
      ArrowUp: ral + PASSO_TASTO,
      ArrowLeft: ral - PASSO_TASTO,
      ArrowDown: ral - PASSO_TASTO,
      PageUp: ral + PASSO_PAGINA,
      PageDown: ral - PASSO_PAGINA,
      Home: c.x0,
      End: c.x1,
    };
    if (event.key === 'Escape') {
      this.cursorRal.set(null);
    } else if (event.key in target) {
      event.preventDefault();
      this.sposta(target[event.key]);
    }
  }

  /** The gain from 1.000 € of RAL, and from the next two 5.000 € steps */
  readonly aumenti = computed(() => {
    const base = this.baseInput();
    const r = this.result();
    if (!base || !r) return null;
    const annuo = aumentoNetto(base);
    const piu5 = conRal(base, base.ral + 5_000);
    const piu10 = conRal(base, base.ral + 10_000);
    if (annuo === null || !piu5 || !piu10) return null;
    return {
      annuo,
      mensile: annuo / r.mensilita,
      quota: annuo / 1_000,
      ral: base.ral,
      passo1: piu5.nettoMensile - r.nettoMensile,
      passo2: piu10.nettoMensile - piu5.nettoMensile,
    };
  });

  readonly confronto = computed(() => {
    const base = this.baseInput();
    return base ? confrontoRal(base) : [];
  });

  private readonly griglia = computed(() => {
    const base = this.baseInput();
    return base ? grigliaWelfare(base) : null;
  });

  /** Heat table cells for the chosen period, coloured along the brand scale */
  readonly heat = computed(() => {
    const griglia = this.griglia();
    if (!griglia) return null;
    const periodo = this.periodo();
    const { scale, scaleLabel } = this.palette.theme();
    const valori = griglia.righe.flatMap((riga) => riga.celle.map((cella) => cella[periodo]));
    const [min, max] = [Math.min(...valori), Math.max(...valori)];
    return {
      welfare: griglia.welfare,
      text: scaleLabel,
      righe: griglia.righe.map((riga) => ({
        ...riga,
        celle: riga.celle.map((cella, i) => ({
          valore: cella[periodo],
          colore: interpola(scale, max > min ? (cella[periodo] - min) / (max - min) : 0),
          attuale: riga.attuale && i === 0,
        })),
      })),
    };
  });
}
