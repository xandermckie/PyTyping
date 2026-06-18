import { describe, expect, it } from 'vitest';
import { getAutoCloseCount, getCloser, isOpener } from '../delimiter-pairing';
import type { CharCell } from '../highlight';

function cellsOf(text: string): CharCell[] {
  return [...text].map((char) => ({ char, className: '' }));
}

describe('isOpener', () => {
  it('recognises pairing openers', () => {
    expect(isOpener('(')).toBe(true);
    expect(isOpener('[')).toBe(true);
    expect(isOpener('{')).toBe(true);
    expect(isOpener('"')).toBe(true);
    expect(isOpener("'")).toBe(true);
  });

  it('rejects non-openers', () => {
    expect(isOpener('x')).toBe(false);
    expect(isOpener(')')).toBe(false);
  });
});

describe('getCloser', () => {
  it('maps openers to closers', () => {
    expect(getCloser('(')).toBe(')');
    expect(getCloser('"')).toBe('"');
  });
});

describe('getAutoCloseCount', () => {
  it('auto-closes empty pairs', () => {
    expect(getAutoCloseCount(cellsOf('()'), 1)).toBe(1);
    expect(getAutoCloseCount(cellsOf('[]'), 1)).toBe(1);
    expect(getAutoCloseCount(cellsOf('""'), 1)).toBe(1);
    expect(getAutoCloseCount(cellsOf("''"), 1)).toBe(1);
    expect(getAutoCloseCount(cellsOf('{}'), 1)).toBe(1);
  });

  it('does not auto-close when content follows', () => {
    expect(getAutoCloseCount(cellsOf('(x)'), 1)).toBe(0);
    expect(getAutoCloseCount(cellsOf('"hi"'), 1)).toBe(0);
    expect(getAutoCloseCount(cellsOf('func()'), 5)).toBe(1);
  });

  it('does not auto-close triple quotes', () => {
    expect(getAutoCloseCount(cellsOf('"""'), 1)).toBe(0);
  });
});
