import { describe, expect, it } from 'vitest';
import {
  REPLAY_MAX_BYTES,
  getGhostCursorAt,
  getGhostFinishMs,
  importGhostReplay,
  validateTypingReplay,
} from '../replays';
import type { TypingReplay } from '../../types/replay';

const SAMPLE: TypingReplay = {
  id: 'r1',
  exerciseId: 'ex-1',
  codeLength: 10,
  playerName: 'alice',
  recordedAt: '2024-01-01T00:00:00.000Z',
  events: [
    { ms: 0, cursor: 1 },
    { ms: 500, cursor: 5 },
    { ms: 1000, cursor: 10 },
  ],
  wpm: 40,
  accuracy: 98,
};

describe('getGhostCursorAt', () => {
  it('returns 0 before first event', () => {
    expect(getGhostCursorAt(SAMPLE, -1)).toBe(0);
  });

  it('interpolates cursor by elapsed time', () => {
    expect(getGhostCursorAt(SAMPLE, 0)).toBe(1);
    expect(getGhostCursorAt(SAMPLE, 400)).toBe(1);
    expect(getGhostCursorAt(SAMPLE, 500)).toBe(5);
    expect(getGhostCursorAt(SAMPLE, 2000)).toBe(10);
  });
});

describe('getGhostFinishMs', () => {
  it('returns last event ms', () => {
    expect(getGhostFinishMs(SAMPLE)).toBe(1000);
  });
});

describe('importGhostReplay', () => {
  it('accepts valid export', () => {
    const json = JSON.stringify({ app: 'pytyping-ghost', version: 1, replay: SAMPLE });
    const result = importGhostReplay(json);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.replay.id).toBe('r1');
  });

  it('rejects invalid JSON', () => {
    expect(importGhostReplay('not json').ok).toBe(false);
  });

  it('rejects wrong app marker', () => {
    const json = JSON.stringify({ app: 'other', replay: SAMPLE });
    expect(importGhostReplay(json).ok).toBe(false);
  });

  it('rejects oversized files', () => {
    const huge = 'x'.repeat(REPLAY_MAX_BYTES + 1);
    expect(importGhostReplay(huge).ok).toBe(false);
  });
});

describe('validateTypingReplay', () => {
  it('rejects empty events', () => {
    expect(validateTypingReplay({ ...SAMPLE, events: [] })).toBeNull();
  });
});
