import { chartTheme, HUE, SERIE } from './chart-palette';

type Rgb = [number, number, number];

function rgb(hex: string): Rgb {
  const n = parseInt(hex.slice(1), 16);
  return [n >> 16, (n >> 8) & 255, n & 255];
}

/** A hex colour, or an rgb(r g b / a) colour laid over a solid backdrop */
function over(colour: string, backdrop: string): string {
  const match = colour.match(/^rgb\((\d+) (\d+) (\d+) \/ ([\d.]+)\)$/);
  if (!match) return colour;
  const [r, g, b, a] = match.slice(1).map(Number);
  const mixed = [r, g, b].map((c, i) => Math.round(c * a + rgb(backdrop)[i] * (1 - a)));
  return '#' + mixed.map((c) => c.toString(16).padStart(2, '0')).join('');
}

function luminance(hex: string): number {
  const channel = (c: number) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  const [r, g, b] = rgb(hex).map(channel);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

// Card surfaces the charts sit on (white and stone-900)
const SURFACE = { light: '#ffffff', dark: '#1c1917' } as const;

describe('category hues', () => {
  for (const theme of ['light', 'dark'] as const) {
    it(`keeps every ink at 4.5:1 on its tint over the ${theme} surface`, () => {
      for (const [hue, colours] of Object.entries(HUE)) {
        const { ink, tint } = colours[theme];
        const fill = over(tint, SURFACE[theme]);
        expect(contrast(ink, fill), `${hue} ${theme}`).toBeGreaterThanOrEqual(4.5);
      }
    });

    it(`keeps every ink at 4.5:1 on the bare ${theme} surface`, () => {
      for (const [hue, colours] of Object.entries(HUE)) {
        expect(contrast(colours[theme].ink, SURFACE[theme]), hue).toBeGreaterThanOrEqual(4.5);
      }
    });
  }

  it('keeps every bar at 3:1 on both surfaces', () => {
    for (const [hue, { bar }] of Object.entries(HUE)) {
      expect(contrast(bar, SURFACE.light), `${hue} light`).toBeGreaterThanOrEqual(3);
      expect(contrast(bar, SURFACE.dark), `${hue} dark`).toBeGreaterThanOrEqual(3);
    }
  });
});

describe('chart palette', () => {
  it('keeps every series at 3:1 on both surfaces', () => {
    for (const [serie, colour] of Object.entries(SERIE)) {
      expect(contrast(colour, SURFACE.light), `${serie} light`).toBeGreaterThanOrEqual(3);
      expect(contrast(colour, SURFACE.dark), `${serie} dark`).toBeGreaterThanOrEqual(3);
    }
  });

  for (const theme of ['light', 'dark'] as const) {
    it(`keeps heat table text at 4.5:1 on every ${theme} scale stop`, () => {
      const palette = chartTheme(theme);
      for (const [, stop] of palette.scale) {
        expect(contrast(palette.scaleLabel, stop), stop).toBeGreaterThanOrEqual(4.5);
      }
    });
  }

  it('gives each theme its own scale', () => {
    expect(chartTheme('light').scale).not.toEqual(chartTheme('dark').scale);
  });
});
