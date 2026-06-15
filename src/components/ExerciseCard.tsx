import { memo } from 'react';
import type { Difficulty, Exercise } from '../types/exercise';

interface ExerciseCardProps {
  exercise: Exercise;
  completed: boolean;
  onSelect: (id: string) => void;
}

const DIFFICULTY_COLOR: Record<Difficulty, string> = {
  beginner: 'text-success border-success',
  intermediate: 'text-warning border-warning',
  advanced: 'text-error border-error',
};

/**
 * One card in the exercise browser. Memoized because the Home grid can render
 * many of these and only re-renders when this exercise's props actually change.
 */
function ExerciseCard({ exercise, completed, onSelect }: ExerciseCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(exercise.id)}
      aria-label={`Start exercise: ${exercise.title}`}
      className="flex h-full flex-col rounded-lg border border-border-tertiary bg-background-secondary p-5 text-left transition-colors hover:bg-background-tertiary"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-medium text-content-primary">{exercise.title}</h3>
        {completed && (
          <span className="shrink-0 text-success" aria-label="Completed" title="Completed">
            ✓
          </span>
        )}
      </div>

      <p className="mt-2 flex-1 text-sm leading-relaxed text-content-secondary">
        {exercise.description}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-content-tertiary">
        <span className={`rounded-md border px-2 py-0.5 ${DIFFICULTY_COLOR[exercise.difficulty]}`}>
          {exercise.difficulty}
        </span>
        {exercise.topics.slice(0, 3).map((topic) => (
          <span key={topic} className="rounded-md bg-background-tertiary px-2 py-0.5">
            {topic}
          </span>
        ))}
        <span className="ml-auto">~{exercise.estimatedTime} min</span>
      </div>
    </button>
  );
}

export default memo(ExerciseCard);
