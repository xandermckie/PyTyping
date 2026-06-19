import { useEffect, useRef } from 'react';
import { formatPomodoroTime } from '../lib/pomodoro';
import { usePomodoro } from '../context/PomodoroContext';

interface PomodoroWidgetProps {
  chromeHidden?: boolean;
}

export default function PomodoroWidget({ chromeHidden = false }: PomodoroWidgetProps) {
  const { phase, runState, secondsLeft, minimized, phaseLabel, start, pause, reset, skip, setMinimized } =
    usePomodoro();
  const autoMinimizedRef = useRef(false);

  useEffect(() => {
    if (chromeHidden && !minimized && !autoMinimizedRef.current) {
      autoMinimizedRef.current = true;
      setMinimized(true);
    }
    if (!chromeHidden) autoMinimizedRef.current = false;
  }, [chromeHidden, minimized, setMinimized]);

  if (chromeHidden && minimized) return null;

  const timeLabel = formatPomodoroTime(secondsLeft);
  const isRunning = runState === 'running';
  const isIdle = runState === 'idle';

  if (minimized) {
    return (
      <button
        type="button"
        onClick={() => setMinimized(false)}
        className="pointer-events-auto fixed bottom-4 right-4 z-40 flex items-center gap-2 rounded-full border border-border-tertiary bg-background-primary px-4 py-2 text-sm shadow-[var(--shadow-md)]"
        role="timer"
        aria-label={`${phaseLabel} timer, ${timeLabel}`}
      >
        <span
          className={`h-2 w-2 rounded-full ${phase === 'focus' ? 'bg-accent' : 'bg-[var(--color-warning,#e8a838)]'}`}
          aria-hidden="true"
        />
        <span className="tabular-nums text-content-primary">{timeLabel}</span>
      </button>
    );
  }

  return (
    <div
      className="pointer-events-auto fixed bottom-4 right-4 z-40 w-56 rounded-lg border border-border-tertiary bg-background-primary p-4 shadow-[var(--shadow-md)]"
      role="timer"
      aria-live="polite"
      aria-label={`${phaseLabel} timer`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium uppercase tracking-wider text-content-tertiary">{phaseLabel}</span>
        <button
          type="button"
          onClick={() => setMinimized(true)}
          className="text-xs text-content-tertiary hover:text-content-secondary"
          aria-label="Minimize timer"
        >
          −
        </button>
      </div>
      <p className="mt-2 text-3xl font-semibold tabular-nums text-content-primary">{timeLabel}</p>
      <div className="mt-4 flex gap-2">
        {isIdle ? (
          <button
            type="button"
            onClick={start}
            className="flex-1 rounded-md border border-accent bg-[var(--color-accent-subtle)] py-1.5 text-sm font-medium text-accent"
          >
            Start
          </button>
        ) : (
          <button
            type="button"
            onClick={pause}
            className="flex-1 rounded-md border border-border-tertiary py-1.5 text-sm text-content-primary hover:bg-background-secondary"
          >
            {isRunning ? 'Pause' : 'Resume'}
          </button>
        )}
        <button
          type="button"
          onClick={skip}
          className="rounded-md border border-border-tertiary px-3 py-1.5 text-sm text-content-secondary hover:bg-background-secondary"
          aria-label={`Skip to ${phase === 'focus' ? 'break' : 'focus'}`}
          title={`Skip to ${phase === 'focus' ? 'break' : 'focus'}`}
        >
          Skip
        </button>
        <button
          type="button"
          onClick={reset}
          className="rounded-md border border-border-tertiary px-3 py-1.5 text-sm text-content-secondary hover:bg-background-secondary"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
