import { describe, expect, it } from 'vitest';
import type { Exercise } from '../../types/exercise';
import type { HistoryMap, ProgressMap } from '../progress';
import { getReviewQueue } from '../learning';

const exercise: Exercise = {
  id: 'ex-1',
  title: 'Sample',
  description: 'Test exercise',
  difficulty: 'beginner',
  topics: ['test'],
  sourceUrl: 'https://example.com',
  sourceLabel: 'Test',
  estimatedTime: 1,
  code: 'print(1)',
  explanation: {
    overview: 'Test',
    keyTerms: [],
    howItWorks: 'Test',
    relatedExercises: [],
  },
  quiz: [],
};

const exercises = [exercise];
const emptyHistory: HistoryMap = {};

describe('getReviewQueue', () => {
  it('does not queue exercises at or above 75% accuracy', () => {
    const progress: ProgressMap = {
      'ex-1': {
        exerciseId: 'ex-1',
        accuracy: 80,
        wpm: 50,
        errors: 2,
        quizCorrect: 3,
        quizTotal: 4,
        completedAt: '2024-01-01T00:00:00.000Z',
        attempts: 1,
      },
    };
    expect(getReviewQueue(exercises, progress, emptyHistory)).toHaveLength(0);
  });

  it('queues exercises below 75% accuracy', () => {
    const progress: ProgressMap = {
      'ex-1': {
        exerciseId: 'ex-1',
        accuracy: 70,
        wpm: 50,
        errors: 5,
        quizCorrect: 3,
        quizTotal: 4,
        completedAt: '2024-01-01T00:00:00.000Z',
        attempts: 1,
      },
    };
    const queue = getReviewQueue(exercises, progress, emptyHistory);
    expect(queue).toHaveLength(1);
    expect(queue[0].reason).toBe('Accuracy was 70% last time');
    expect(queue[0].dueInDays).toBe(0);
  });

  it('does not queue high performers even with old completion dates', () => {
    const progress: ProgressMap = {
      'ex-1': {
        exerciseId: 'ex-1',
        accuracy: 90,
        wpm: 50,
        errors: 0,
        quizCorrect: 4,
        quizTotal: 4,
        completedAt: '2020-01-01T00:00:00.000Z',
        attempts: 1,
      },
    };
    expect(getReviewQueue(exercises, progress, emptyHistory)).toHaveLength(0);
  });

  it('queues exercises below 75% quiz score when accuracy is fine', () => {
    const progress: ProgressMap = {
      'ex-1': {
        exerciseId: 'ex-1',
        accuracy: 95,
        wpm: 50,
        errors: 0,
        quizCorrect: 2,
        quizTotal: 4,
        completedAt: '2024-01-01T00:00:00.000Z',
        attempts: 1,
      },
    };
    const queue = getReviewQueue(exercises, progress, emptyHistory);
    expect(queue).toHaveLength(1);
    expect(queue[0].reason).toBe('Quiz score was 50%');
  });
});
