/**
 * Apply validated settings onto <html> (palette, fonts, caret).
 * Used synchronously before React paint and on every settings change.
 */
import { applyPalette, resolvePalette } from './theme';
import type { Settings } from './settings';

export function applySettingsToDocument(settings: Settings): void {
  applyPalette(resolvePalette(settings.themeId, settings.customColors));
  const root = document.documentElement;
  root.style.setProperty('--font-code', settings.codeFont);
  root.style.setProperty('--font-ui', settings.uiFont);
  root.style.setProperty('--font-code-size', `${settings.codeFontSize}px`);
  root.setAttribute('data-caret', settings.caretBlink ? 'blink' : 'steady');
  root.style.colorScheme = root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
}
