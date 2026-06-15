import { useMemo } from 'react';
import type { Exercise } from '../types/exercise';
import { getProgress } from '../lib/progress';
import { useProfile } from '../context/ProfileContext';

interface ProgressTrackerProps {
  exercises: Exercise[];
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-lg border border-border-tertiary bg-background-secondary p-5">
      <div className="text-2xl font-medium text-content-primary">{value}</div>
      <div className="mt-1 text-sm text-content-secondary">{label}</div>
    </div>
  );
}

/**
 * Read-only stats view. Aggregates the saved best-attempt records against the
 * full exercise catalogue: completion count, average accuracy/WPM, and a
 * per-topic mastery breakdown (a topic is "mastered" once every exercise
 * tagged with it is completed).
 */
export default function ProgressTracker({ exercises }: ProgressTrackerProps) {
  const { activeId, activeProfile, progressVersion } = useProfile();
  const stats = useMemo(() => {
    const progress = getProgress(activeId);
    const records = Object.values(progress);
    const completedIds = new Set(records.map((r) => r.exerciseId));

    const avg = (nums: number[]) => (nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0);
    const avgAccuracy = avg(records.map((r) => r.accuracy));
    const bestWpm = records.reduce((m, r) => Math.max(m, r.wpm), 0);

    // Per-topic: how many of the topic's exercises are done.
    const topicTotals = new Map<string, number>();
    const topicDone = new Map<string, number>();
    for (const ex of exercises) {
      for (const topic of ex.topics) {
        topicTotals.set(topic, (topicTotals.get(topic) ?? 0) + 1);
        if (completedIds.has(ex.id)) topicDone.set(topic, (topicDone.get(topic) ?? 0) + 1);
      }
    }
    const topics = [...topicTotals.entries()]
      .map(([topic, total]) => ({ topic, total, done: topicDone.get(topic) ?? 0 }))
      .sort((a, b) => b.done / b.total - a.done / a.total || a.topic.localeCompare(b.topic));

    const mastered = topics.filter((t) => t.done === t.total).length;

    return {
      completed: completedIds.size,
      totalExercises: exercises.length,
      avgAccuracy: Math.round(avgAccuracy),
      bestWpm: Math.round(bestWpm),
      mastered,
      topics,
      hasData: records.length > 0,
    };
  }, [exercises, activeId, progressVersion]);

  return (
    <div className="mx-auto w-full max-w-2xl pb-12">
      <h1 className="mb-1 text-lg font-medium text-content-primary">Your progress</h1>
      <p className="mb-8 text-sm text-content-tertiary">Profile: {activeProfile.name}</p>

      {!stats.hasData ? (
        <p className="text-sm text-content-secondary">
          No exercises completed yet. Finish a typing exercise and its quiz to start tracking your
          stats.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat value={`${stats.completed}/${stats.totalExercises}`} label="Exercises completed" />
            <Stat value={`${stats.avgAccuracy}%`} label="Avg. accuracy" />
            <Stat value={`${stats.bestWpm}`} label="Best WPM" />
            <Stat value={`${stats.mastered}`} label="Topics mastered" />
          </div>

          <section className="mt-10">
            <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-content-secondary">
              Topics
            </h2>
            <div className="flex flex-col gap-3">
              {stats.topics.map((t) => {
                const pct = (t.done / t.total) * 100;
                return (
                  <div key={t.topic}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="text-content-primary">{t.topic}</span>
                      <span className="text-content-tertiary">
                        {t.done}/{t.total}
                      </span>
                    </div>
                    <div className="h-[3px] w-full overflow-hidden rounded-md bg-background-tertiary">
                      <div
                        className={`h-full ${pct === 100 ? 'bg-success' : 'bg-accent'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
