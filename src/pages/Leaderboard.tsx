import { useMemo, useState } from 'react';
import { useSession } from '../context/SessionContext';
import { getAggregateStats } from '../lib/progress';

type SortKey = 'avgWpm' | 'avgAccuracy' | 'completed';

export default function Leaderboard() {
  const { accounts, scopeId } = useSession();
  const [sort, setSort] = useState<SortKey>('avgWpm');

  const rows = useMemo(() => {
    return accounts
      .map((a) => ({ ...getAggregateStats(a.id), username: a.username, id: a.id }))
      .sort((a, b) => b[sort] - a[sort]);
  }, [accounts, sort]);

  if (!accounts.length) {
    return (
      <div className="mx-auto max-w-2xl text-center py-16">
        <p className="text-content-secondary text-sm">No accounts yet. Create an account to appear on the leaderboard.</p>
      </div>
    );
  }

  const cols: Array<{ key: SortKey; label: string }> = [
    { key: 'avgWpm', label: 'Avg WPM' },
    { key: 'avgAccuracy', label: 'Avg Accuracy' },
    { key: 'completed', label: 'Exercises' },
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-content-primary">Leaderboard</h1>
        <p className="mt-1 text-sm text-content-secondary">All local accounts on this device, ranked by best attempts.</p>
      </div>

      <div className="rounded-lg border border-border-tertiary bg-background-secondary overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-tertiary">
              <th className="px-4 py-2.5 text-left font-medium text-content-tertiary w-10">#</th>
              <th className="px-4 py-2.5 text-left font-medium text-content-tertiary">User</th>
              {cols.map((c) => (
                <th key={c.key} className="px-4 py-2.5 text-right">
                  <button
                    type="button"
                    onClick={() => setSort(c.key)}
                    className={`font-medium transition-colors ${sort === c.key ? 'text-accent' : 'text-content-tertiary hover:text-content-secondary'}`}
                  >
                    {c.label}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border-tertiary">
            {rows.map((row, i) => {
              const isYou = row.id === scopeId;
              return (
                <tr key={row.id} className={isYou ? 'bg-background-tertiary' : ''}>
                  <td className="px-4 py-3 text-content-tertiary tabular-nums">{i + 1}</td>
                  <td className="px-4 py-3 font-medium text-content-primary">
                    {row.username}
                    {isYou && <span className="ml-2 text-xs text-accent">you</span>}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-content-primary">{row.avgWpm || '—'}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-content-primary">
                    {row.avgAccuracy ? `${row.avgAccuracy}%` : '—'}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-content-secondary">{row.completed}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-content-tertiary">Click a column header to re-sort. Guest progress is not included.</p>
    </div>
  );
}
