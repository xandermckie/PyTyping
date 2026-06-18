import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import RankBadge from '../components/RankBadge';
import { EXERCISES, DIFFICULTIES, allTopics, getExerciseById } from '../lib/exercises';
import { getNextRank, getRaceRankState } from '../lib/race-rank';
import {
  BUILTIN_TIERS,
  buildSyntheticReplay,
  tierLabel,
  tierWpmForExercise,
} from '../lib/synthetic-ghosts';
import {
  deleteReplay,
  exportGhostReplay,
  getBestReplay,
  getFriendGhosts,
  getReplays,
  importFriendGhostBundle,
  removeFriendGhost,
} from '../lib/replays';
import { useSession } from '../context/SessionContext';
import type { Difficulty } from '../types/exercise';
import type { GhostSource, SyntheticGhostTier, TypingReplay } from '../types/replay';

interface RaceLobbyProps {
  onStartRace: (exerciseId: string, source: GhostSource) => void;
}

type DifficultyFilter = Difficulty | 'all';

interface GhostOption {
  key: string;
  label: string;
  group: string;
  replay: TypingReplay;
  source: GhostSource;
  wpm: number;
}

function builtinKey(tier: SyntheticGhostTier, exerciseId: string): string {
  return `builtin:${tier}:${exerciseId}`;
}

function defaultGhostKey(scopeId: string, exerciseId: string): string {
  const best = getBestReplay(scopeId, exerciseId);
  if (best) return `self:${best.id}`;
  return builtinKey('easy', exerciseId);
}

