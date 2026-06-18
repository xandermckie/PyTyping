import { describe, expect, it, vi } from 'vitest';
import type { TypingReplay } from '../../types/replay';

const fast: TypingReplay = {
  id: 'r-fast',
  exerciseId: 'ex-1',
  codeLength: 5,
  playerName: 'alice',
  recordedAt: '2024-01-02',
  events: [
    { ms: 100, cursor: 3 },
    { ms: 200, cursor: 5 },
  ],
  wpm: 80,
  accuracy: 99,
};

const slow: TypingReplay = {
  ...fast,
  id: 'r-slow',
  events: [
    { ms: 500, cursor: 3 },
    { ms: 1000, cursor: 5 },
  ],
  wpm: 40,
};

vi.mock('../replays', () => ({
  getAllReplays: vi.fn(() => ({
    'ex-1': [slow, fast],
  })),
  getGhostFinishMs: vi.fn((r: TypingReplay) => r.events[r.events.length - 1].ms),
}));

import { getRaceRecords } from '../race-stats';
import type { Account } from '../auth';
import type { Exercise } from '../../types/exercise';

const accounts: Account[] = [
  {
    id: 'a1',
    username: 'alice',
    hash: 'abc',
    salt: 'y',
    avatarColor: '#000',
    createdAt: '2024-01-01',
  },
];

const exercises: Exercise[] = [
  {
    id: 'ex-1',
    title: 'Hello',
    description: '',
    difficulty: 'beginner',
    topics: [],
    sourceUrl: '',
    sourceLabel: 'test',
    estimatedTime: 5,
    code: 'print("hi")',
    quiz: [],
    explanation: {
      overview: '',
      howItWorks: '',
      keyTerms: [],
      relatedExercises: [],
    },
  },
];

describe('getRaceRecords', () => {
  it('picks fastest replay per account and exercise', () => {
    const records = getRaceRecords(accounts, exercises);
    expect(records).toHaveLength(1);
    expect(records[0].wpm).toBe(80);
    expect(records[0].finishMs).toBe(200);
  });
});
