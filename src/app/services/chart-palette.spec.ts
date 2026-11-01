import { chartTheme, SERIE } from './chart-palette';

function luminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  const channel = (c: number) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(n >> 16) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

// Card surfaces the charts sit on (white and stone-900)
const SURFACE = { light: '#ffffff', dark: '#1c1917' } as const;

describe('chart palette', () => {
  it('keeps every series at 3:1 on both surfaces', () => {
    for (const [serie, colour] of Object.entries(SERIE)) {
      expect(contrast(colour, SURFACE.light), `${serie} light`).toBeGreaterThanOrEqual(3);
      expect(contrast(colour, SURFACE.dark), `${serie} dark`).toBeGreaterThanOrEqual(3);
    }
  });

  for (const theme of ['light', 'dark'] as const) {
    describe(theme, () => {
      const palette = chartTheme(theme);

      it('keeps contour labels at 4.5:1 on every scale stop', () => {
        for (const [, stop] of palette.scale) {
          expect(contrast(palette.scaleLabel, stop), stop).toBeGreaterThanOrEqual(4.5);
        }
      });

      it('keeps axis and hover text at 4.5:1', () => {
        expect(contrast(palette.muted, SURFACE[theme])).toBeGreaterThanOrEqual(4.5);
        expect(contrast(palette.title, SURFACE[theme])).toBeGreaterThanOrEqual(4.5);
        expect(contrast(palette.hover.text, palette.hover.bg)).toBeGreaterThanOrEqual(4.5);
      });

      it('rings the position marker against the scale', () => {
        expect(contrast(palette.marker.fill, palette.marker.ring)).toBeGreaterThanOrEqual(3);
      });
    });
  }

  it('gives each theme its own scale', () => {
    expect(chartTheme('light').scale).not.toEqual(chartTheme('dark').scale);
  });
});
