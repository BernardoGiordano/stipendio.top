import { computed, inject, Injectable } from '@angular/core';
import { Theme, ThemeMode } from './theme-mode';

/*
 * Chart colours. Series colours are the same in both themes and keep 3:1
 * against the light and the dark surface. Axis, label and hover colours
 * mirror the theme roles in styles.css.
 */

export const SERIE = {
  // who pays
  datore: '#8f8984',
  ente: '#b05f8f',
  stato: '#5b7fa6',

  // what the datore pays for
  retribuzione: '#78716c',
  contributiDatore: '#c4643e',
  tfr: '#9c7a45',
  fondiDatore: '#7a5c8a',
  fringeBenefit: '#4f8a8b',
  rimborsiTrasferta: '#5f9e94',
  welfare: '#3f7f8c',

  // where the busta goes
  contributi: '#d9774f',
  irpef: '#c25a74',
  addizionali: '#bf8a2c',
  fondi: '#8e6f9e',
  autoAziendale: '#c97575',
  netto: '#7f9c4c',
  percepito: '#5d8236',
} as const;

export type Serie = keyof typeof SERIE;

export interface ChartTheme {
  /** axis titles, tick labels */
  muted: string;
  /** colour bar title, marker label */
  title: string;
  grid: string;
  zeroline: string;
  hover: { bg: string; border: string; text: string };
  marker: { fill: string; ring: string };
  /** heatmap colour scale, low to high */
  scale: [number, string][];
  /** contour labels drawn on the scale */
  scaleLabel: string;
  scaleLine: string;
  font: string;
}

const FONT = 'Switzer, ui-sans-serif, system-ui, sans-serif';

const LIGHT: ChartTheme = {
  muted: '#57534e',
  title: '#292524',
  grid: 'rgba(0, 0, 0, 0.08)',
  zeroline: 'rgba(0, 0, 0, 0.16)',
  hover: { bg: '#fafaf9', border: '#d6d3d1', text: '#1c1917' },
  marker: { fill: '#1c1917', ring: '#ffffff' },
  scale: [
    [0, '#fdf0d5'],
    [0.5, '#f2a383'],
    [1, '#ca6680'],
  ],
  scaleLabel: '#1c1917',
  scaleLine: 'rgba(28, 25, 23, 0.2)',
  font: FONT,
};

const DARK: ChartTheme = {
  muted: '#a8a29e',
  title: '#e7e5e4',
  grid: 'rgba(255, 255, 255, 0.08)',
  zeroline: 'rgba(255, 255, 255, 0.16)',
  hover: { bg: '#292524', border: '#57534e', text: '#e7e5e4' },
  marker: { fill: '#fafaf9', ring: '#1c1917' },
  scale: [
    [0, '#3a2a1b'],
    [0.5, '#6b3328'],
    [1, '#a8475f'],
  ],
  scaleLabel: '#fafaf9',
  scaleLine: 'rgba(250, 250, 249, 0.2)',
  font: FONT,
};

export function chartTheme(theme: Theme): ChartTheme {
  return theme === 'dark' ? DARK : LIGHT;
}

/** The chart theme for the current ThemeMode, as a signal */
@Injectable({ providedIn: 'root' })
export class ChartPalette {
  private readonly themeMode = inject(ThemeMode);

  readonly theme = computed(() => chartTheme(this.themeMode.isDark() ? 'dark' : 'light'));
}
