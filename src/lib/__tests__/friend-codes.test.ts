import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { TypingReplay } from '../../types/replay';

const mem = new Map<string, string>();

vi.mock('../storage', () => ({
  loadJSON: <T>(key: string, fallback: T): T => {
    const raw = mem.get(`pytyping:${key}`);
    if (raw == null) return fallback;
    return JSON.parse(raw) as T;
  },
  loadValidated: <T>(key: string, validate: (raw: unknown) => T): T => {
    const raw = mem.get(`pytyping:${key}`);
    return validate(raw == null ? undefined : JSON.parse(raw));
  },
  saveJSON: <T>(key: string, value: T): boolean => {
    mem.set(`pytyping:${key}`, JSON.stringify(value));
    return true;
  },
  removeKey: (key: string): void => {
    mem.delete(`pytyping:${key}`);
  },
}));

import { encodeFriendCode, decodeFriendCode, FRIEND_CODE_PREFIX } from '../friend-codes';
import { buildFriendShareBundle } from '../friend-share';

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

describe('friend codes', () => {
  beforeEach(() => {
    mem.clear();
  });

  it('roundtrips encode and decode', () => {
    const bundle = buildFriendShareBundle('Alice', [SAMPLE]);
    expect(bundle).not.toBeNull();
    if (!bundle) return;
    const encoded = encodeFriendCode(bundle);
    expect(encoded.ok).toBe(true);
    if (!encoded.ok) return;
    expect(encoded.code.startsWith(FRIEND_CODE_PREFIX)).toBe(true);
    const decoded = decodeFriendCode(encoded.code);
    expect(decoded.ok).toBe(true);
    if (decoded.ok) {
      expect(decoded.friend.displayName).toBe('Alice');
      expect(decoded.replays[0].id).toBe('r1');
    }
  });

  it('rejects invalid prefix', () => {
    expect(decodeFriendCode('BAD:abc').ok).toBe(false);
  });

  it('rejects empty payload', () => {
    expect(decodeFriendCode(`${FRIEND_CODE_PREFIX}`).ok).toBe(false);
  });
});
