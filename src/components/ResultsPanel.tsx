import { useEffect, useRef } from 'react';
import type { TypingStats } from '../types/exercise';
import type { AttemptSummary } from '../lib/progress';

interface ResultsPanelProps {
  stats: TypingStats;
  previous: AttemptSummary | null;
  onRestart: () => void;
  onContinue: () => void;
  onRace?: () => void;
  showRaceButton?: boolean;
}

function BigMetric({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-5xl font-semibold tabular-nums tracking-tight text-accent sm:text-6xl">
        {value}
      </span>
      <span className="mt-1.5 text-sm text-content-tertiary">{label}</span>
    </div>
  );
}

function SmallMetric({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-2xl font-semibold tabular-nums text-content-primary">{value}</span>
      <span className="mt-1 text-xs text-content-tertiary">{label}</span>
    </div>
  );
}

function Delta({ delta, unit, higherIsBetter = true }: { delta: number; unit: string; higherIsBetter?: boolean }) {
  const rounded = Math.round(delta * 10) / 10;
  if (rounded === 0) return <span className="text-content-tertiary">±0{unit}</span>;
  const improved = higherIsBetter ? rounded > 0 : rounded < 0;
  const arrow = rounded > 0 ? '▲' : '▼';
  return (
    <span className={improved ? 'text-success' : 'text-error'}>
      {arrow} {rounded > 0 ? '+' : ''}
      {rounded}
      {unit}
    </span>
  );
}

export default function ResultsPanel({
  stats,
  previous,
  onRestart,
  onContinue,
  onRace,
  showRaceButton = false,
}: ResultsPanelProps) {
  const continueRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    continueRef.current?.focus();
  }, []);

  return (
    <div className="mx-auto w-full max-w-3xl">
      {/* Primary metrics */}
      <div className="flex flex-wrap items-end gap-x-14 gap-y-8 pb-8">
        <BigMetric value={`${stats.wpm}`} label="words per minute" />
        <BigMetric value={`${stats.accuracy}%`} label="accuracy" />
      </div>

      {/* Divider + secondary metrics */}
      <div className="flex flex-wrap gap-x-10 gap-y-6 border-t border-border-tertiary pt-7">
        <SmallMetric value={`${stats.seconds}s`} label="time" />
        <SmallMetric value={`${stats.chars}`} label="characters" />
        <SmallMetric value={`${stats.errors}`} label="errors" />
      </div>

      {/* vs last attempt */}
      <div className="mt-8 rounded-lg border border-border-tertiary bg-background-secondary px-5 py-4 text-sm">
        {previous ? (
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <span className="text-xs font-medium uppercase tracking-wider text-content-tertiary">
              vs last attempt
            </span>
            <span className="text-content-primary">
              wpm <Delta delta={stats.wpm - previous.wpm} unit="" />
            </span>
            <span className="text-content-primary">
              accuracy <Delta delta={stats.accuracy - previous.accuracy} unit="%" />
            </span>
            <span className="text-content-primary">
              errors <Delta delta={stats.errors - previous.errors} unit="" higherIsBetter={false} />
            </span>
          </div>
        ) : (
          <p className="text-sm text-content-secondary">
            First attempt — a baseline to beat next time.
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="mt-8 flex flex-wrap gap-3">
        <button
          ref={continueRef}
          type="button"
          onClick={onContinue}
          className="rounded-md bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          Continue to quiz →
        </button>
        {showRaceButton && onRace && (
          <button
            type="button"
            onClick={onRace}
            className="rounded-md border border-accent bg-[var(--color-accent-subtle)] px-5 py-2.5 text-sm font-medium text-accent hover:bg-background-secondary"
          >
            Race this run
          </button>
        )}
        <button
          type="button"
          onClick={onRestart}
          className="rounded-md border border-border-tertiary px-5 py-2.5 text-sm text-content-secondary transition-colors hover:bg-background-secondary"
        >
          Restart
        </button>
      </div>
    </div>
  );
}
