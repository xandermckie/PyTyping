import { useEffect, useRef } from 'react';
import type { TypingStats } from '../types/exercise';

interface ResultsPanelProps {
  stats: TypingStats;
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

/**
 * Monkeytype-style results, shown after a snippet is finished and before the
 * quiz. Big WPM + accuracy, supporting metrics, then Continue / Restart. The
 * Continue button is auto-focused so the keyboard flow is uninterrupted.
 */
export default function ResultsPanel({ stats, onRestart, onContinue }: ResultsPanelProps) {
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

      <div className="mt-10 flex gap-3">
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
