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

import {
  buildFriendShareBundle,
  exportFriendShareJson,
  importFriendShareJson,
} from '../friend-share';
import { getFriendGhosts, importGhostReplay } from '../replays';

const TINY_JPEG =
  'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A/9k=';

const SAMPLE: TypingReplay = {
  id: 'r1',
  exerciseId: 'ex-1',
  codeLength: 10,
  playerName: 'alice',
  recordedAt: '2024-01-01T00:00:00.000Z',
  events: [
    { ms: 0, cursor: 1 },
    { ms: 1000, cursor: 10 },
  ],
  wpm: 40,
  accuracy: 98,
};

describe('friend-share', () => {
  beforeEach(() => {
    mem.clear();
  });

  it('builds and exports a bundle', () => {
    const bundle = buildFriendShareBundle('Bob', [SAMPLE], TINY_JPEG);
    expect(bundle?.app).toBe('pytyping-friend');
    expect(bundle?.avatarPhoto).toBe(TINY_JPEG);
    const json = exportFriendShareJson(bundle!);
    expect(json).toContain('pytyping-friend');
  });

  it('imports bundle and merges by display name', () => {
    const bundle = buildFriendShareBundle('Bob', [SAMPLE])!;
    const first = importFriendShareJson(exportFriendShareJson(bundle));
    expect(first.ok).toBe(true);

    const updated = buildFriendShareBundle('Bob', [{ ...SAMPLE, id: 'r2', wpm: 50 }])!;
    const second = importFriendShareJson(exportFriendShareJson(updated));
    expect(second.ok).toBe(true);
    if (second.ok) {
      expect(second.friend.replays).toHaveLength(2);
    }
    expect(getFriendGhosts()).toHaveLength(1);
  });

  it('still accepts legacy single-replay ghost files', () => {
    const legacy = JSON.stringify({ app: 'pytyping-ghost', version: 1, replay: SAMPLE });
    expect(importGhostReplay(legacy).ok).toBe(true);
    const viaShare = importFriendShareJson(legacy);
    expect(viaShare.ok).toBe(true);
  });
});
