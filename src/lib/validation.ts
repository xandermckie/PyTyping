/**
 * Runtime type guards and validators. Everything that crosses a trust boundary
 * — bundled JSON (could be edited badly), localStorage (could be corrupted or
 * tampered with), and imported backup/theme files (fully user-supplied) — is
 * validated here before the app trusts it. Validators never throw: they return
 * a cleaned value or a safe fallback, so bad data degrades instead of crashing.
 */
import type { Difficulty, Exercise, QuizQuestion } from '../types/exercise';

/* ------------------------------- primitives ------------------------------- */

export function isString(v: unknown): v is string {
  return typeof v === 'string';
}
export function isNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}
export function isBoolean(v: unknown): v is boolean {
  return typeof v === 'boolean';
}
export function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}
export function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every(isString);
}

/** Strict hex color (#rgb or #rrggbb). The only color shape we ever apply. */
const HEX_RE = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
export function isValidHexColor(v: unknown): v is string {
  return isString(v) && HEX_RE.test(v);
}
/** Return v if it's a valid hex color, otherwise the fallback. Blocks any
 *  attempt to inject arbitrary CSS through a color field. */
export function sanitizeHexColor(v: unknown, fallback: string): string {
  return isValidHexColor(v) ? v : fallback;
}

const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'] as const;
function isDifficulty(v: unknown): v is Difficulty {
  return isString(v) && (DIFFICULTIES as readonly string[]).includes(v);
}

/* ------------------------------- exercises -------------------------------- */

function validateQuestion(raw: unknown): QuizQuestion | null {
  if (!isObject(raw)) return null;
  const { question, options, correctIndex, explanation } = raw;
  if (!isString(question) || !isStringArray(options) || options.length < 2) return null;
  if (!isNumber(correctIndex) || correctIndex < 0 || correctIndex >= options.length) return null;
  if (!isString(explanation)) return null;
  return { question, options, correctIndex, explanation };
}

/** Validate a single exercise; returns null if it's malformed (and gets skipped). */
export function validateExercise(raw: unknown): Exercise | null {
  if (!isObject(raw)) return null;
  const { id, title, description, difficulty, topics, sourceUrl, sourceLabel, estimatedTime, code, explanation, quiz } = raw;

  if (!isString(id) || !isString(title) || !isString(description)) return null;
  if (!isDifficulty(difficulty) || !isStringArray(topics)) return null;
  if (!isString(sourceUrl) || !isString(sourceLabel) || !isNumber(estimatedTime)) return null;
  if (!isString(code) || code.length === 0) return null;
  if (!isObject(explanation)) return null;

  const { overview, keyTerms, howItWorks, designPattern, relatedExercises } = explanation;
  if (!isString(overview) || !isString(howItWorks)) return null;
  if (!Array.isArray(keyTerms)) return null;
  const cleanTerms = keyTerms
    .filter((t): t is { term: string; definition: string } => isObject(t) && isString(t.term) && isString(t.definition))
    .map((t) => ({ term: t.term, definition: t.definition }));

  if (!Array.isArray(quiz)) return null;
  const cleanQuiz = quiz.map(validateQuestion).filter((q): q is QuizQuestion => q !== null);
  if (cleanQuiz.length === 0) return null;

  return {
    id,
    title,
    description,
    difficulty,
    topics,
    sourceUrl,
    sourceLabel,
    estimatedTime,
    code,
    explanation: {
      overview,
      keyTerms: cleanTerms,
      howItWorks,
      designPattern: isString(designPattern) ? designPattern : undefined,
      relatedExercises: isStringArray(relatedExercises) ? relatedExercises : [],
    },
    quiz: cleanQuiz,
  };
}

/** Validate the whole catalogue, dropping (and warning about) bad entries. */
export function validateExercises(raw: unknown): Exercise[] {
  if (!Array.isArray(raw)) return [];
  const out: Exercise[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    const ex = validateExercise(item);
    if (!ex) {
      if (import.meta.env.DEV) console.warn('[PyTyping] Skipping malformed exercise:', item);
      continue;
    }
    if (seen.has(ex.id)) {
      if (import.meta.env.DEV) console.warn('[PyTyping] Skipping duplicate exercise id:', ex.id);
      continue;
    }
    seen.add(ex.id);
    out.push(ex);
  }
  return out;
}
