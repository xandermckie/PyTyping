import type { ReplayEvent, SyntheticGhostTier, TypingReplay } from '../types/replay';

interface TierConfig {
  label: string;
  wpmMin: number;
  wpmMax: number;
  accuracyMin: number;
  accuracyMax: number;
}

const TIERS: Record<SyntheticGhostTier, TierConfig> = {
  easy: { label: 'Easy ghost', wpmMin: 25, wpmMax: 40, accuracyMin: 92, accuracyMax: 96 },
  medium: { label: 'Medium ghost', wpmMin: 41, wpmMax: 60, accuracyMin: 94, accuracyMax: 97 },
  hard: { label: 'Hard ghost', wpmMin: 61, wpmMax: 85, accuracyMin: 96, accuracyMax: 98 },
  extreme: { label: 'Extreme ghost', wpmMin: 86, wpmMax: 110, accuracyMin: 97, accuracyMax: 99 },
  creator: { label: 'The Creator', wpmMin: 102, wpmMax: 102, accuracyMin: 97, accuracyMax: 97 },
};

/** Deterministic PRNG (mulberry32) from a string seed. */
export function hashSeed(input: string): number {
  let h = 1779033703 ^ input.length;
  for (let i = 0; i < input.length; i += 1) {
    h = Math.imul(h ^ input.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let s = seed;
  return () => {
    s += 0x6d2b79f5;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randomInRange(rng: () => number, min: number, max: number): number {
  if (min === max) return min;
  return Math.round(min + rng() * (max - min));
}

export function tierWpmForExercise(exerciseId: string, tier: SyntheticGhostTier): number {
  const cfg = TIERS[tier];
  const rng = mulberry32(hashSeed(`${exerciseId}:${tier}`));
  return randomInRange(rng, cfg.wpmMin, cfg.wpmMax);
}

export function tierAccuracyForExercise(exerciseId: string, tier: SyntheticGhostTier): number {
  const cfg = TIERS[tier];
  const rng = mulberry32(hashSeed(`${exerciseId}:${tier}:acc`));
  return randomInRange(rng, cfg.accuracyMin, cfg.accuracyMax);
}

export function tierLabel(tier: SyntheticGhostTier): string {
  return TIERS[tier].label;
}

export function buildSyntheticEvents(codeLen: number, wpm: number): ReplayEvent[] {
  if (codeLen <= 0 || wpm <= 0) return [];
  const msPerChar = 60000 / (wpm * 5);
  const events: ReplayEvent[] = [];
  for (let cursor = 1; cursor <= codeLen; cursor += 1) {
    events.push({ ms: Math.round(cursor * msPerChar), cursor });
  }
  return events;
}

export function buildSyntheticReplay(
  exerciseId: string,
  len: number,
  tier: SyntheticGhostTier,
): TypingReplay {
  const wpm = tierWpmForExercise(exerciseId, tier);
  const accuracy = tierAccuracyForExercise(exerciseId, tier);
  const events = buildSyntheticEvents(len, wpm);
  return {
    id: `builtin:${tier}:${exerciseId}`,
    exerciseId,
    codeLength: len,
    playerName: tierLabel(tier),
    recordedAt: new Date().toISOString(),
    events,
    wpm,
    accuracy,
  };
}

export const BUILTIN_TIERS: SyntheticGhostTier[] = ['easy', 'medium', 'hard', 'extreme', 'creator'];
