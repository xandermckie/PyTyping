/**
 * Theme system. A "palette" is the full set of color CSS variables the app
 * reads. Presets ship complete palettes; the custom theme editor exposes only
 * 8 base colors and we *derive* the remaining surfaces, borders, and a readable
 * syntax palette from them (light vs. dark is decided by background luminance).
 */

import { isObject, sanitizeHexColor } from './validation';

export type ThemeId = 'light' | 'monokia' | 'custom';

/** The 8 colors the custom-theme editor lets a user pick (see Guide §IV). */
export interface BaseColors {
  background: string;
  textPrimary: string;
  textSecondary: string;
  accent: string;
  error: string;
  success: string;
  warning: string;
  border: string;
}

/** Full palette = every CSS variable the app sets on <html>. */
export type Palette = Record<string, string>;

/* ----------------------------- color helpers ----------------------------- */

interface RGB {
  r: number;
  g: number;
  b: number;
}

function hexToRgb(hex: string): RGB {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function rgbToHex({ r, g, b }: RGB): string {
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`;
}

/** Mix two colors; amount 0 = a, 1 = b. */
function mix(a: string, b: string, amount: number): string {
  const c1 = hexToRgb(a);
  const c2 = hexToRgb(b);
  return rgbToHex({
    r: c1.r + (c2.r - c1.r) * amount,
    g: c1.g + (c2.g - c1.g) * amount,
    b: c1.b + (c2.b - c1.b) * amount,
  });
}

/** Relative luminance (0 dark – 1 light) for choosing a syntax palette. */
function luminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

/** Convert a hex + alpha to an rgba() string (used for translucent borders). */
function rgba(hex: string, alpha: number): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/* ------------------------------- presets --------------------------------- */

const SYNTAX_LIGHT = {
  '--color-syntax-keyword': '#9d4edd',
  '--color-syntax-string': '#2a9d4a',
  '--color-syntax-comment': '#a3a199',
  '--color-syntax-function': '#1d6f9e',
  '--color-syntax-builtin': '#b5651d',
  '--color-syntax-number': '#b5651d',
  '--color-syntax-operator': '#5a5954',
  '--color-syntax-punctuation': '#6f6e69',
  '--color-syntax-decorator': '#c98a1b',
  '--color-syntax-class': '#1d6f8e',
};

const SYNTAX_DARK = {
  '--color-syntax-keyword': '#c792ea',
  '--color-syntax-string': '#9ece6a',
  '--color-syntax-comment': '#5f5e5a',
  '--color-syntax-function': '#7aa2f7',
  '--color-syntax-builtin': '#e0af68',
  '--color-syntax-number': '#e0af68',
  '--color-syntax-operator': '#89ddff',
  '--color-syntax-punctuation': '#a9b1d6',
  '--color-syntax-decorator': '#e2b714',
  '--color-syntax-class': '#7dcfff',
};

export const PRESETS: Record<Exclude<ThemeId, 'custom'>, Palette> = {
  light: {
    '--color-background-primary': '#f8f7f5',
    '--color-background-secondary': '#efefec',
    '--color-background-tertiary': '#e4e3df',
    '--color-text-primary': '#2c2c2a',
    '--color-text-secondary': '#888780',
    '--color-text-tertiary': '#b4b2a9',
    '--color-accent': '#1d9e75',
    '--color-error': '#e24b4a',
    '--color-success': '#639922',
    '--color-warning': '#c98a1b',
    '--color-border-primary': 'rgba(0, 0, 0, 0.4)',
    '--color-border-secondary': 'rgba(0, 0, 0, 0.22)',
    '--color-border-tertiary': 'rgba(0, 0, 0, 0.12)',
    ...SYNTAX_LIGHT,
  },
  // "Monokia": dark, muted amber accent — homage to Monkeytype's dark mode.
  monokia: {
    '--color-background-primary': '#0f0e0d',
    '--color-background-secondary': '#1a1917',
    '--color-background-tertiary': '#232220',
    '--color-text-primary': '#f1f0ed',
    '--color-text-secondary': '#888780',
    '--color-text-tertiary': '#5f5e5a',
    '--color-accent': '#e2b714',
    '--color-error': '#e24b4a',
    '--color-success': '#88b04b',
    '--color-warning': '#e2b714',
    '--color-border-primary': 'rgba(255, 255, 255, 0.32)',
    '--color-border-secondary': 'rgba(255, 255, 255, 0.18)',
    '--color-border-tertiary': 'rgba(255, 255, 255, 0.1)',
    ...SYNTAX_DARK,
  },
};

/** Base colors pre-filled into the custom editor (derived from Monokia). */
export const DEFAULT_CUSTOM: BaseColors = {
  background: '#0f0e0d',
  textPrimary: '#f1f0ed',
  textSecondary: '#888780',
  accent: '#7aa2f7',
  error: '#e24b4a',
  success: '#88b04b',
  warning: '#e2b714',
  border: '#ffffff',
};

/** Coerce an untrusted object into BaseColors, forcing every field to a valid
 *  hex color. This is the security gate for custom themes: a bad value (e.g.
 *  an attempt to inject CSS) is replaced by the corresponding default. */
export function sanitizeBaseColors(raw: unknown): BaseColors {
  const r = isObject(raw) ? raw : {};
  return {
    background: sanitizeHexColor(r.background, DEFAULT_CUSTOM.background),
    textPrimary: sanitizeHexColor(r.textPrimary, DEFAULT_CUSTOM.textPrimary),
    textSecondary: sanitizeHexColor(r.textSecondary, DEFAULT_CUSTOM.textSecondary),
    accent: sanitizeHexColor(r.accent, DEFAULT_CUSTOM.accent),
    error: sanitizeHexColor(r.error, DEFAULT_CUSTOM.error),
    success: sanitizeHexColor(r.success, DEFAULT_CUSTOM.success),
    warning: sanitizeHexColor(r.warning, DEFAULT_CUSTOM.warning),
    border: sanitizeHexColor(r.border, DEFAULT_CUSTOM.border),
  };
}

/**
 * Expand the 8 user-chosen colors into the full palette. Secondary/tertiary
 * surfaces are nudged toward white (light bg) or away (dark bg); borders use
 * the chosen border color at decreasing alpha; the syntax set is picked by the
 * background's luminance so code stays readable on either polarity.
 */
export function paletteFromBase(base: BaseColors): Palette {
  const isDark = luminance(base.background) < 0.5;
  const shiftTarget = isDark ? '#ffffff' : '#000000';
  return {
    '--color-background-primary': base.background,
    '--color-background-secondary': mix(base.background, shiftTarget, 0.05),
    '--color-background-tertiary': mix(base.background, shiftTarget, 0.1),
    '--color-text-primary': base.textPrimary,
    '--color-text-secondary': base.textSecondary,
    '--color-text-tertiary': mix(base.textSecondary, base.background, 0.45),
    '--color-accent': base.accent,
    '--color-error': base.error,
    '--color-success': base.success,
    '--color-warning': base.warning,
    '--color-border-primary': rgba(base.border, 0.4),
    '--color-border-secondary': rgba(base.border, 0.2),
    '--color-border-tertiary': rgba(base.border, 0.1),
    ...(isDark ? SYNTAX_DARK : SYNTAX_LIGHT),
  };
}

/** Write a palette onto the document root as inline CSS variables. */
export function applyPalette(palette: Palette): void {
  const root = document.documentElement;
  for (const [key, value] of Object.entries(palette)) {
    root.style.setProperty(key, value);
  }
  // Mark the active polarity so the CSS first-paint fallback steps aside.
  const isDark = luminance(palette['--color-background-primary'] ?? '#ffffff') < 0.5;
  root.setAttribute('data-theme', isDark ? 'dark' : 'light');
}

/** Resolve the palette for a given theme selection. */
export function resolvePalette(themeId: ThemeId, custom: BaseColors): Palette {
  if (themeId === 'custom') return paletteFromBase(custom);
  return PRESETS[themeId];
}
