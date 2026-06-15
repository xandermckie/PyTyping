/**
 * Per-exercise progress, scoped per user profile and persisted to localStorage.
 * We keep the user's *best* attempt per exercise (highest combined accuracy +
 * quiz score). Every read is validated so corrupted storage can't crash stats.
 */
import { loadValidated, saveJSON, removeKey } from './storage';
import { isNumber, isObject, isString } from './validation';

export interface CompletionRecord {
  exerciseId: string;
  /** Typing accuracy 0–100. */
  accuracy: number;
  wpm: number;
  errors: number;
  quizCorrect: number;
  quizTotal: number;
  /** ISO timestamp of this attempt. */
  completedAt: string;
  /** How many times this exercise has been completed. */
  attempts: number;
}

export type ProgressMap = Record<string, CompletionRecord>;

export function progressKey(profileId: string): string {
  return `progress:${profileId}`;
}

function validateRecord(raw: unknown): CompletionRecord | null {
  if (!isObject(raw)) return null;
  const { exerciseId, accuracy, wpm, errors, quizCorrect, quizTotal, completedAt, attempts } = raw;
  if (!isString(exerciseId)) return null;
  if (![accuracy, wpm, errors, quizCorrect, quizTotal].every(isNumber)) return null;
  return {
    exerciseId,
    accuracy: accuracy as number,
    wpm: wpm as number,
    errors: errors as number,
    quizCorrect: quizCorrect as number,
    quizTotal: quizTotal as number,
    completedAt: isString(completedAt) ? completedAt : new Date().toISOString(),
    attempts: isNumber(attempts) && attempts > 0 ? attempts : 1,
  };
}

export function validateProgressMap(raw: unknown): ProgressMap {
  if (!isObject(raw)) return {};
  const out: ProgressMap = {};
  for (const [key, value] of Object.entries(raw)) {
    const rec = validateRecord(value);
    if (rec) out[key] = rec;
  }
  return out;
}

export function getProgress(profileId: string): ProgressMap {
  return loadValidated(progressKey(profileId), validateProgressMap);
}

export function setProgress(profileId: string, map: ProgressMap): void {
  saveJSON(progressKey(profileId), map);
}

export function clearProgress(profileId: string): void {
  removeKey(progressKey(profileId));
}

/** A run is "better" if its (accuracy + quiz%) sum is higher. */
function score(r: Pick<CompletionRecord, 'accuracy' | 'quizCorrect' | 'quizTotal'>): number {
  const quizPct = r.quizTotal > 0 ? (r.quizCorrect / r.quizTotal) * 100 : 0;
  return r.accuracy + quizPct;
}

export function recordCompletion(
  profileId: string,
  entry: Omit<CompletionRecord, 'completedAt' | 'attempts'>,
): CompletionRecord {
  const all = getProgress(profileId);
  const prev = all[entry.exerciseId];
  const attempts = (prev?.attempts ?? 0) + 1;

  const candidate: CompletionRecord = { ...entry, completedAt: new Date().toISOString(), attempts };
  // Keep the higher-scoring run, but always bump attempts + timestamp.
  const best =
    prev && score(prev) >= score(candidate)
      ? { ...prev, attempts, completedAt: candidate.completedAt }
      : candidate;

  all[entry.exerciseId] = best;
  setProgress(profileId, all);
  return best;
}

export function isCompleted(profileId: string, exerciseId: string): boolean {
  return Boolean(getProgress(profileId)[exerciseId]);
}
