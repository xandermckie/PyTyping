import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getRankForWpm, recordRaceResult } from '../race-rank';

const store = new Map<string, string>();

vi.mock('../storage', () => ({
  loadValidated: vi.fn((key: string, validate: (raw: unknown) => unknown) => {
    const raw = store.get(key);
    return validate(raw ? JSON.parse(raw) : undefined);
  }),
  saveJSON: vi.fn((key: string, value: unknown) => {
    store.set(key, JSON.stringify(value));
    return true;
  }),
  removeKey: vi.fn((key: string) => {
    store.delete(key);
  }),
}));

describe('getRankForWpm', () => {
  it('maps thresholds correctly', () => {
    expect(getRankForWpm(39)).toBe('bronze');
    expect(getRankForWpm(40)).toBe('silver');
    expect(getRankForWpm(60)).toBe('gold');
    expect(getRankForWpm(80)).toBe('platinum');
    expect(getRankForWpm(100)).toBe('diamond');
  });
});

describe('recordRaceResult', () => {
  beforeEach(() => {
    store.clear();
  });

  it('only increases peak WPM', () => {
    recordRaceResult('user-1', 50);
    const second = recordRaceResult('user-1', 40);
    expect(second.state.peakRaceWpm).toBe(50);
    expect(second.rankedUp).toBe(false);
  });

  it('detects rank up', () => {
    const result = recordRaceResult('user-2', 65);
    expect(result.newRank).toBe('gold');
    expect(result.rankedUp).toBe(true);
  });
});
