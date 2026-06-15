import { useCallback, useEffect, useMemo, useState } from 'react';
import TypingInput from '../components/TypingInput';
import QuizPanel from '../components/QuizPanel';
import BreakdownPanel from '../components/BreakdownPanel';
import ResultsPanel from '../components/ResultsPanel';
import { getExerciseById } from '../lib/exercises';
import { recordCompletion } from '../lib/progress';
import { useProfile } from '../context/ProfileContext';
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
  const { activeId, notifyProgressChange } = useProfile();
  const [phase, setPhase] = useState<Phase>('typing');
  const [typingStats, setTypingStats] = useState<TypingStats | null>(null);
  // Bumped to force a fresh TypingInput when the user restarts the snippet.
  const [restartKey, setRestartKey] = useState(0);

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

  const handleTypingComplete = useCallback((stats: TypingStats) => {
    setTypingStats(stats);
    setPhase('results');
  }, []);

  const handleRestart = useCallback(() => {
    setTypingStats(null);
    setRestartKey((k) => k + 1);
    setPhase('typing');
  }, []);

  const handleQuizComplete = useCallback(
    (score: QuizScore) => {
      if (exercise && typingStats) {
        recordCompletion(activeId, {
          exerciseId: exercise.id,
          accuracy: typingStats.accuracy,
          wpm: typingStats.wpm,
          errors: typingStats.errors,
          quizCorrect: score.correct,
          quizTotal: score.total,
        });
        notifyProgressChange();
      }
      setPhase('breakdown');
    },
    [activeId, exercise, notifyProgressChange, typingStats],
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
        <ResultsPanel stats={typingStats} onRestart={handleRestart} onContinue={() => setPhase('quiz')} />
      )}

      {phase === 'quiz' && (
        <QuizPanel exerciseId={exercise.id} questions={exercise.quiz} onComplete={handleQuizComplete} />
      )}

      {phase === 'breakdown' && (
        <BreakdownPanel
          exercise={exercise}
          related={related}
          onSelectExercise={onSelectExercise}
          onNext={onExit}
        />
      )}
    </div>
  );
}
