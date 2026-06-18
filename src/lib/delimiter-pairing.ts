import type { CharCell } from './highlight';

const OPENERS: Readonly<Record<string, string>> = {
  '(': ')',
  '[': ']',
  '{': '}',
  '"': '"',
  "'": "'",
};

/** True when `ch` opens a pair that may auto-close on an empty body. */
export function isOpener(ch: string): boolean {
  return ch in OPENERS;
}

/** Closer character for an opener, or undefined. */
export function getCloser(opener: string): string | undefined {
  return OPENERS[opener];
}

/**
 * After committing an opener at `indexAfterOpen - 1`, return 1 if the very next
 * expected character is its matching closer (empty pair: (), [], "", etc.).
 */
export function getAutoCloseCount(cells: CharCell[], indexAfterOpen: number): 0 | 1 {
  if (indexAfterOpen >= cells.length || indexAfterOpen < 1) return 0;
  const opener = cells[indexAfterOpen - 1]?.char;
  if (!opener || !isOpener(opener)) return 0;
  const closer = OPENERS[opener];
  if (cells[indexAfterOpen]?.char !== closer) return 0;
  // Skip auto-close when more same-quote chars follow (e.g. opening triple quotes).
  if ((opener === '"' || opener === "'") && cells[indexAfterOpen + 1]?.char === opener) {
    return 0;
  }
  return 1;
}
