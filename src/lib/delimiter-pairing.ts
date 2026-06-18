import type { CharCell } from './highlight';

const OPENERS: Readonly<Record<string, string>> = {
  '(': ')',
  '[': ']',
  '{': '}',
  '"': '"',
  "'": "'",
};

export interface VirtualPair {
  openerIndex: number;
  closerIndex: number;
}

/** Active virtual pair tracked while typing (extends VirtualPair with consumption state). */
export interface VirtualPairState extends VirtualPair {
  closerTyped: boolean;
}

/** True when `ch` opens a pair that may auto-close on an empty body. */
export function isOpener(ch: string): boolean {
  return ch in OPENERS;
}

/** Closer character for an opener, or undefined. */
export function getCloser(opener: string): string | undefined {
  return OPENERS[opener];
}

function isQuoteOpener(opener: string): boolean {
  return opener === '"' || opener === "'";
}

/**
 * After committing an opener at `cursorAfterOpen - 1`, return a virtual pair when
 * the next expected character is its matching closer on an empty body ((), "", etc.).
 */
export function detectVirtualPair(cells: CharCell[], cursorAfterOpen: number): VirtualPair | null {
  if (cursorAfterOpen >= cells.length || cursorAfterOpen < 1) return null;
  const openerIndex = cursorAfterOpen - 1;
  const opener = cells[openerIndex]?.char;
  if (!opener || !isOpener(opener)) return null;
  const closer = OPENERS[opener];
  if (cells[cursorAfterOpen]?.char !== closer) return null;

  if (isQuoteOpener(opener)) {
    // Opening triple quotes: first or second quote in a run of 3+.
    if (openerIndex >= 1 && cells[openerIndex - 1]?.char === opener) return null;
    if (cells[cursorAfterOpen + 1]?.char === opener) return null;
  }

  return { openerIndex, closerIndex: cursorAfterOpen };
}

/** @deprecated Use detectVirtualPair — kept for test migration only. */
export function getAutoCloseCount(cells: CharCell[], indexAfterOpen: number): 0 | 1 {
  return detectVirtualPair(cells, indexAfterOpen) ? 1 : 0;
}
