import { getRankForWpm, rankColorClass, rankLabel, type RaceRank } from '../lib/race-rank';

interface RankBadgeProps {
  wpm: number;
  showWpm?: boolean;
  className?: string;
}

export default function RankBadge({ wpm, showWpm = false, className = '' }: RankBadgeProps) {
  const rank: RaceRank = getRankForWpm(wpm);
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-border-tertiary bg-background-secondary px-2.5 py-0.5 text-xs font-medium ${rankColorClass(rank)} ${className}`}
    >
      {rankLabel(rank)}
      {showWpm && <span className="text-content-tertiary tabular-nums">{wpm} wpm</span>}
    </span>
  );
}
