/**
 * Per-exercise progress, scoped per user profile and persisted to localStorage.
 * We keep the user's *best* attempt per exercise (highest combined accuracy +
 * quiz score). Every read is validated so corrupted storage can't crash stats.
 */
import { loadValidated, saveJSON, removeKey } from './storage';
import { clampNumber, isNumber, isObject, isString } from './validation';

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

/** One row in an exercise's attempt history (drives round-to-round trends). */
export interface AttemptSummary {
  wpm: number;
  accuracy: number;
  errors: number;
  quizCorrect: number;
  quizTotal: number;
  /** ISO timestamp. */
  at: string;
}

/** exerciseId -> chronological attempts (oldest first). */
export type HistoryMap = Record<string, AttemptSummary[]>;

/** Keep only the most recent N attempts per exercise to bound storage. */
const HISTORY_CAP = 25;

const MAX_WPM = 500;
const MAX_ERRORS = 10_000;
const MAX_QUIZ_TOTAL = 100;
const MAX_ATTEMPTS = 10_000;

function sanitizeQuizPair(quizCorrect: number, quizTotal: number): { quizCorrect: number; quizTotal: number } | null {
  if (quizCorrect > quizTotal) return null;
  const total = clampNumber(Math.round(quizTotal), 0, MAX_QUIZ_TOTAL);
  const correct = clampNumber(Math.round(quizCorrect), 0, total);
  return { quizCorrect: correct, quizTotal: total };
}

function sanitizeStats(
  wpm: number,
  accuracy: number,
  errors: number,
  quizCorrect: number,
  quizTotal: number,
): { wpm: number; accuracy: number; errors: number; quizCorrect: number; quizTotal: number } | null {
  const quiz = sanitizeQuizPair(quizCorrect, quizTotal);
  if (!quiz) return null;
  return {
    wpm: clampNumber(wpm, 0, MAX_WPM),
    accuracy: clampNumber(accuracy, 0, 100),
    errors: clampNumber(Math.round(errors), 0, MAX_ERRORS),
    ...quiz,
  };
}

export function progressKey(profileId: string): string {
  return `progress:${profileId}`;
}

export function historyKey(profileId: string): string {
  return `history:${profileId}`;
}

/**
 * Guest progress is intentionally ephemeral — it lives in sessionStorage and is
 * gone when the browser session ends. Account progress lives in localStorage so
 * it persists on the device. This is the concrete difference between "just
 * cached" (guest) and "saved" (logged in).
 */
function pickStore(profileId: string): Storage | undefined {
  try {
    return profileId === 'guest' ? window.sessionStorage : window.localStorage;
  } catch {
    return undefined;
  }
}

function validateRecord(raw: unknown): CompletionRecord | null {
  if (!isObject(raw)) return null;
  const { exerciseId, accuracy, wpm, errors, quizCorrect, quizTotal, completedAt, attempts } = raw;
  if (!isString(exerciseId)) return null;
  if (![accuracy, wpm, errors, quizCorrect, quizTotal].every(isNumber)) return null;

  const stats = sanitizeStats(
    wpm as number,
    accuracy as number,
    errors as number,
    quizCorrect as number,
    quizTotal as number,
  );
  if (!stats) return null;

  return {
    exerciseId,
    ...stats,
    completedAt: isString(completedAt) ? completedAt : new Date().toISOString(),
    attempts: isNumber(attempts) && attempts > 0 ? clampNumber(Math.round(attempts), 1, MAX_ATTEMPTS) : 1,
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
  return loadValidated(progressKey(profileId), validateProgressMap, pickStore(profileId));
}

export function setProgress(profileId: string, map: ProgressMap): boolean {
  return saveJSON(progressKey(profileId), map, pickStore(profileId));
}

export function clearProgress(profileId: string): void {
  const store = pickStore(profileId);
  removeKey(progressKey(profileId), store);
  removeKey(historyKey(profileId), store);
}

/** Copy one scope's progress + history onto another (guest → account on signup). */
export function copyScope(fromId: string, toId: string): boolean {
  return setProgress(toId, getProgress(fromId)) && setHistory(toId, getHistory(fromId));
}

/* ----------------------------- attempt history ---------------------------- */

function validateAttempt(raw: unknown): AttemptSummary | null {
  if (!isObject(raw)) return null;
  const { wpm, accuracy, errors, quizCorrect, quizTotal, at } = raw;
  if (![wpm, accuracy, errors, quizCorrect, quizTotal].every(isNumber)) return null;

  const stats = sanitizeStats(
    wpm as number,
    accuracy as number,
    errors as number,
    quizCorrect as number,
    quizTotal as number,
  );
  if (!stats) return null;

  return {
    ...stats,
    at: isString(at) ? at : new Date().toISOString(),
  };
}

export function validateHistoryMap(raw: unknown): HistoryMap {
  if (!isObject(raw)) return {};
  const out: HistoryMap = {};
  for (const [key, value] of Object.entries(raw)) {
    if (!Array.isArray(value)) continue;
    const attempts = value.map(validateAttempt).filter((a): a is AttemptSummary => a !== null);
    if (attempts.length) out[key] = attempts.slice(-HISTORY_CAP);
  }
  return out;
}

export function getHistory(profileId: string): HistoryMap {
  return loadValidated(historyKey(profileId), validateHistoryMap, pickStore(profileId));
}

export function setHistory(profileId: string, map: HistoryMap): boolean {
  return saveJSON(historyKey(profileId), map, pickStore(profileId));
}

export function getAttempts(profileId: string, exerciseId: string): AttemptSummary[] {
  return getHistory(profileId)[exerciseId] ?? [];
}

function appendAttempt(profileId: string, exerciseId: string, attempt: AttemptSummary): boolean {
  const history = getHistory(profileId);
  const list = history[exerciseId] ?? [];
  history[exerciseId] = [...list, attempt].slice(-HISTORY_CAP);
  return setHistory(profileId, history);
}

/** A run is "better" if its (accuracy + quiz%) sum is higher. */
function score(r: Pick<CompletionRecord, 'accuracy' | 'quizCorrect' | 'quizTotal'>): number {
  const quizPct = r.quizTotal > 0 ? (r.quizCorrect / r.quizTotal) * 100 : 0;
  return r.accuracy + quizPct;
}

export function recordCompletion(
  profileId: string,
  entry: Omit<CompletionRecord, 'completedAt' | 'attempts'>,
): { record: CompletionRecord; saved: boolean } {
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
  const progressSaved = setProgress(profileId, all);

  // Always log this attempt to history so the user can track round-to-round
  // improvement, even when it wasn't their best run.
  const historySaved = appendAttempt(profileId, entry.exerciseId, {
    wpm: entry.wpm,
    accuracy: entry.accuracy,
    errors: entry.errors,
    quizCorrect: entry.quizCorrect,
    quizTotal: entry.quizTotal,
    at: candidate.completedAt,
  });

  return { record: best, saved: progressSaved && historySaved };
}

export function isCompleted(profileId: string, exerciseId: string): boolean {
  return Boolean(getProgress(profileId)[exerciseId]);
}
