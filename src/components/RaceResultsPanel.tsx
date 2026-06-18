import { useEffect, useRef } from 'react';
import type { TypingReplay } from '../types/replay';
import type { TypingStats } from '../types/exercise';
import { getGhostFinishMs } from '../lib/replays';

interface RaceResultsPanelProps {
  stats: TypingStats;
  ghost: TypingReplay;
  playerFinishMs: number;
  onRematch: () => void;
  onLobby: () => void;
  onExportGhost: () => void;
}

export default function RaceResultsPanel({
  stats,
  ghost,
  playerFinishMs,
  onRematch,
  onLobby,
  onExportGhost,
}: RaceResultsPanelProps) {
  const ghostFinishMs = getGhostFinishMs(ghost);
  const playerWon = playerFinishMs <= ghostFinishMs;
  const rematchRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    rematchRef.current?.focus();
  }, []);

  return (
    <div className="mx-auto w-full max-w-3xl">
      <p className="text-sm font-medium uppercase tracking-wider text-content-tertiary">Race results</p>
      <h2 className="mt-2 text-3xl font-semibold text-content-primary">
        {playerWon ? 'You beat the ghost!' : 'Ghost wins this round'}
      </h2>
      <p className="mt-2 text-sm text-content-secondary">
        vs {ghost.playerName} · {ghost.wpm} wpm · {ghost.accuracy}% acc
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <ResultCard
          label="You"
          wpm={stats.wpm}
          accuracy={stats.accuracy}
          finishLabel={`${(playerFinishMs / 1000).toFixed(1)}s`}
          highlight={playerWon}
        />
        <ResultCard
          label={ghost.playerName}
          wpm={ghost.wpm}
          accuracy={ghost.accuracy}
          finishLabel={`${(ghostFinishMs / 1000).toFixed(1)}s`}
          highlight={!playerWon}
        />
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <button
          ref={rematchRef}
          type="button"
          onClick={onRematch}
          className="rounded-md border border-accent bg-[var(--color-accent-subtle)] px-4 py-2 text-sm font-medium text-accent hover:bg-background-secondary"
        >
          Rematch
        </button>
        <button
          type="button"
          onClick={onLobby}
          className="rounded-md border border-border-tertiary px-4 py-2 text-sm text-content-primary hover:bg-background-secondary"
        >
          Race lobby
        </button>
        <button
          type="button"
          onClick={onExportGhost}
          className="rounded-md border border-border-tertiary px-4 py-2 text-sm text-content-secondary hover:bg-background-secondary"
        >
          Export your ghost
        </button>
      </div>
    </div>
  );
}

function ResultCard({
  label,
  wpm,
  accuracy,
  finishLabel,
  highlight,
}: {
  label: string;
  wpm: number;
  accuracy: number;
  finishLabel: string;
  highlight: boolean;
}) {
  return (
    <div
      className={`rounded-lg border p-5 ${
        highlight ? 'border-accent bg-[var(--color-accent-subtle)]' : 'border-border-tertiary bg-background-secondary'
      }`}
    >
      <p className="text-xs font-medium uppercase tracking-wider text-content-tertiary">{label}</p>
      <p className="mt-2 text-3xl font-semibold tabular-nums text-content-primary">{wpm}</p>
      <p className="text-sm text-content-secondary">wpm · {accuracy}% acc · {finishLabel}</p>
    </div>
  );
}
