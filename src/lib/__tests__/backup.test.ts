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
      error: 'Unsupported backup version (expected 2).',
    });
  });

  it('accepts missing version for legacy backups', () => {
    const result = importBackup(JSON.stringify({ app: 'pytyping', accounts: [] }));
    expect(result).toEqual({ ok: true });
  });
});
