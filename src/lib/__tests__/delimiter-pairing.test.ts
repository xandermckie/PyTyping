import { describe, expect, it } from 'vitest';
import { detectVirtualPair, getAutoCloseCount, getCloser, isOpener } from '../delimiter-pairing';
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

describe('detectVirtualPair', () => {
  it('detects empty pairs', () => {
    expect(detectVirtualPair(cellsOf('()'), 1)).toEqual({ openerIndex: 0, closerIndex: 1 });
    expect(detectVirtualPair(cellsOf('[]'), 1)).toEqual({ openerIndex: 0, closerIndex: 1 });
    expect(detectVirtualPair(cellsOf('""'), 1)).toEqual({ openerIndex: 0, closerIndex: 1 });
    expect(detectVirtualPair(cellsOf("''"), 1)).toEqual({ openerIndex: 0, closerIndex: 1 });
    expect(detectVirtualPair(cellsOf('{}'), 1)).toEqual({ openerIndex: 0, closerIndex: 1 });
  });

  it('does not virtual-pair when content follows', () => {
    expect(detectVirtualPair(cellsOf('(x)'), 1)).toBeNull();
    expect(detectVirtualPair(cellsOf('"hi"'), 1)).toBeNull();
  });

  it('virtual-pairs empty call at end of longer snippet', () => {
    expect(detectVirtualPair(cellsOf('func()'), 5)).toEqual({ openerIndex: 4, closerIndex: 5 });
  });

  it('does not virtual-pair opening triple quotes', () => {
    expect(detectVirtualPair(cellsOf('"""'), 1)).toBeNull();
    expect(detectVirtualPair(cellsOf('"""'), 2)).toBeNull();
  });

  it('virtual-pairs empty string at end of line', () => {
    expect(detectVirtualPair(cellsOf('x=""'), 3)).toEqual({ openerIndex: 2, closerIndex: 3 });
  });
});

describe('getAutoCloseCount', () => {
  it('mirrors detectVirtualPair for compatibility', () => {
    expect(getAutoCloseCount(cellsOf('()'), 1)).toBe(1);
    expect(getAutoCloseCount(cellsOf('(x)'), 1)).toBe(0);
    expect(getAutoCloseCount(cellsOf('"""'), 1)).toBe(0);
  });
});
