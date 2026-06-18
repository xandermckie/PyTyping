import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useSettings } from './SettingsContext';
import {
  DEFAULT_POMODORO,
  loadPomodoroState,
  phaseLabel,
  resetPomodoro,
  savePomodoroState,
  tickPomodoro,
  type PomodoroPhase,
  type PomodoroRunState,
  type PomodoroState,
} from '../lib/pomodoro';
import { playPhaseChime } from '../lib/sound';

interface PomodoroContextValue {
  phase: PomodoroPhase;
  runState: PomodoroRunState;
  secondsLeft: number;
  minimized: boolean;
  phaseLabel: string;
  start: () => void;
  pause: () => void;
  reset: () => void;
  toggleMinimized: () => void;
}

const PomodoroContext = createContext<PomodoroContextValue | null>(null);

export function PomodoroProvider({ children }: { children: ReactNode }) {
  const { settings } = useSettings();
  const [state, setState] = useState<PomodoroState>(() => loadPomodoroState());

  const persist = useCallback((next: PomodoroState) => {
    setState(next);
    savePomodoroState(next);
  }, []);

  useEffect(() => {
    if (state.runState !== 'running') return;
    const id = window.setInterval(() => {
      setState((prev) => {
        const { next, phaseComplete } = tickPomodoro(prev);
        if (phaseComplete && settings.soundEnabled) playPhaseChime();
        if (next !== prev) savePomodoroState(next);
        return next;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [state.runState, settings.soundEnabled]);

  const start = useCallback(() => {
    persist({ ...state, runState: 'running' });
  }, [persist, state]);

  const pause = useCallback(() => {
    persist({ ...state, runState: state.runState === 'running' ? 'paused' : 'running' });
  }, [persist, state]);

  const reset = useCallback(() => {
    persist(resetPomodoro(state));
  }, [persist, state]);

  const toggleMinimized = useCallback(() => {
    persist({ ...state, minimized: !state.minimized });
  }, [persist, state]);

  const value = useMemo<PomodoroContextValue>(
    () => ({
      phase: state.phase,
      runState: state.runState,
      secondsLeft: state.secondsLeft,
      minimized: state.minimized,
      phaseLabel: phaseLabel(state.phase),
      start,
      pause,
      reset,
      toggleMinimized,
    }),
    [state, start, pause, reset, toggleMinimized],
  );

  return <PomodoroContext.Provider value={value}>{children}</PomodoroContext.Provider>;
}

export function usePomodoro(): PomodoroContextValue {
  const ctx = useContext(PomodoroContext);
  if (!ctx) throw new Error('usePomodoro must be used within PomodoroProvider');
  return ctx;
}

/** @internal Reset to defaults for tests. */
export function defaultPomodoroForTests(): PomodoroState {
  return { ...DEFAULT_POMODORO };
}
