import { describe, expect, it } from 'vitest';
import {
  BUILTIN_TIERS,
  buildSyntheticReplay,
  tierWpmForExercise,
} from '../synthetic-ghosts';

describe('buildSyntheticReplay', () => {
  it('creator is fixed at 102 wpm and 97% accuracy', () => {
    const replay = buildSyntheticReplay('ex-1', 50, 'creator');
    expect(replay.wpm).toBe(102);
    expect(replay.accuracy).toBe(97);
    expect(replay.playerName).toBe('The Creator');
  });

  it('generates one event per character', () => {
    const replay = buildSyntheticReplay('ex-2', 20, 'easy');
    expect(replay.events).toHaveLength(20);
    expect(replay.events[19].cursor).toBe(20);
  });

  it('is deterministic for same exercise and tier', () => {
    const a = buildSyntheticReplay('hello-world', 30, 'medium');
    const b = buildSyntheticReplay('hello-world', 30, 'medium');
    expect(a.wpm).toBe(b.wpm);
    expect(a.events).toEqual(b.events);
  });

  it('rolls WPM within tier range', () => {
    for (const tier of BUILTIN_TIERS) {
      if (tier === 'creator') continue;
      const wpm = tierWpmForExercise('tier-test', tier);
      if (tier === 'easy') expect(wpm).toBeGreaterThanOrEqual(25);
      if (tier === 'easy') expect(wpm).toBeLessThanOrEqual(40);
      if (tier === 'extreme') expect(wpm).toBeGreaterThanOrEqual(86);
      if (tier === 'extreme') expect(wpm).toBeLessThanOrEqual(110);
    }
  });
});
