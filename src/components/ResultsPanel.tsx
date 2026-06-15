import { useEffect, useRef } from 'react';
import type { TypingStats } from '../types/exercise';
import type { AttemptSummary } from '../lib/progress';

interface ResultsPanelProps {
  stats: TypingStats;
  /** The user's previous attempt at this exercise, if any. */
  previous: AttemptSummary | null;
  onRestart: () => void;
  onContinue: () => void;
}

function Metric({ value, label, big = false }: { value: string; label: string; big?: boolean }) {
  return (
    <div>
      <div className={`font-medium text-accent ${big ? 'text-5xl sm:text-6xl' : 'text-2xl'}`}>{value}</div>
      <div className="mt-1 text-sm text-content-secondary">{label}</div>
    </div>
  );
}

/** A signed delta with a direction arrow, colored by whether it improved. */
function Delta({ delta, unit, higherIsBetter = true }: { delta: number; unit: string; higherIsBetter?: boolean }) {
  const rounded = Math.round(delta * 10) / 10;
  if (rounded === 0) {
    return <span className="text-content-tertiary">±0{unit}</span>;
  }
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

/**
 * Monkeytype-style results, shown after a snippet and before the quiz. Big WPM
 * + accuracy, supporting metrics, and — when the user has done this exercise
 * before — a comparison to their last attempt so they can see improvement.
 */
export default function ResultsPanel({ stats, previous, onRestart, onContinue }: ResultsPanelProps) {
  const continueRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    continueRef.current?.focus();
  }, []);

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="flex flex-wrap items-end gap-x-12 gap-y-6">
        <Metric value={`${stats.wpm}`} label="wpm" big />
        <Metric value={`${stats.accuracy}%`} label="accuracy" big />
      </div>

      <div className="mt-10 flex flex-wrap gap-x-12 gap-y-6 border-t border-border-tertiary pt-6">
        <Metric value={`${stats.seconds}s`} label="time" />
        <Metric value={`${stats.chars}`} label="characters" />
        <Metric value={`${stats.errors}`} label="errors" />
      </div>

      {/* Round-to-round improvement */}
      <div className="mt-8 rounded-lg border border-border-tertiary bg-background-secondary p-4 text-sm">
        {previous ? (
          <div className="flex flex-wrap items-center gap-x-8 gap-y-2">
            <span className="text-content-secondary">vs your last attempt:</span>
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
          <span className="text-content-secondary">First attempt at this snippet — a baseline to beat next time.</span>
        )}
      </div>

      <div className="mt-8 flex gap-3">
        <button
          ref={continueRef}
          type="button"
          onClick={onContinue}
          className="rounded-md border border-accent px-5 py-2.5 text-sm font-medium text-accent transition-colors hover:bg-background-secondary"
        >
          Continue to quiz →
        </button>
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
