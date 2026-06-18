import { describe, expect, it } from 'vitest';
import {
  BREAK_SECONDS,
  DEFAULT_POMODORO,
  FOCUS_SECONDS,
  formatPomodoroTime,
  phaseDuration,
  pomodoroConfigFromMinutes,
  resetPomodoro,
  tickPomodoro,
} from '../pomodoro';

describe('tickPomodoro', () => {
  it('does not tick when idle', () => {
    const { next, phaseComplete } = tickPomodoro(DEFAULT_POMODORO);
    expect(next.secondsLeft).toBe(FOCUS_SECONDS);
    expect(phaseComplete).toBe(false);
  });

  it('counts down when running', () => {
    const running = { ...DEFAULT_POMODORO, runState: 'running' as const, secondsLeft: 3 };
    const { next } = tickPomodoro(running);
    expect(next.secondsLeft).toBe(2);
  });

  it('switches to break when focus completes', () => {
    const running = { ...DEFAULT_POMODORO, runState: 'running' as const, secondsLeft: 1 };
    const { next, phaseComplete } = tickPomodoro(running);
    expect(phaseComplete).toBe(true);
    expect(next.phase).toBe('break');
    expect(next.secondsLeft).toBe(BREAK_SECONDS);
  });
});

describe('resetPomodoro', () => {
  it('resets to phase duration and idle', () => {
    const mid = { ...DEFAULT_POMODORO, runState: 'running' as const, secondsLeft: 42 };
    const reset = resetPomodoro(mid);
    expect(reset.runState).toBe('idle');
    expect(reset.secondsLeft).toBe(FOCUS_SECONDS);
  });
});

describe('formatPomodoroTime', () => {
  it('formats mm:ss', () => {
    expect(formatPomodoroTime(125)).toBe('2:05');
    expect(formatPomodoroTime(FOCUS_SECONDS)).toBe('25:00');
  });
});

describe('phaseDuration', () => {
  it('returns focus and break lengths', () => {
    expect(phaseDuration('focus')).toBe(FOCUS_SECONDS);
    expect(phaseDuration('break')).toBe(BREAK_SECONDS);
  });

  it('uses custom config', () => {
    const config = pomodoroConfigFromMinutes(10, 3);
    expect(phaseDuration('focus', config)).toBe(600);
    expect(phaseDuration('break', config)).toBe(180);
  });
});

describe('custom durations', () => {
  it('ticks with custom config', () => {
    const config = pomodoroConfigFromMinutes(10, 3);
    const running = { ...DEFAULT_POMODORO, runState: 'running' as const, secondsLeft: 1 };
    const { next, phaseComplete } = tickPomodoro(running, config);
    expect(phaseComplete).toBe(true);
    expect(next.secondsLeft).toBe(180);
  });
});
