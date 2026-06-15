import { useMemo, useState } from 'react';
import ExerciseCard from '../components/ExerciseCard';
import { EXERCISES, DIFFICULTIES, allTopics } from '../lib/exercises';
import { getProgress } from '../lib/progress';
import { useProfile } from '../context/ProfileContext';
import type { Difficulty } from '../types/exercise';

interface HomeProps {
  onSelectExercise: (id: string) => void;
}

type DifficultyFilter = Difficulty | 'all';

/**
 * Landing page + exercise browser. A spacious hero, then filter chips for
 * difficulty and topic, then a responsive grid of exercise cards. Completion
 * marks come from saved progress.
 */
export default function Home({ onSelectExercise }: HomeProps) {
  const [difficulty, setDifficulty] = useState<DifficultyFilter>('all');
  const [topic, setTopic] = useState<string>('all');
  const { activeId, progressVersion } = useProfile();

  const topics = useMemo(() => allTopics(), []);
  // Re-read when the active profile changes or progress is recorded.
  const completedIds = useMemo(
    () => new Set(Object.keys(getProgress(activeId))),
    [activeId, progressVersion],
  );

  const filtered = useMemo(
    () =>
      EXERCISES.filter(
        (ex) =>
          (difficulty === 'all' || ex.difficulty === difficulty) &&
          (topic === 'all' || ex.topics.includes(topic)),
      ),
    [difficulty, topic],
  );

  const chip = (active: boolean) =>
    `rounded-md border px-3 py-1.5 text-sm transition-colors ${
      active
        ? 'border-accent text-accent'
        : 'border-border-tertiary text-content-secondary hover:bg-background-secondary'
    }`;

  return (
    <div className="mx-auto w-full max-w-5xl">
      <header className="py-10 sm:py-16">
        <h1 className="text-2xl font-medium text-content-primary sm:text-3xl">
          Learn Python by typing it.
        </h1>
        <p className="mt-3 max-w-xl text-content-secondary">
          Type real Python snippets character by character with instant feedback, then check your
          understanding with a short quiz and a plain-language breakdown.
        </p>
      </header>

      {/* Difficulty filter */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="mr-1 text-sm text-content-tertiary">Difficulty</span>
        <button type="button" className={chip(difficulty === 'all')} onClick={() => setDifficulty('all')}>
          all
        </button>
        {DIFFICULTIES.map((d) => (
          <button key={d} type="button" className={chip(difficulty === d)} onClick={() => setDifficulty(d)}>
            {d}
          </button>
        ))}
      </div>

      {/* Topic filter */}
      <div className="mb-8 flex flex-wrap items-center gap-2">
        <span className="mr-1 text-sm text-content-tertiary">Topic</span>
        <button type="button" className={chip(topic === 'all')} onClick={() => setTopic('all')}>
          all
        </button>
        {topics.map((t) => (
          <button key={t} type="button" className={chip(topic === t)} onClick={() => setTopic(t)}>
            {t}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="py-12 text-center text-sm text-content-secondary">
          No exercises match those filters yet.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 pb-12 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((ex) => (
            <ExerciseCard
              key={ex.id}
              exercise={ex}
              completed={completedIds.has(ex.id)}
              onSelect={onSelectExercise}
            />
          ))}
        </div>
      )}
    </div>
  );
}
