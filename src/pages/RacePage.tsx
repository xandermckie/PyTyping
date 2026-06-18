import { useCallback, useMemo, useRef, useState } from 'react';
import TypingInput from '../components/TypingInput';
import RaceResultsPanel from '../components/RaceResultsPanel';
import ShareGhostModal from '../components/ShareGhostModal';
import { getExerciseById } from '../lib/exercises';
import { recordRaceResult } from '../lib/race-rank';
import {
  buildReplay,
  codeLength,
  exportGhostReplay,
  resolveGhost,
  saveReplay,
} from '../lib/replays';
import { useSession } from '../context/SessionContext';
import type { GhostSource } from '../types/replay';
import type { ReplayEvent, TypingReplay } from '../types/replay';
import type { TypingStats } from '../types/exercise';

interface RacePageProps {
  exerciseId: string;
  ghostSource: GhostSource;
  onExit: () => void;
  onFocusChange?: (focused: boolean) => void;
}

type Phase = 'racing' | 'results';

export default function RacePage({ exerciseId, ghostSource, onExit, onFocusChange }: RacePageProps) {
  const exercise = getExerciseById(exerciseId);
  const { scopeId, displayName, avatarPhoto, notifyReplayChange } = useSession();
  const ghost = useMemo(() => resolveGhost(ghostSource), [ghostSource]);
  const [phase, setPhase] = useState<Phase>('racing');
  const [stats, setStats] = useState<TypingStats | null>(null);
  const [savedReplay, setSavedReplay] = useState<TypingReplay | null>(null);
  const [rankResult, setRankResult] = useState<ReturnType<typeof recordRaceResult> | null>(null);
  const [ghostFinishedFirst, setGhostFinishedFirst] = useState(false);
  const [restartKey, setRestartKey] = useState(0);
  const [shareOpen, setShareOpen] = useState(false);
  const playerFinishMsRef = useRef(0);
  const lastEventsRef = useRef<ReplayEvent[]>([]);
  const ghostFinishedRef = useRef(false);

  const handleReplayReady = useCallback((events: ReplayEvent[]) => {
    lastEventsRef.current = events;
    if (events.length > 0) playerFinishMsRef.current = events[events.length - 1].ms;
  }, []);

  const handleGhostFinished = useCallback(() => {
    if (ghostFinishedRef.current) return;
    ghostFinishedRef.current = true;
    setGhostFinishedFirst(true);
  }, []);

  const handleComplete = useCallback(
    (typingStats: TypingStats) => {
      if (!exercise) return;
      setStats(typingStats);
      const replay = buildReplay({
        exerciseId: exercise.id,
        code: exercise.code,
        playerName: displayName,
        events: lastEventsRef.current,
        wpm: typingStats.wpm,
        accuracy: typingStats.accuracy,
      });
      saveReplay(scopeId, replay);
      notifyReplayChange();
      setRankResult(recordRaceResult(scopeId, typingStats.wpm));
      setSavedReplay(replay);
      setPhase('results');
      onFocusChange?.(false);
    },
    [exercise, displayName, scopeId, onFocusChange, notifyReplayChange],
  );

  const handleRematch = useCallback(() => {
    setStats(null);
    setSavedReplay(null);
    setRankResult(null);
    setGhostFinishedFirst(false);
    ghostFinishedRef.current = false;
    lastEventsRef.current = [];
    playerFinishMsRef.current = 0;
    setRestartKey((k) => k + 1);
    setPhase('racing');
  }, []);

  const handleExport = useCallback(() => {
    const replay = savedReplay;
    if (!replay) return;
    const blob = new Blob([exportGhostReplay(replay)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pytyping-ghost-${replay.exerciseId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [savedReplay]);

  if (!exercise || !ghost) {
    return (
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-content-secondary">This race could not be loaded.</p>
        <button type="button" onClick={onExit} className="mt-4 text-sm text-accent">
          Back to lobby
        </button>
      </div>
    );
  }

  if (codeLength(exercise.code) !== ghost.codeLength) {
    return (
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-content-secondary">
          This ghost was recorded on a different version of the exercise and cannot be raced.
        </p>
        <button type="button" onClick={onExit} className="mt-4 text-sm text-accent">
          Back to lobby
        </button>
      </div>
    );
  }

  if (phase === 'results' && stats && rankResult && savedReplay) {
    return (
      <>
        <RaceResultsPanel
          stats={stats}
          ghost={ghost}
          playerFinishMs={playerFinishMsRef.current}
          rank={rankResult.newRank}
          rankedUp={rankResult.rankedUp}
          onRematch={handleRematch}
          onLobby={onExit}
          onExportGhost={handleExport}
          onShareGhost={() => setShareOpen(true)}
        />
        <ShareGhostModal
          open={shareOpen}
          displayName={displayName}
          replay={savedReplay}
          avatarPhoto={avatarPhoto}
          onClose={() => setShareOpen(false)}
        />
      </>
    );
  }

  return (
    <div>
      <div className="mx-auto mb-6 flex max-w-3xl items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-content-tertiary">Ghost race</p>
          <h1 className="text-xl font-semibold text-content-primary">{exercise.title}</h1>
          <p className="text-sm text-content-secondary">vs {ghost.playerName}</p>
        </div>
        <button
          type="button"
          onClick={onExit}
          className="shrink-0 rounded-md border border-border-tertiary px-3 py-1.5 text-sm text-content-secondary hover:bg-background-secondary"
        >
          Exit
        </button>
      </div>
      {ghostFinishedFirst && (
        <div className="mx-auto mb-4 flex max-w-3xl items-center justify-between gap-3 rounded-lg border border-[var(--color-warning,#e8a838)] bg-background-secondary px-4 py-3 text-sm text-content-primary">
          <span>The ghost finished first — keep typing to beat their time!</span>
          <button
            type="button"
            onClick={() => setGhostFinishedFirst(false)}
            className="shrink-0 text-content-tertiary hover:text-content-secondary"
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      )}
      <TypingInput
        key={restartKey}
        code={exercise.code}
        ghostReplay={ghost}
        recordReplay
        onReplayReady={handleReplayReady}
        onGhostFinished={handleGhostFinished}
        onComplete={handleComplete}
        onQuit={onExit}
        onRestart={handleRematch}
        onFocusChange={onFocusChange}
      />
    </div>
  );
}
