export interface TypingCounters {
  correct: number;
  keystrokes: number;
  errors: number;
}

/** Correct keystrokes / total keystrokes, clamped to 0–100. */
export function computeAccuracy(correct: number, keystrokes: number): number {
  if (keystrokes <= 0) return 100;
  const raw = (correct / keystrokes) * 100;
  return Math.min(100, Math.max(0, Math.round(raw)));
}

/** Apply Tab expansion stats: one keystroke per space consumed, or one error keystroke. */
export function applyTabToCounters(counters: TypingCounters, consumed: number): void {
  if (consumed > 0) {
    counters.keystrokes += consumed;
    counters.correct += consumed;
  } else {
    counters.keystrokes += 1;
    counters.errors += 1;
  }
}

/** Undo the last successful character when backspacing (not when clearing an error). */
export function undoCorrectKeystroke(counters: TypingCounters): void {
  counters.correct = Math.max(0, counters.correct - 1);
  counters.keystrokes = Math.max(0, counters.keystrokes - 1);
}
