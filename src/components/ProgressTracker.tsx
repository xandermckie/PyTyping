import { useMemo } from 'react';
import type { Exercise } from '../types/exercise';
import { getHistory, getProgress } from '../lib/progress';
import { useSession } from '../context/SessionContext';
import { getAchievements, getGoalSummary, getReviewQueue, getStreakSummary } from '../lib/learning';

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

/** Minimal inline trend line of values (e.g. WPM across attempts). */
function Sparkline({ values, width = 96, height = 28 }: { values: number[]; width?: number; height?: number }) {
  if (values.length < 2) {
    return <div className="h-7 text-xs text-content-tertiary">-</div>;
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const stepX = width / (values.length - 1);
  // Invert y so larger values sit higher; pad 2px top/bottom.
  const points = values
    .map((v, i) => `${(i * stepX).toFixed(1)},${(height - 2 - ((v - min) / span) * (height - 4)).toFixed(1)}`)
    .join(' ');
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true" className="overflow-visible">
      <polyline
        points={points}
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Trend({ delta, unit, higherIsBetter = true }: { delta: number; unit: string; higherIsBetter?: boolean }) {
  const v = Math.round(delta * 10) / 10;
  if (v === 0) return <span className="text-content-tertiary">±0{unit}</span>;
  const improved = higherIsBetter ? v > 0 : v < 0;
  return (
    <span className={improved ? 'text-success' : 'text-error'}>
      {v > 0 ? '+' : ''}
      {v}
      {unit}
    </span>
  );
}

/**
 * Read-only stats view. Aggregates the saved best-attempt records against the
 * full exercise catalogue: completion count, average accuracy/WPM, and a
 * per-topic mastery breakdown (a topic is "mastered" once every exercise
 * tagged with it is completed).
 */
export default function ProgressTracker({ exercises }: ProgressTrackerProps) {
  const { scopeId, displayName, isGuest, progressVersion } = useSession();
  const stats = useMemo(() => {
    const progress = getProgress(scopeId);
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
  }, [exercises, scopeId, progressVersion]);

  // Per-exercise improvement: exercises with 1+ recorded attempts, newest first.
  const improvement = useMemo(() => {
    const history = getHistory(scopeId);
    const titles = new Map(exercises.map((e) => [e.id, e.title]));
    return Object.entries(history)
      .map(([id, attempts]) => ({
        id,
        title: titles.get(id) ?? id,
        attempts,
        wpms: attempts.map((a) => a.wpm),
        wpmDelta: attempts[attempts.length - 1].wpm - attempts[0].wpm,
        accDelta: attempts[attempts.length - 1].accuracy - attempts[0].accuracy,
        lastAt: attempts[attempts.length - 1].at,
      }))
      .sort((a, b) => b.lastAt.localeCompare(a.lastAt))
      .slice(0, 12);
  }, [exercises, scopeId, progressVersion]);
  const streak = useMemo(() => getStreakSummary(getProgress(scopeId)), [scopeId, progressVersion]);
  const goal = useMemo(() => getGoalSummary(getProgress(scopeId)), [scopeId, progressVersion]);
  const achievements = useMemo(
    () => getAchievements(getProgress(scopeId), getHistory(scopeId)),
    [scopeId, progressVersion],
  );
  const reviewQueue = useMemo(
    () => getReviewQueue(exercises, getProgress(scopeId), getHistory(scopeId)),
    [exercises, scopeId, progressVersion],
  );

  return (
    <div className="mx-auto w-full max-w-2xl pb-12">
      <h1 className="mb-1 text-lg font-medium text-content-primary">Your progress</h1>
      <p className="mb-8 text-sm text-content-tertiary">
        {displayName}
        {isGuest && ' · guest progress is saved only for this browser session'}
      </p>

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
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Stat value={`${streak.current} days`} label="Current streak" />
            <Stat value={`${streak.best} days`} label="Best streak" />
            <Stat value={`${goal.completedToday}/${goal.dailyGoal}`} label="Daily goal" />
          </div>

          <section className="mt-10">
            <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-content-secondary">
              Achievements
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {achievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className={`rounded-md border p-3 ${
                    achievement.unlocked
                      ? 'border-success/40 bg-background-secondary'
                      : 'border-border-tertiary bg-background-secondary/50'
                  }`}
                >
                  <p className="text-sm font-medium text-content-primary">
                    {achievement.unlocked ? '✓ ' : '○ '}
                    {achievement.title}
                  </p>
                  <p className="mt-1 text-xs text-content-tertiary">{achievement.description}</p>
                </div>
              ))}
            </div>
          </section>

          {reviewQueue.length > 0 && (
            <section className="mt-10">
              <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-content-secondary">
                Review queue
              </h2>
              <div className="flex flex-col gap-2">
                {reviewQueue.map((item) => (
                  <div
                    key={item.exercise.id}
                    className="rounded-md border border-border-tertiary bg-background-secondary px-3 py-2"
                  >
                    <p className="text-sm text-content-primary">{item.exercise.title}</p>
                    <p className="text-xs text-content-tertiary">{item.reason}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

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

          {improvement.length > 0 && (
            <section className="mt-10">
              <h2 className="mb-1 text-sm font-medium uppercase tracking-wide text-content-secondary">
                Improvement
              </h2>
              <p className="mb-4 text-xs text-content-tertiary">
                WPM trend and change since your first attempt, per exercise.
              </p>
              <div className="divide-y divide-border-tertiary border-y border-border-tertiary">
                {improvement.map((row) => (
                  <div key={row.id} className="flex items-center gap-4 py-3">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm text-content-primary">{row.title}</div>
                      <div className="text-xs text-content-tertiary">
                        {row.attempts.length} {row.attempts.length === 1 ? 'attempt' : 'attempts'}
                      </div>
                    </div>
                    <Sparkline values={row.wpms} />
                    <div className="w-28 text-right text-xs">
                      <div className="text-content-secondary">
                        wpm <Trend delta={row.wpmDelta} unit="" />
                      </div>
                      <div className="text-content-secondary">
                        acc <Trend delta={row.accDelta} unit="%" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
