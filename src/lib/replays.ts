import { loadValidated, removeKey, saveJSON } from './storage';
import { clampNumber, isNumber, isObject, isString } from './validation';
import { getExerciseById } from './exercises';
import { buildSyntheticReplay } from './synthetic-ghosts';
import type { FriendGhost, GhostSource, ReplayEvent, TypingReplay } from '../types/replay';

export const REPLAY_MAX_BYTES = 100 * 1024;
export const REPLAYS_PER_EXERCISE_CAP = 10;

const FRIEND_GHOSTS_KEY = 'friend-ghosts';
const MAX_WPM = 500;

export function codeLength(code: string): number {
  return code.length;
}

function replaysKey(profileId: string): string {
  return `replays:${profileId}`;
}

function pickStore(profileId: string): Storage | undefined {
  try {
    return profileId === 'guest' ? window.sessionStorage : window.localStorage;
  } catch {
    return undefined;
  }
}

function newReplayId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `replay-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function validateEvent(raw: unknown): ReplayEvent | null {
  if (!isObject(raw)) return null;
  const { ms, cursor } = raw;
  if (!isNumber(ms) || !isNumber(cursor) || ms < 0 || cursor < 0) return null;
  return { ms: Math.round(ms), cursor: Math.round(cursor) };
}

export function validateTypingReplay(raw: unknown): TypingReplay | null {
  if (!isObject(raw)) return null;
  const { id, exerciseId, codeLength: len, playerName, recordedAt, events, wpm, accuracy } = raw;
  if (!isString(id) || !isString(exerciseId) || !isString(playerName)) return null;
  if (!isNumber(len) || len <= 0) return null;
  if (!Array.isArray(events) || events.length === 0) return null;
  const cleanEvents = events.map(validateEvent).filter((e): e is ReplayEvent => e !== null);
  if (cleanEvents.length === 0) return null;
  if (![wpm, accuracy].every(isNumber)) return null;
  return {
    id,
    exerciseId,
    codeLength: Math.round(len),
    playerName,
    recordedAt: isString(recordedAt) ? recordedAt : new Date().toISOString(),
    events: cleanEvents,
    wpm: clampNumber(Math.round(wpm as number), 0, MAX_WPM),
    accuracy: clampNumber(Math.round(accuracy as number), 0, 100),
  };
}

type ReplayStore = Record<string, TypingReplay[]>;

export type { ReplayStore };

function validateReplayStore(raw: unknown): ReplayStore {
  if (!isObject(raw)) return {};
  const out: ReplayStore = {};
  for (const [exerciseId, list] of Object.entries(raw)) {
    if (!Array.isArray(list)) continue;
    const replays = list.map(validateTypingReplay).filter((r): r is TypingReplay => r !== null);
    if (replays.length) out[exerciseId] = replays.slice(-REPLAYS_PER_EXERCISE_CAP);
  }
  return out;
}

export function getAllReplays(profileId: string): ReplayStore {
  return loadValidated(replaysKey(profileId), validateReplayStore, pickStore(profileId));
}

export function getReplays(profileId: string, exerciseId: string): TypingReplay[] {
  return getAllReplays(profileId)[exerciseId] ?? [];
}

export function getReplayById(profileId: string, replayId: string): TypingReplay | undefined {
  for (const list of Object.values(getAllReplays(profileId))) {
    const found = list.find((r) => r.id === replayId);
    if (found) return found;
  }
  return undefined;
}

export function saveReplay(profileId: string, replay: TypingReplay): boolean {
  const store = getAllReplays(profileId);
  const list = store[replay.exerciseId] ?? [];
  store[replay.exerciseId] = [...list.filter((r) => r.id !== replay.id), replay].slice(-REPLAYS_PER_EXERCISE_CAP);
  return saveJSON(replaysKey(profileId), store, pickStore(profileId));
}

export function deleteReplay(profileId: string, exerciseId: string, replayId: string): boolean {
  const store = getAllReplays(profileId);
  const list = store[exerciseId];
  if (!list) return false;
  const next = list.filter((r) => r.id !== replayId);
  if (next.length === list.length) return false;
  if (next.length === 0) delete store[exerciseId];
  else store[exerciseId] = next;
  return saveJSON(replaysKey(profileId), store, pickStore(profileId));
}

export function getBestReplay(profileId: string, exerciseId: string): TypingReplay | undefined {
  const replays = getReplays(profileId, exerciseId);
  if (replays.length === 0) return undefined;
  return [...replays].sort((a, b) => {
    if (b.wpm !== a.wpm) return b.wpm - a.wpm;
    return getGhostFinishMs(a) - getGhostFinishMs(b);
  })[0];
}

export function clearReplays(profileId: string): void {
  removeKey(replaysKey(profileId), pickStore(profileId));
}

export function clearAllReplays(accountIds: string[]): void {
  clearReplays('guest');
  for (const id of accountIds) clearReplays(id);
}

export function exportReplayStore(profileId: string): ReplayStore {
  return getAllReplays(profileId);
}

export function importReplayStore(profileId: string, store: ReplayStore): boolean {
  return saveJSON(replaysKey(profileId), validateReplayStore(store), pickStore(profileId));
}

function normalizeFriendName(name: string): string {
  return name.trim().toLowerCase();
}

function mergeFriendReplays(existing: TypingReplay[], incoming: TypingReplay): TypingReplay[] {
  const byId = new Map(existing.map((r) => [r.id, r]));
  byId.set(incoming.id, incoming);
  return [...byId.values()];
}

export function buildReplay(params: {
  exerciseId: string;
  code: string;
  playerName: string;
  events: ReplayEvent[];
  wpm: number;
  accuracy: number;
}): TypingReplay {
  return {
    id: newReplayId(),
    exerciseId: params.exerciseId,
    codeLength: codeLength(params.code),
    playerName: params.playerName,
    recordedAt: new Date().toISOString(),
    events: params.events,
    wpm: params.wpm,
    accuracy: params.accuracy,
  };
}

/** Binary search: ghost cursor index at elapsed ms from race start. */
export function getGhostCursorAt(replay: TypingReplay, elapsedMs: number): number {
  if (elapsedMs < 0 || replay.events.length === 0) return 0;
  const events = replay.events;
  if (elapsedMs >= events[events.length - 1].ms) return events[events.length - 1].cursor;
  let lo = 0;
  let hi = events.length - 1;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (events[mid].ms <= elapsedMs) lo = mid;
    else hi = mid - 1;
  }
  return events[lo].cursor;
}

export function getGhostFinishMs(replay: TypingReplay): number {
  if (replay.events.length === 0) return 0;
  return replay.events[replay.events.length - 1].ms;
}

function validateFriendGhost(raw: unknown): FriendGhost | null {
  if (!isObject(raw)) return null;
  const { id, displayName, importedAt, replays } = raw;
  if (!isString(id) || !isString(displayName)) return null;
  if (!Array.isArray(replays)) return null;
  const clean = replays.map(validateTypingReplay).filter((r): r is TypingReplay => r !== null);
  if (clean.length === 0) return null;
  return {
    id,
    displayName,
    importedAt: isString(importedAt) ? importedAt : new Date().toISOString(),
    replays: clean,
  };
}

function validateFriendList(raw: unknown): FriendGhost[] {
  if (!Array.isArray(raw)) return [];
  return raw.map(validateFriendGhost).filter((f): f is FriendGhost => f !== null);
}

export function getFriendGhosts(): FriendGhost[] {
  return loadValidated(FRIEND_GHOSTS_KEY, validateFriendList);
}

export function saveFriendGhosts(friends: FriendGhost[]): boolean {
  return saveJSON(FRIEND_GHOSTS_KEY, friends);
}

export function addFriendGhost(friend: FriendGhost): boolean {
  const list = getFriendGhosts().filter((f) => f.id !== friend.id);
  return saveFriendGhosts([...list, friend]);
}

export function removeFriendGhost(friendId: string): boolean {
  return saveFriendGhosts(getFriendGhosts().filter((f) => f.id !== friendId));
}

export function getFriendReplay(friendId: string, replayId: string): TypingReplay | undefined {
  const friend = getFriendGhosts().find((f) => f.id === friendId);
  return friend?.replays.find((r) => r.id === replayId);
}

export function exportGhostReplay(replay: TypingReplay): string {
  return JSON.stringify({ app: 'pytyping-ghost', version: 1, replay }, null, 2);
}

export type ImportGhostResult =
  | { ok: true; replay: TypingReplay }
  | { ok: false; error: string };

export function importGhostReplay(text: string): ImportGhostResult {
  if (text.length > REPLAY_MAX_BYTES) {
    return { ok: false, error: 'Ghost file is too large (max 100 KB).' };
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, error: 'That file is not valid JSON.' };
  }
  if (!isObject(parsed)) return { ok: false, error: 'Invalid ghost file format.' };
  const replay = validateTypingReplay(parsed.replay);
  if (!replay) return { ok: false, error: 'This does not look like a valid PyTyping ghost replay.' };
  if (parsed.app !== 'pytyping-ghost') {
    return { ok: false, error: 'This does not look like a PyTyping ghost replay.' };
  }
  return { ok: true, replay };
}

export function importFriendGhostBundle(text: string, displayName: string): ImportGhostResult & { friend?: FriendGhost } {
  const result = importGhostReplay(text);
  if (!result.ok) return result;
  const name = displayName.trim() || result.replay.playerName;
  const normalized = normalizeFriendName(name);
  const friends = getFriendGhosts();
  const existing = friends.find((f) => normalizeFriendName(f.displayName) === normalized);
  let friend: FriendGhost;
  if (existing) {
    friend = {
      ...existing,
      replays: mergeFriendReplays(existing.replays, result.replay),
    };
    if (!saveFriendGhosts(friends.map((f) => (f.id === existing.id ? friend : f)))) {
      return { ok: false, error: 'Could not save imported friend ghost.' };
    }
  } else {
    friend = {
      id: newReplayId(),
      displayName: name,
      importedAt: new Date().toISOString(),
      replays: [result.replay],
    };
    if (!addFriendGhost(friend)) {
      return { ok: false, error: 'Could not save imported friend ghost.' };
    }
  }
  return { ok: true, replay: result.replay, friend };
}

export function resolveGhost(source: GhostSource): TypingReplay | undefined {
  switch (source.kind) {
    case 'self':
    case 'account':
      return getReplayById(source.profileId, source.replayId);
    case 'friend':
      return getFriendReplay(source.friendId, source.replayId);
    case 'builtin': {
      const exercise = getExerciseById(source.exerciseId);
      if (!exercise) return undefined;
      return buildSyntheticReplay(source.exerciseId, codeLength(exercise.code), source.tier);
    }
    default:
      return undefined;
  }
}
