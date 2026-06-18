import { beforeEach, describe, expect, it, vi } from 'vitest';
import { importBackup } from '../backup';

vi.mock('../storage', () => ({
  loadJSON: vi.fn(() => ({ kind: 'guest' })),
  loadValidated: vi.fn((_key: string, validate: (raw: unknown) => unknown) => validate(undefined)),
  saveJSON: vi.fn(() => true),
  removeKey: vi.fn(),
}));

vi.mock('../progress', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../progress')>();
  return {
    ...actual,
    clearProgress: vi.fn(),
    getProgress: vi.fn(() => ({})),
    getHistory: vi.fn(() => ({})),
    setProgress: vi.fn(() => true),
    setHistory: vi.fn(() => true),
  };
});

vi.mock('../replays', () => ({
  getAllReplays: vi.fn(() => ({})),
  exportReplayStore: vi.fn(() => ({})),
  importReplayStore: vi.fn(() => true),
  getFriendGhosts: vi.fn(() => []),
  saveFriendGhosts: vi.fn(() => true),
  clearAllReplays: vi.fn(),
  validateTypingReplay: vi.fn(),
}));

vi.mock('../race-rank', () => ({
  getRaceRankState: vi.fn(() => ({ peakRaceWpm: 0, racesCompleted: 0, lastRaceAt: '' })),
  importRaceRankState: vi.fn(() => true),
  clearRaceRank: vi.fn(),
  validateRaceRankState: vi.fn((raw: unknown) => raw ?? { peakRaceWpm: 0, racesCompleted: 0, lastRaceAt: '' }),
}));

describe('importBackup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects invalid JSON', () => {
    expect(importBackup('not json')).toEqual({ ok: false, error: 'That file is not valid JSON.' });
  });

  it('rejects non-pytyping backups', () => {
    expect(importBackup('{}')).toEqual({
      ok: false,
      error: 'This does not look like a PyTyping backup.',
    });
  });

  it('rejects unsupported backup versions', () => {
    expect(
      importBackup(JSON.stringify({ app: 'pytyping', version: 99, accounts: [] })),
    ).toEqual({
      ok: false,
      error: 'Unsupported backup version (expected 3).',
    });
  });

  it('accepts v2 backups', () => {
    const result = importBackup(JSON.stringify({ app: 'pytyping', version: 2, accounts: [] }));
    expect(result).toEqual({ ok: true });
  });

  it('accepts missing version for legacy backups', () => {
    const result = importBackup(JSON.stringify({ app: 'pytyping', accounts: [] }));
    expect(result).toEqual({ ok: true });
  });
});
