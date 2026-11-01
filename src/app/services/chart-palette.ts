import { computed, inject, Injectable } from '@angular/core';
import { Theme, ThemeMode } from './theme-mode';

/*
 * Chart colours. Series colours are the same in both themes and keep 3:1
 * against the light and the dark surface. The heat table scale has one
 * version per theme, with a text colour that reads on every stop.
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

export type Hue = 'verde' | 'rosa' | 'arancio' | 'ocra' | 'viola' | 'blu' | 'terracotta';

interface HueColours {
  /** Bars, dots and lines; the same in both themes */
  bar: string;
  light: { ink: string; tint: string };
  dark: { ink: string; tint: string };
}

/**
 * Category hues of the results. Ink and tint mirror the --{hue}-ink and
 * --{hue}-tint roles in styles.css; templates use them through classes.
 */
export const HUE: Record<Hue, HueColours> = {
  verde: {
    bar: SERIE.netto,
    light: { ink: '#4a6b28', tint: '#ecf0e7' },
    dark: { ink: '#a3c96b', tint: 'rgb(127 156 76 / 0.16)' },
  },
  rosa: {
    bar: SERIE.irpef,
    light: { ink: '#a3445e', tint: '#f8ebee' },
    dark: { ink: '#e59aae', tint: 'rgb(194 90 116 / 0.18)' },
  },
  arancio: {
    bar: SERIE.contributi,
    light: { ink: '#9c4a28', tint: '#faefea' },
    dark: { ink: '#f0a383', tint: 'rgb(217 119 79 / 0.18)' },
  },
  ocra: {
    bar: SERIE.addizionali,
    light: { ink: '#7e5813', tint: '#f7f1e6' },
    dark: { ink: '#e0b866', tint: 'rgb(191 138 44 / 0.18)' },
  },
  viola: {
    bar: SERIE.fondi,
    light: { ink: '#74578a', tint: '#f1eef3' },
    dark: { ink: '#c3a8d3', tint: 'rgb(142 111 158 / 0.22)' },
  },
  blu: {
    bar: '#4f6d8f',
    light: { ink: '#3e5a7a', tint: '#eaeef2' },
    dark: { ink: '#a9bfd8', tint: 'rgb(79 109 143 / 0.25)' },
  },
  terracotta: {
    bar: '#b54a2a',
    light: { ink: '#9a3d22', tint: '#f6e9e5' },
    dark: { ink: '#f2a383', tint: 'rgb(181 74 42 / 0.2)' },
  },
};

/** Tile and pill classes per hue, spelled out so Tailwind finds them */
export const HUE_CLASS: Record<Hue, { tile: string; ink: string }> = {
  verde: { tile: 'bg-verde-tint text-verde-ink', ink: 'text-verde-ink' },
  rosa: { tile: 'bg-rosa-tint text-rosa-ink', ink: 'text-rosa-ink' },
  arancio: { tile: 'bg-arancio-tint text-arancio-ink', ink: 'text-arancio-ink' },
  ocra: { tile: 'bg-ocra-tint text-ocra-ink', ink: 'text-ocra-ink' },
  viola: { tile: 'bg-viola-tint text-viola-ink', ink: 'text-viola-ink' },
  blu: { tile: 'bg-blu-tint text-blu-ink', ink: 'text-blu-ink' },
  terracotta: { tile: 'bg-terracotta-tint text-terracotta-ink', ink: 'text-terracotta-ink' },
};

export interface ChartTheme {
  /** Heat table colour scale, low to high */
  scale: [number, string][];
  /** Text drawn on every stop of the scale */
  scaleLabel: string;
}

const LIGHT: ChartTheme = {
  scale: [
    [0, '#fdf0d5'],
    [0.5, '#f2a383'],
    [1, '#ca6680'],
  ],
  scaleLabel: '#1c1917',
};

const DARK: ChartTheme = {
  scale: [
    [0, '#3a2a1b'],
    [0.5, '#6b3328'],
    [1, '#a8475f'],
  ],
  scaleLabel: '#fafaf9',
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
