import { describe, expect, it } from 'vitest';
import {
  applyTabToCounters,
  computeAccuracy,
  undoCorrectKeystroke,
  type TypingCounters,
} from '../typing-stats';

describe('computeAccuracy', () => {
  it('returns 100 when no keystrokes yet', () => {
    expect(computeAccuracy(0, 0)).toBe(100);
  });

  it('clamps above 100%', () => {
    expect(computeAccuracy(4, 1)).toBe(100);
  });

  it('rounds normal ratios', () => {
    expect(computeAccuracy(9, 10)).toBe(90);
  });
});

describe('applyTabToCounters', () => {
  it('counts one keystroke per consumed space', () => {
    const counters: TypingCounters = { correct: 0, keystrokes: 0, errors: 0 };
    applyTabToCounters(counters, 4);
    expect(counters).toEqual({ correct: 4, keystrokes: 4, errors: 0 });
    expect(computeAccuracy(counters.correct, counters.keystrokes)).toBe(100);
  });

  it('records a single error keystroke when no spaces consumed', () => {
    const counters: TypingCounters = { correct: 0, keystrokes: 0, errors: 0 };
    applyTabToCounters(counters, 0);
    expect(counters).toEqual({ correct: 0, keystrokes: 1, errors: 1 });
  });
});

describe('undoCorrectKeystroke', () => {
  it('decrements correct and keystrokes together', () => {
    const counters: TypingCounters = { correct: 5, keystrokes: 6, errors: 1 };
    undoCorrectKeystroke(counters);
    expect(counters.correct).toBe(4);
    expect(counters.keystrokes).toBe(5);
    expect(computeAccuracy(counters.correct, counters.keystrokes)).toBe(80);
  });
});
