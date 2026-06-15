/**
 * Settings schema, defaults, and validator (no React here so it can be reused
 * by the backup-import path). Fonts are restricted to a known allow-list and
 * colors to valid hex, so nothing read from storage or an imported file can
 * inject arbitrary CSS.
 */
import { DEFAULT_CUSTOM, sanitizeBaseColors } from './theme';
import type { BaseColors, ThemeId } from './theme';
import { isBoolean, isNumber, isObject, isString } from './validation';

export interface Settings {
  themeId: ThemeId;
  customColors: BaseColors;
  codeFont: string;
  uiFont: string;
  codeFontSize: number;
  tabSize: number;
  soundEnabled: boolean;
  lineNumbers: boolean;
  /** Show live WPM while typing (Monkeytype-style). */
  liveWpm: boolean;
  /** Blink the caret (off = steady bar). */
  caretBlink: boolean;
}

// Premade code fonts. The first family in each stack is loaded from Google
// Fonts (see index.html); the rest are offline fallbacks.
export const CODE_FONTS: Array<{ label: string; value: string }> = [
  { label: 'JetBrains Mono', value: "'JetBrains Mono', 'Courier New', ui-monospace, monospace" },
  { label: 'Fira Code', value: "'Fira Code', 'JetBrains Mono', ui-monospace, monospace" },
  { label: 'Source Code Pro', value: "'Source Code Pro', ui-monospace, monospace" },
  { label: 'IBM Plex Mono', value: "'IBM Plex Mono', ui-monospace, monospace" },
  { label: 'Roboto Mono', value: "'Roboto Mono', ui-monospace, monospace" },
  { label: 'Space Mono', value: "'Space Mono', ui-monospace, monospace" },
  { label: 'Courier New', value: "'Courier New', ui-monospace, monospace" },
  { label: 'System Mono', value: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace' },
];

export const UI_FONTS: Array<{ label: string; value: string }> = [
  { label: 'Inter', value: "'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif" },
  { label: 'Lexend', value: "'Lexend', system-ui, -apple-system, sans-serif" },
  { label: 'Roboto', value: "'Roboto', system-ui, -apple-system, sans-serif" },
  { label: 'System Sans', value: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" },
];

const THEME_IDS: ThemeId[] = ['light', 'monokia', 'custom'];
const TAB_SIZES = [2, 4, 8];

export const SETTINGS_KEY = 'settings';

export const DEFAULT_SETTINGS: Settings = {
  themeId: 'monokia',
  customColors: DEFAULT_CUSTOM,
  codeFont: CODE_FONTS[0].value,
  uiFont: UI_FONTS[0].value,
  codeFontSize: 14,
  tabSize: 4,
  soundEnabled: false,
  lineNumbers: true,
  liveWpm: true,
  caretBlink: true,
};

/** Coerce anything (storage, imported backup) into a safe, complete Settings. */
export function validateSettings(raw: unknown): Settings {
  const out: Settings = { ...DEFAULT_SETTINGS, customColors: { ...DEFAULT_CUSTOM } };
  if (!isObject(raw)) return out;

  if (isString(raw.themeId) && (THEME_IDS as string[]).includes(raw.themeId)) {
    out.themeId = raw.themeId as ThemeId;
  }
  if (isObject(raw.customColors)) {
    out.customColors = sanitizeBaseColors(raw.customColors);
  }
  // Only accept fonts from our allow-list (blocks font-family value injection).
  if (isString(raw.codeFont) && CODE_FONTS.some((f) => f.value === raw.codeFont)) {
    out.codeFont = raw.codeFont;
  }
  if (isString(raw.uiFont) && UI_FONTS.some((f) => f.value === raw.uiFont)) {
    out.uiFont = raw.uiFont;
  }
  if (isNumber(raw.codeFontSize)) {
    out.codeFontSize = Math.min(20, Math.max(12, Math.round(raw.codeFontSize)));
  }
  if (isNumber(raw.tabSize) && TAB_SIZES.includes(raw.tabSize)) out.tabSize = raw.tabSize;
  if (isBoolean(raw.soundEnabled)) out.soundEnabled = raw.soundEnabled;
  if (isBoolean(raw.lineNumbers)) out.lineNumbers = raw.lineNumbers;
  if (isBoolean(raw.liveWpm)) out.liveWpm = raw.liveWpm;
  if (isBoolean(raw.caretBlink)) out.caretBlink = raw.caretBlink;
  return out;
}
