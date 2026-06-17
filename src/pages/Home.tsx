import { useMemo, useState } from 'react';
import ExerciseCard from '../components/ExerciseCard';
import Logo from '../components/Logo';
import { EXERCISES, DIFFICULTIES, allTopics } from '../lib/exercises';
import { getHistory, getProgress } from '../lib/progress';
import { useSession } from '../context/SessionContext';
import type { Difficulty } from '../types/exercise';
import { getAchievements, getGoalSummary, getReviewQueue, getStreakSummary } from '../lib/learning';

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
  const { scopeId, progressVersion } = useSession();

  const topics = useMemo(() => allTopics(), []);
  const progress = useMemo(() => getProgress(scopeId), [scopeId, progressVersion]);
  const history = useMemo(() => getHistory(scopeId), [scopeId, progressVersion]);
  // Re-read when the active session changes or progress is recorded.
  const completedIds = useMemo(() => new Set(Object.keys(progress)), [progress]);
  const reviewQueue = useMemo(() => getReviewQueue(EXERCISES, progress, history), [progress, history]);
  const streak = useMemo(() => getStreakSummary(progress), [progress]);
  const goal = useMemo(() => getGoalSummary(progress), [progress]);
  const achievements = useMemo(() => getAchievements(progress, history), [progress, history]);
  const unlockedAchievements = achievements.filter((achievement) => achievement.unlocked).length;

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
        <Logo size={40} wordmark={false} className="mb-5 text-content-primary" />
        <h1 className="text-2xl font-medium text-content-primary sm:text-3xl">
          Learn Python by typing it.
        </h1>
        <p className="mt-3 max-w-xl text-content-secondary">
          Type real Python snippets character by character with instant feedback, then check your
          understanding with a short quiz and a plain-language breakdown.
        </p>
        <p className="mt-4 text-sm text-content-tertiary">
          {EXERCISES.length} exercises · {topics.length} topics · type{' '}
          <kbd className="rounded border border-border-tertiary bg-background-secondary px-1.5 py-0.5 font-mono text-xs">
            ctrl/⌘ + k
          </kbd>{' '}
          for the command line
        </p>
        <div className="mt-6 flex flex-wrap gap-2 text-xs">
          <span className="rounded-md border border-border-tertiary bg-background-secondary px-2 py-1 text-content-secondary">
            Streak: <span className="text-content-primary">{streak.current} days</span>
          </span>
          <span className="rounded-md border border-border-tertiary bg-background-secondary px-2 py-1 text-content-secondary">
            Daily goal: <span className="text-content-primary">{goal.completedToday}</span>/{goal.dailyGoal}
          </span>
          <span className="rounded-md border border-border-tertiary bg-background-secondary px-2 py-1 text-content-secondary">
            Achievements: <span className="text-content-primary">{unlockedAchievements}</span>/{achievements.length}
          </span>
        </div>
      </header>

      {reviewQueue.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-content-secondary">Review due</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {reviewQueue.map((item) => (
              <button
                key={item.exercise.id}
                type="button"
                onClick={() => onSelectExercise(item.exercise.id)}
                className="rounded-lg border border-border-tertiary bg-background-secondary p-4 text-left transition-colors hover:bg-background-tertiary"
              >
                <div className="text-sm font-medium text-content-primary">{item.exercise.title}</div>
                <p className="mt-1 text-xs text-content-tertiary">{item.reason}</p>
                <p className="mt-2 text-xs text-accent">
                  {item.dueInDays === 0 ? 'Due now' : `Due in ${item.dueInDays} day${item.dueInDays === 1 ? '' : 's'}`}
                </p>
              </button>
            ))}
          </div>
        </section>
      )}

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