export default function RaceLobby({ onStartRace }: RaceLobbyProps) {
  const { scopeId, displayName, accounts, replayVersion, notifyReplayChange } = useSession();
  const [difficulty, setDifficulty] = useState<DifficultyFilter>('all');
  const [topic, setTopic] = useState<string>('all');
  const [query, setQuery] = useState('');
  const [exerciseId, setExerciseId] = useState(EXERCISES[0]?.id ?? '');
  const [ghostKey, setGhostKey] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [friendName, setFriendName] = useState('');
  const [friendVersion, setFriendVersion] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const rankState = useMemo(() => getRaceRankState(scopeId), [scopeId, replayVersion]);
  const nextRank = useMemo(() => getNextRank(rankState.peakRaceWpm), [rankState.peakRaceWpm]);

  const topics = useMemo(() => allTopics(), []);
  const friends = useMemo(() => getFriendGhosts(), [friendVersion]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return EXERCISES.filter(
      (ex) =>
        (difficulty === 'all' || ex.difficulty === difficulty) &&
        (topic === 'all' || ex.topics.includes(topic)) &&
        (!q ||
          ex.title.toLowerCase().includes(q) ||
          ex.description.toLowerCase().includes(q) ||
          ex.topics.some((t) => t.toLowerCase().includes(q))),
    );
  }, [difficulty, topic, query]);

  const ghostOptions = useMemo((): GhostOption[] => {
    if (!exerciseId) return [];
    const exercise = getExerciseById(exerciseId);
    const len = exercise?.code.length ?? 0;
    const options: GhostOption[] = [];

    for (const tier of BUILTIN_TIERS) {
      const replay = buildSyntheticReplay(exerciseId, len, tier);
      const wpmLabel = tier === 'creator' ? '102' : String(tierWpmForExercise(exerciseId, tier));
      const accLabel = tier === 'creator' ? '97%' : `${replay.accuracy}%`;
      options.push({
        key: builtinKey(tier, exerciseId),
        group: 'Built-in opponents',
        label: `${tierLabel(tier)} — ${wpmLabel} wpm · ${accLabel} acc`,
        replay,
        source: { kind: 'builtin', tier, exerciseId },
        wpm: replay.wpm,
      });
    }

    for (const replay of getReplays(scopeId, exerciseId)) {
      options.push({
        key: `self:${replay.id}`,
        group: 'My ghosts',
        label: `${displayName} — ${replay.wpm} wpm (${formatWhen(replay.recordedAt)})`,
        replay,
        source: { kind: 'self', profileId: scopeId, replayId: replay.id },
        wpm: replay.wpm,
      });
    }

    for (const account of accounts) {
      if (account.id === scopeId) continue;
      for (const replay of getReplays(account.id, exerciseId)) {
        options.push({
          key: `account:${account.id}:${replay.id}`,
          group: 'Local accounts',
          label: `${account.username} — ${replay.wpm} wpm`,
          replay,
          source: { kind: 'account', profileId: account.id, replayId: replay.id },
          wpm: replay.wpm,
        });
      }
    }

    for (const friend of friends) {
      for (const replay of friend.replays.filter((r) => r.exerciseId === exerciseId)) {
        options.push({
          key: `friend:${friend.id}:${replay.id}`,
          group: 'Friends',
          label: `${friend.displayName} — ${replay.wpm} wpm`,
          replay,
          source: { kind: 'friend', friendId: friend.id, replayId: replay.id },
          wpm: replay.wpm,
        });
      }
    }

    return options;
  }, [exerciseId, scopeId, displayName, accounts, friends, replayVersion]);

  const groups = useMemo(() => {
    const order = ['Built-in opponents', 'My ghosts', 'Local accounts', 'Friends'];
    const map = new Map<string, GhostOption[]>();
    for (const g of order) map.set(g, []);
    for (const opt of ghostOptions) {
      const list = map.get(opt.group) ?? [];
      list.push(opt);
      map.set(opt.group, list);
    }
    return order
      .map((name) => ({ name, options: map.get(name) ?? [] }))
      .filter((g) => g.options.length > 0);
  }, [ghostOptions]);

  useEffect(() => {
    if (!exerciseId) return;
    const key = defaultGhostKey(scopeId, exerciseId);
    const exists = ghostOptions.some((g) => g.key === key);
    setGhostKey(exists ? key : ghostOptions[0]?.key ?? '');
  }, [exerciseId, scopeId, replayVersion]);

  const selectedGhost = ghostOptions.find((g) => g.key === ghostKey) ?? ghostOptions[0];

  const handleImport = useCallback(
    async (file: File) => {
      setImportError(null);
      try {
        const text = await file.text();
        const result = importFriendGhostBundle(text, friendName);
        if (!result.ok) {
          setImportError(result.error);
          return;
        }
        if (result.replay.exerciseId === exerciseId) {
          setGhostKey(`friend:${result.friend?.id}:${result.replay.id}`);
        }
        setFriendName('');
        setFriendVersion((v) => v + 1);
      } catch {
        setImportError('Could not read that file.');
      }
    },
    [exerciseId, friendName],
  );

  const handleExport = useCallback(() => {
    if (!selectedGhost || selectedGhost.source.kind === 'builtin') return;
    const blob = new Blob([exportGhostReplay(selectedGhost.replay)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pytyping-ghost-${selectedGhost.replay.exerciseId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [selectedGhost]);

  const handleDeleteReplay = useCallback(() => {
    if (!selectedGhost || selectedGhost.source.kind !== 'self') return;
    deleteReplay(scopeId, exerciseId, selectedGhost.source.replayId);
    notifyReplayChange();
    setGhostKey(defaultGhostKey(scopeId, exerciseId));
  }, [selectedGhost, scopeId, exerciseId, notifyReplayChange]);

  const chip = (active: boolean) =>
    `rounded-md border px-3 py-1.5 text-xs font-medium transition-all duration-100 ${
      active
        ? 'border-accent bg-[var(--color-accent-subtle)] text-accent'
        : 'border-border-tertiary text-content-secondary hover:border-border-secondary hover:bg-background-secondary'
    }`;

  const exercise = getExerciseById(exerciseId);

  return (
    <div className="mx-auto w-full max-w-5xl">
      <header className="mb-10">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-semibold tracking-tight text-content-primary">Ghost race</h1>
          <RankBadge wpm={rankState.peakRaceWpm} showWpm />
        </div>
        {nextRank && (
          <p className="mt-2 text-sm text-content-tertiary">
            {nextRank.wpmNeeded} more wpm to reach {nextRank.label}
          </p>
        )}
        <p className="mt-3 max-w-2xl text-base text-content-secondary">
          Race built-in opponents, your past runs, or imported friend ghosts. Complete the snippet before
          the ghost caret reaches the end.
        </p>
      </header>

      <section className="mb-10">
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-content-tertiary">
          Pick exercise
        </h2>
        <div className="mb-4 flex flex-wrap gap-2">
          {(['all', ...DIFFICULTIES] as DifficultyFilter[]).map((d) => (
            <button key={d} type="button" onClick={() => setDifficulty(d)} className={chip(difficulty === d)}>
              {d === 'all' ? 'All levels' : d}
            </button>
          ))}
        </div>
        <div className="mb-4 flex flex-wrap gap-2">
          <button type="button" onClick={() => setTopic('all')} className={chip(topic === 'all')}>
            All topics
          </button>
          {topics.map((t) => (
            <button key={t} type="button" onClick={() => setTopic(t)} className={chip(topic === t)}>
              {t}
            </button>
          ))}
        </div>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search exercises…"
          className="mb-4 w-full rounded-md border border-border-tertiary bg-background-secondary px-3 py-2 text-sm text-content-primary"
        />
        <select
          value={exerciseId}
          onChange={(e) => setExerciseId(e.target.value)}
          className="w-full rounded-md border border-border-tertiary bg-background-secondary px-3 py-2 text-sm text-content-primary"
        >
          {filtered.map((ex) => (
            <option key={ex.id} value={ex.id}>
              {ex.title} ({ex.difficulty})
            </option>
          ))}
        </select>
        {exercise && <p className="mt-2 text-sm text-content-tertiary">{exercise.description}</p>}
      </section>

      <section className="mb-10">
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-content-tertiary">
          Pick opponent ghost
        </h2>
        <select
          value={selectedGhost?.key ?? ''}
          onChange={(e) => setGhostKey(e.target.value)}
          className="w-full rounded-md border border-border-tertiary bg-background-secondary px-3 py-2 text-sm text-content-primary"
        >
          {groups.map((group) => (
            <optgroup key={group.name} label={group.name}>
              {group.options.map((g) => (
                <option key={g.key} value={g.key}>
                  {g.label}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        {selectedGhost && (
          <div className="mt-3 flex flex-wrap gap-2">
            {selectedGhost.source.kind !== 'builtin' && (
              <button
                type="button"
                onClick={handleExport}
                className="rounded-md border border-border-tertiary px-3 py-1.5 text-xs text-content-secondary hover:bg-background-secondary"
              >
                Export selected ghost
              </button>
            )}
            {selectedGhost.source.kind === 'self' && (
              <button
                type="button"
                onClick={handleDeleteReplay}
                className="rounded-md border border-error px-3 py-1.5 text-xs text-error hover:bg-background-secondary"
              >
                Delete replay
              </button>
            )}
            {selectedGhost.source.kind === 'friend' && (
              <button
                type="button"
                onClick={() => {
                  const friendId =
                    selectedGhost.source.kind === 'friend' ? selectedGhost.source.friendId : '';
                  if (friendId) removeFriendGhost(friendId);
                  setGhostKey(defaultGhostKey(scopeId, exerciseId));
                  setFriendVersion((v) => v + 1);
                }}
                className="rounded-md border border-error px-3 py-1.5 text-xs text-error hover:bg-background-secondary"
              >
                Remove friend
              </button>
            )}
          </div>
        )}
      </section>

      <section className="mb-10 rounded-lg border border-border-tertiary bg-background-secondary p-5">
        <h2 className="text-sm font-medium text-content-primary">Import friend ghost</h2>
        <p className="mt-1 text-sm text-content-tertiary">
          Upload a <code className="text-content-secondary">.json</code> ghost file a friend exported.
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            value={friendName}
            onChange={(e) => setFriendName(e.target.value)}
            placeholder="Friend display name (optional)"
            className="flex-1 rounded-md border border-border-tertiary bg-background-primary px-3 py-2 text-sm"
          />
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleImport(file);
              e.target.value = '';
            }}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="rounded-md border border-border-tertiary px-4 py-2 text-sm text-content-primary hover:bg-background-tertiary"
          >
            Choose file…
          </button>
        </div>
        {importError && <p className="mt-2 text-sm text-error">{importError}</p>}
      </section>

      <button
        type="button"
        disabled={!selectedGhost || !exercise}
        onClick={() => {
          if (selectedGhost) onStartRace(exerciseId, selectedGhost.source);
        }}
        className="rounded-md border border-accent bg-[var(--color-accent-subtle)] px-6 py-3 text-sm font-medium text-accent disabled:cursor-not-allowed disabled:opacity-50"
      >
        Start race
      </button>
    </div>
  );
}

function formatWhen(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString();
  } catch {
    return 'saved run';
  }
}
