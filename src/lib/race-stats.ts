import type { Account } from './auth';
import { getAllReplays, getGhostFinishMs } from './replays';
import type { Exercise } from '../types/exercise';
import type { TypingReplay } from '../types/replay';

export interface RaceRecord {
  exerciseId: string;
  exerciseTitle: string;
  profileId: string;
  username: string;
  wpm: number;
  accuracy: number;
  finishMs: number;
  recordedAt: string;
}

function bestReplay(replays: TypingReplay[]): TypingReplay | undefined {
  if (replays.length === 0) return undefined;
  return [...replays].sort((a, b) => {
    const finishDiff = getGhostFinishMs(a) - getGhostFinishMs(b);
    if (finishDiff !== 0) return finishDiff;
    return b.wpm - a.wpm;
  })[0];
}

export function getRaceRecords(accounts: Account[], exercises: Exercise[]): RaceRecord[] {
  const titleById = new Map(exercises.map((e) => [e.id, e.title]));
  const records: RaceRecord[] = [];

  for (const account of accounts) {
    const store = getAllReplays(account.id);
    for (const [exerciseId, replays] of Object.entries(store)) {
      const replay = bestReplay(replays);
      if (!replay) continue;
      records.push({
        exerciseId,
        exerciseTitle: titleById.get(exerciseId) ?? exerciseId,
        profileId: account.id,
        username: account.username,
        wpm: replay.wpm,
        accuracy: replay.accuracy,
        finishMs: getGhostFinishMs(replay),
        recordedAt: replay.recordedAt,
      });
    }
  }

  return records.sort((a, b) => a.finishMs - b.finishMs);
}

export function getPersonalRaceSummary(
  profileId: string,
  records: RaceRecord[],
): { exerciseCount: number; bestFinishMs: number | null } {
  const mine = records.filter((r) => r.profileId === profileId);
  if (mine.length === 0) return { exerciseCount: 0, bestFinishMs: null };
  return {
    exerciseCount: mine.length,
    bestFinishMs: Math.min(...mine.map((r) => r.finishMs)),
  };
}
