import { describe, expect, it } from 'vitest';
import { validateHistoryMap, validateProgressMap } from '../progress';

describe('validateProgressMap', () => {
  it('clamps out-of-range stats', () => {
    const map = validateProgressMap({
      ex1: {
        exerciseId: 'ex1',
        accuracy: 150,
        wpm: 9999,
        errors: -3,
        quizCorrect: 2,
        quizTotal: 5,
        completedAt: '2024-01-01T00:00:00.000Z',
        attempts: 1,
      },
    });
    expect(map.ex1.accuracy).toBe(100);
    expect(map.ex1.wpm).toBe(500);
    expect(map.ex1.errors).toBe(0);
    expect(map.ex1.quizCorrect).toBe(2);
    expect(map.ex1.quizTotal).toBe(5);
  });

  it('drops records where quizCorrect exceeds quizTotal', () => {
    const map = validateProgressMap({
      ex1: {
        exerciseId: 'ex1',
        accuracy: 90,
        wpm: 50,
        errors: 1,
        quizCorrect: 5,
        quizTotal: 3,
        completedAt: '2024-01-01T00:00:00.000Z',
        attempts: 1,
      },
    });
    expect(map.ex1).toBeUndefined();
  });
});

describe('validateHistoryMap', () => {
  it('clamps attempt stats', () => {
    const map = validateHistoryMap({
      ex1: [
        {
          wpm: -10,
          accuracy: 200,
          errors: 0,
          quizCorrect: 1,
          quizTotal: 2,
          at: '2024-01-01T00:00:00.000Z',
        },
      ],
    });
    expect(map.ex1[0].wpm).toBe(0);
    expect(map.ex1[0].accuracy).toBe(100);
  });
});
