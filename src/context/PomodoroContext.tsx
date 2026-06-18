import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useSettings } from './SettingsContext';
import {
  DEFAULT_POMODORO,
  loadPomodoroState,
  phaseLabel,
  pomodoroConfigFromMinutes,
  resetPomodoro,
  savePomodoroState,
  tickPomodoro,
  type PomodoroPhase,
  type PomodoroRunState,
  type PomodoroState,
} from '../lib/pomodoro';
import { showPhaseNotification } from '../lib/notifications';
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
  setMinimized: (value: boolean) => void;
}

const PomodoroContext = createContext<PomodoroContextValue | null>(null);

export function PomodoroProvider({ children }: { children: ReactNode }) {
  const { settings } = useSettings();
  const [state, setState] = useState<PomodoroState>(() => loadPomodoroState());
  const config = useMemo(
    () => pomodoroConfigFromMinutes(settings.pomodoroFocusMinutes, settings.pomodoroBreakMinutes),
    [settings.pomodoroFocusMinutes, settings.pomodoroBreakMinutes],
  );

  const persist = useCallback((next: PomodoroState) => {
    setState(next);
    savePomodoroState(next);
  }, []);

  useEffect(() => {
    setState((prev) => {
      if (prev.runState !== 'idle') return prev;
      const next = {
        ...prev,
        secondsLeft: prev.phase === 'focus' ? config.focusSeconds : config.breakSeconds,
      };
      savePomodoroState(next);
      return next;
    });
  }, [config.focusSeconds, config.breakSeconds]);

  useEffect(() => {
    if (state.runState !== 'running') return;
    const id = window.setInterval(() => {
      setState((prev) => {
        const { next, phaseComplete } = tickPomodoro(prev, config);
        if (phaseComplete) {
          if (settings.soundEnabled) playPhaseChime();
          if (settings.pomodoroNotifications) showPhaseNotification(next.phase);
        }
        if (next !== prev) savePomodoroState(next);
        return next;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [state.runState, settings.soundEnabled, settings.pomodoroNotifications, config]);

  const start = useCallback(() => {
    persist({ ...state, runState: 'running' });
  }, [persist, state]);

  const pause = useCallback(() => {
    persist({ ...state, runState: state.runState === 'running' ? 'paused' : 'running' });
  }, [persist, state]);

  const reset = useCallback(() => {
    persist(resetPomodoro(state, config));
  }, [persist, state, config]);

  const toggleMinimized = useCallback(() => {
    persist({ ...state, minimized: !state.minimized });
  }, [persist, state]);

  const setMinimized = useCallback(
    (value: boolean) => {
      if (state.minimized !== value) persist({ ...state, minimized: value });
    },
    [persist, state],
  );

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
      setMinimized,
    }),
    [state, start, pause, reset, toggleMinimized, setMinimized],
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
