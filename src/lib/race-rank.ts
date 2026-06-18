import { loadValidated, removeKey, saveJSON } from './storage';
import { clampNumber, isNumber, isObject, isString } from './validation';

export type RaceRank = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

export interface RaceRankState {
  peakRaceWpm: number;
  racesCompleted: number;
  lastRaceAt: string;
}

export const RANK_THRESHOLDS: Array<{ rank: RaceRank; minWpm: number; label: string }> = [
  { rank: 'bronze', minWpm: 0, label: 'Bronze' },
  { rank: 'silver', minWpm: 40, label: 'Silver' },
  { rank: 'gold', minWpm: 60, label: 'Gold' },
  { rank: 'platinum', minWpm: 80, label: 'Platinum' },
  { rank: 'diamond', minWpm: 100, label: 'Diamond' },
];

const MAX_WPM = 500;

function raceRankKey(profileId: string): string {
  return `race-rank:${profileId}`;
}

function pickStore(profileId: string): Storage | undefined {
  try {
    return profileId === 'guest' ? window.sessionStorage : window.localStorage;
  } catch {
    return undefined;
  }
}

const DEFAULT_RANK: RaceRankState = {
  peakRaceWpm: 0,
  racesCompleted: 0,
  lastRaceAt: '',
};

export function validateRaceRankState(raw: unknown): RaceRankState {
  if (!isObject(raw)) return { ...DEFAULT_RANK };
  return {
    peakRaceWpm: isNumber(raw.peakRaceWpm) ? clampNumber(Math.round(raw.peakRaceWpm), 0, MAX_WPM) : 0,
    racesCompleted: isNumber(raw.racesCompleted) ? Math.max(0, Math.round(raw.racesCompleted)) : 0,
    lastRaceAt: isString(raw.lastRaceAt) ? raw.lastRaceAt : '',
  };
}

export function getRaceRankState(profileId: string): RaceRankState {
  return loadValidated(raceRankKey(profileId), validateRaceRankState, pickStore(profileId));
}

export function saveRaceRankState(profileId: string, state: RaceRankState): boolean {
  return saveJSON(raceRankKey(profileId), state, pickStore(profileId));
}

export function getRankForWpm(wpm: number): RaceRank {
  let rank: RaceRank = 'bronze';
  for (const t of RANK_THRESHOLDS) {
    if (wpm >= t.minWpm) rank = t.rank;
  }
  return rank;
}

export function rankLabel(rank: RaceRank): string {
  return RANK_THRESHOLDS.find((t) => t.rank === rank)?.label ?? 'Bronze';
}

export function rankColorClass(rank: RaceRank): string {
  switch (rank) {
    case 'bronze':
      return 'text-[var(--color-warning,#c9a227)]';
    case 'silver':
      return 'text-content-secondary';
    case 'gold':
      return 'text-[var(--color-warning,#e8a838)]';
    case 'platinum':
      return 'text-accent';
    case 'diamond':
      return 'text-[var(--color-success,#4ade80)]';
    default:
      return 'text-content-secondary';
  }
}

export function getNextRank(wpm: number): { rank: RaceRank; label: string; wpmNeeded: number } | null {
  for (const t of RANK_THRESHOLDS) {
    if (wpm < t.minWpm) {
      return { rank: t.rank, label: t.label, wpmNeeded: t.minWpm - wpm };
    }
  }
  return null;
}

export function rankSortValue(rank: RaceRank): number {
  return RANK_THRESHOLDS.findIndex((t) => t.rank === rank);
}

export interface RecordRaceResult {
  state: RaceRankState;
  previousRank: RaceRank;
  newRank: RaceRank;
  rankedUp: boolean;
}

export function recordRaceResult(profileId: string, wpm: number): RecordRaceResult {
  const prev = getRaceRankState(profileId);
  const previousRank = getRankForWpm(prev.peakRaceWpm);
  const peakRaceWpm = Math.max(prev.peakRaceWpm, clampNumber(Math.round(wpm), 0, MAX_WPM));
  const state: RaceRankState = {
    peakRaceWpm,
    racesCompleted: prev.racesCompleted + 1,
    lastRaceAt: new Date().toISOString(),
  };
  saveRaceRankState(profileId, state);
  const newRank = getRankForWpm(peakRaceWpm);
  return {
    state,
    previousRank,
    newRank,
    rankedUp: rankSortValue(newRank) > rankSortValue(previousRank),
  };
}

export function clearRaceRank(profileId: string): void {
  removeKey(raceRankKey(profileId), pickStore(profileId));
}

export function importRaceRankState(profileId: string, state: RaceRankState): boolean {
  return saveRaceRankState(profileId, validateRaceRankState(state));
}
