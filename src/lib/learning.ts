import type { Exercise } from '../types/exercise';
import type { CompletionRecord, HistoryMap, ProgressMap } from './progress';

export interface ReviewItem {
  exercise: Exercise;
  score: number;
  reason: string;
  dueInDays: number;
}

export interface StreakSummary {
  current: number;
  best: number;
  completedToday: number;
}

export interface GoalSummary {
  dailyGoal: number;
  completedToday: number;
  remaining: number;
  hit: boolean;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
}

interface DayInfo {
  key: string;
  count: number;
}

function toDayKey(dateIso: string): string {
  return dateIso.slice(0, 10);
}

function dayCounts(progress: ProgressMap): DayInfo[] {
  const counts = new Map<string, number>();
  for (const rec of Object.values(progress)) {
    const key = toDayKey(rec.completedAt);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => a.key.localeCompare(b.key));
}

function quizPct(record: Pick<CompletionRecord, 'quizCorrect' | 'quizTotal'>): number {
  if (record.quizTotal <= 0) return 0;
  return (record.quizCorrect / record.quizTotal) * 100;
}

export function getReviewQueue(
  exercises: Exercise[],
  progress: ProgressMap,
  _history: HistoryMap,
  _now: Date = new Date(),
): ReviewItem[] {
  const byId = new Map(exercises.map((exercise) => [exercise.id, exercise]));
  const items: ReviewItem[] = [];

  for (const record of Object.values(progress)) {
    const exercise = byId.get(record.exerciseId);
    if (!exercise) continue;

    const quiz = quizPct(record);
    const needsAccuracyReview = record.accuracy < 75;
    const needsQuizReview = record.quizTotal > 0 && quiz < 75;
    if (!needsAccuracyReview && !needsQuizReview) continue;

    let reason: string;
    if (needsAccuracyReview) {
      reason = `Accuracy was ${record.accuracy}% last time`;
    } else {
      reason = `Quiz score was ${Math.round(quiz)}%`;
    }

    const score = needsAccuracyReview
      ? 100 - record.accuracy
      : 100 - Math.round(quiz);

    items.push({ exercise, score, reason, dueInDays: 0 });
  }

  return items.sort((a, b) => b.score - a.score).slice(0, 8);
}

export function getStreakSummary(progress: ProgressMap, now: Date = new Date()): StreakSummary {
  const days = dayCounts(progress);
  if (days.length === 0) return { current: 0, best: 0, completedToday: 0 };

  const todayKey = now.toISOString().slice(0, 10);
  const dayMap = new Map(days.map((d) => [d.key, d.count]));
  const completedToday = dayMap.get(todayKey) ?? 0;

  let current = 0;
  for (let i = 0; ; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    if ((dayMap.get(key) ?? 0) > 0) current += 1;
    else break;
  }

  let best = 0;
  let run = 0;
  let prevDay: Date | null = null;
  for (const day of days) {
    const currentDay = new Date(`${day.key}T00:00:00`);
    if (!prevDay) {
      run = 1;
    } else {
      const delta = Math.floor((currentDay.getTime() - prevDay.getTime()) / (24 * 60 * 60 * 1000));
      run = delta === 1 ? run + 1 : 1;
    }
    if (run > best) best = run;
    prevDay = currentDay;
  }

  return { current, best, completedToday };
}

export function getGoalSummary(progress: ProgressMap, dailyGoal = 2, now: Date = new Date()): GoalSummary {
  const streak = getStreakSummary(progress, now);
  const remaining = Math.max(0, dailyGoal - streak.completedToday);
  return {
    dailyGoal,
    completedToday: streak.completedToday,
    remaining,
    hit: remaining === 0,
  };
}

export function getAchievements(progress: ProgressMap, history: HistoryMap): Achievement[] {
  const records = Object.values(progress);
  const completed = records.length;
  const attempts = Object.values(history).reduce((acc, value) => acc + value.length, 0);
  const perfectQuiz = records.some((record) => record.quizTotal > 0 && record.quizCorrect === record.quizTotal);
  const noErrors = records.some((record) => record.errors === 0);
  const avgAccuracy =
    records.length === 0
      ? 0
      : records.reduce((acc, record) => acc + record.accuracy, 0) / Math.max(records.length, 1);
  const advancedDone = records.some((record) => record.exerciseId.includes('advanced'));
  const streak = getStreakSummary(progress).current;

  return [
    { id: 'first', title: 'First Steps', description: 'Complete your first exercise.', unlocked: completed >= 1 },
    { id: 'five', title: 'Momentum', description: 'Complete 5 exercises.', unlocked: completed >= 5 },
    { id: 'ten', title: 'Dedicated', description: 'Complete 10 exercises.', unlocked: completed >= 10 },
    { id: 'perfect', title: 'Perfect Quiz', description: 'Get 100% on any quiz.', unlocked: perfectQuiz },
    { id: 'clean', title: 'No Typos', description: 'Finish an exercise with zero errors.', unlocked: noErrors },
    {
      id: 'accurate',
      title: 'Precision',
      description: 'Reach 95% average accuracy across completed exercises.',
      unlocked: avgAccuracy >= 95,
    },
    { id: 'grinder', title: 'Grinder', description: 'Log 25 total attempts.', unlocked: attempts >= 25 },
    { id: 'streak3', title: 'On Fire', description: 'Maintain a 3-day streak.', unlocked: streak >= 3 },
    {
      id: 'streak7',
      title: 'Weekly Warrior',
      description: 'Maintain a 7-day streak.',
      unlocked: streak >= 7,
    },
    {
      id: 'advanced',
      title: 'Level Up',
      description: 'Complete at least one advanced exercise.',
      unlocked: advancedDone,
    },
  ];
}

export function getRecommendedExerciseId(
  currentExerciseId: string,
  related: Exercise[],
  exercises: Exercise[],
  progress: ProgressMap,
  history: HistoryMap,
): string | null {
  const completed = new Set(Object.keys(progress));
  const unresolvedRelated = related.find((exercise) => !completed.has(exercise.id));
  if (unresolvedRelated) return unresolvedRelated.id;

  const queue = getReviewQueue(exercises, progress, history);
  const topReview = queue.find((item) => item.exercise.id !== currentExerciseId);
  if (topReview) return topReview.exercise.id;

  const current = exercises.find((exercise) => exercise.id === currentExerciseId);
  if (!current) return null;
  const sameTopic = exercises.find(
    (exercise) =>
      exercise.id !== currentExerciseId &&
      exercise.topics.some((topic) => current.topics.includes(topic)) &&
      !completed.has(exercise.id),
  );
  if (sameTopic) return sameTopic.id;

  const firstIncomplete = exercises.find((exercise) => !completed.has(exercise.id));
  return firstIncomplete?.id ?? null;
}
