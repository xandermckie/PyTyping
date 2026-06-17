import { useCallback, useEffect, useMemo, useState } from 'react';
import TypingInput from '../components/TypingInput';
import QuizPanel from '../components/QuizPanel';
import BreakdownPanel from '../components/BreakdownPanel';
import ResultsPanel from '../components/ResultsPanel';
import { getExerciseById } from '../lib/exercises';
import { getAttempts, recordCompletion } from '../lib/progress';
import type { AttemptSummary } from '../lib/progress';
import { useSession } from '../context/SessionContext';
import type { QuizScore, TypingStats } from '../types/exercise';

interface TypingPageProps {
  exerciseId: string;
  onExit: () => void;
  onSelectExercise: (id: string) => void;
  /** Bubble typing-focus up so the app shell can fade its chrome (zen mode). */
  onFocusChange?: (focused: boolean) => void;
}

type Phase = 'typing' | 'results' | 'quiz' | 'breakdown';

/**
 * Drives a single exercise: type → results → quiz → breakdown. Progress is
 * saved (per active profile) once the quiz completes. The parent keys this
 * component on exerciseId, so picking a new exercise remounts it fresh.
 */
export default function TypingPage({ exerciseId, onExit, onSelectExercise, onFocusChange }: TypingPageProps) {
  const exercise = getExerciseById(exerciseId);
  const { scopeId, notifyProgressChange } = useSession();
  const [phase, setPhase] = useState<Phase>('typing');
  const [typingStats, setTypingStats] = useState<TypingStats | null>(null);
  // The most recent prior attempt, captured when typing finishes so the
  // results screen can show round-to-round improvement.
  const [previous, setPrevious] = useState<AttemptSummary | null>(null);
  // Bumped to force a fresh TypingInput when the user restarts the snippet.
  const [restartKey, setRestartKey] = useState(0);
  const [saveWarning, setSaveWarning] = useState<string | null>(null);

  const related = useMemo(() => {
    if (!exercise) return [];
    return exercise.explanation.relatedExercises
      .map(getExerciseById)
      .filter((e): e is NonNullable<typeof e> => Boolean(e));
  }, [exercise]);

  // Whenever we leave the typing phase, make sure the chrome is visible again.
  useEffect(() => {
    if (phase !== 'typing') onFocusChange?.(false);
  }, [phase, onFocusChange]);

  const handleTypingComplete = useCallback(
    (stats: TypingStats) => {
      if (!exercise) return;
      // Snapshot the prior attempt BEFORE the new one is recorded (after the
      // quiz), so the results screen compares against the right baseline.
      const attempts = getAttempts(scopeId, exercise.id);
      setPrevious(attempts.length ? attempts[attempts.length - 1] : null);
      setTypingStats(stats);
      setPhase('results');
    },
    [scopeId, exercise],
  );

  const handleRestart = useCallback(() => {
    setTypingStats(null);
    setRestartKey((k) => k + 1);
    setPhase('typing');
  }, []);

  const handleQuizComplete = useCallback(
    (score: QuizScore) => {
      if (exercise && typingStats) {
        const { saved } = recordCompletion(scopeId, {
          exerciseId: exercise.id,
          accuracy: typingStats.accuracy,
          wpm: typingStats.wpm,
          errors: typingStats.errors,
          quizCorrect: score.correct,
          quizTotal: score.total,
        });
        if (saved) {
          setSaveWarning(null);
          notifyProgressChange();
        } else {
          setSaveWarning('Your progress could not be saved. Storage may be full or disabled.');
        }
      }
      setPhase('breakdown');
    },
    [scopeId, exercise, notifyProgressChange, typingStats],
  );

  if (!exercise) {
    return (
      <div className="mx-auto max-w-2xl py-16 text-center">
        <p className="text-content-secondary">That exercise could not be found.</p>
        <button
          type="button"
          onClick={onExit}
          className="mt-4 rounded-md border border-border-tertiary px-4 py-2 text-sm text-content-primary hover:bg-background-secondary"
        >
          Back to exercises
        </button>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mx-auto mb-8 flex max-w-3xl items-center justify-between">
        <div>
          <h1 className="text-lg font-medium text-content-primary">{exercise.title}</h1>
          <p className="text-sm text-content-tertiary">
            {exercise.difficulty} · {exercise.sourceLabel}
          </p>
        </div>
        <button
          type="button"
          onClick={onExit}
          className="rounded-md border border-border-tertiary px-3 py-1.5 text-sm text-content-secondary hover:bg-background-secondary"
        >
          Exit
        </button>
      </div>

      {phase === 'typing' && (
        <TypingInput
          key={`${exercise.id}:${restartKey}`}
          code={exercise.code}
          onComplete={handleTypingComplete}
          onQuit={onExit}
          onRestart={handleRestart}
          onFocusChange={onFocusChange}
        />
      )}

      {phase === 'results' && typingStats && (
        <ResultsPanel
          stats={typingStats}
          previous={previous}
          onRestart={handleRestart}
          onContinue={() => setPhase('quiz')}
        />
      )}

      {phase === 'quiz' && (
        <QuizPanel exerciseId={exercise.id} questions={exercise.quiz} onComplete={handleQuizComplete} />
      )}

      {phase === 'breakdown' && (
        <>
          {saveWarning && (
            <p className="mx-auto mb-4 max-w-3xl rounded-md border border-error/40 bg-background-secondary px-4 py-3 text-sm text-error">
              {saveWarning}
            </p>
          )}
          <BreakdownPanel
            exercise={exercise}
            related={related}
            onSelectExercise={onSelectExercise}
            onNext={onExit}
          />
        </>
      )}
    </div>
  );
}
