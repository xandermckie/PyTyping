import { loadValidated, saveJSON } from './storage';
import { isBoolean, isNumber, isObject } from './validation';

export type PomodoroPhase = 'focus' | 'break';
export type PomodoroRunState = 'idle' | 'running' | 'paused';

export const FOCUS_SECONDS = 25 * 60;
export const BREAK_SECONDS = 5 * 60;

export const POMODORO_KEY = 'pomodoro';

export interface PomodoroState {
  phase: PomodoroPhase;
  runState: PomodoroRunState;
  secondsLeft: number;
  minimized: boolean;
}

export const DEFAULT_POMODORO: PomodoroState = {
  phase: 'focus',
  runState: 'idle',
  secondsLeft: FOCUS_SECONDS,
  minimized: false,
};

export function validatePomodoroState(raw: unknown): PomodoroState {
  const out: PomodoroState = { ...DEFAULT_POMODORO };
  if (!isObject(raw)) return out;
  if (raw.phase === 'focus' || raw.phase === 'break') out.phase = raw.phase;
  if (raw.runState === 'idle' || raw.runState === 'running' || raw.runState === 'paused') {
    out.runState = raw.runState;
  }
  if (isNumber(raw.secondsLeft)) {
    out.secondsLeft = Math.max(0, Math.min(99 * 60, Math.round(raw.secondsLeft)));
  }
  if (isBoolean(raw.minimized)) out.minimized = raw.minimized;
  return out;
}

export function loadPomodoroState(): PomodoroState {
  return loadValidated(POMODORO_KEY, validatePomodoroState);
}

export function savePomodoroState(state: PomodoroState): boolean {
  return saveJSON(POMODORO_KEY, state);
}

export function phaseDuration(phase: PomodoroPhase): number {
  return phase === 'focus' ? FOCUS_SECONDS : BREAK_SECONDS;
}

export function formatPomodoroTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** Advance timer by one second; returns new state and whether phase flipped. */
export function tickPomodoro(state: PomodoroState): { next: PomodoroState; phaseComplete: boolean } {
  if (state.runState !== 'running' || state.secondsLeft <= 0) {
    return { next: state, phaseComplete: false };
  }
  const secondsLeft = state.secondsLeft - 1;
  if (secondsLeft > 0) {
    return { next: { ...state, secondsLeft }, phaseComplete: false };
  }
  const nextPhase: PomodoroPhase = state.phase === 'focus' ? 'break' : 'focus';
  return {
    next: {
      ...state,
      phase: nextPhase,
      secondsLeft: phaseDuration(nextPhase),
      runState: 'running',
    },
    phaseComplete: true,
  };
}

export function resetPomodoro(state: PomodoroState): PomodoroState {
  return {
    ...state,
    runState: 'idle',
    secondsLeft: phaseDuration(state.phase),
  };
}

export function phaseLabel(phase: PomodoroPhase): string {
  return phase === 'focus' ? 'Focus' : 'Break';
}

/** @internal For tests — guard against corrupted storage strings. */
export function isValidPhase(value: string): value is PomodoroPhase {
  return value === 'focus' || value === 'break';
}
