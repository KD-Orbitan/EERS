import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { RankingTrend } from '@/features/ranking/types/ranking.type';

const PERIOD_LABEL: Record<RankingTrend['period'], string> = {
  DAY: '24h',
  WEEK: '7d',
  MONTH: '30d',
};

interface RankingTrendBadgeProps {
  trend: RankingTrend | null | undefined;
  /** 'dark' for use over the hero's photo/gradient background, 'light' for white cards. */
  variant?: 'dark' | 'light';
}

const COLOR_CLASSES = {
  dark: { up: 'text-emerald-300', down: 'text-red-300', flat: 'text-white/70', muted: 'text-white/60' },
  light: { up: 'text-emerald-600', down: 'text-red-600', flat: 'text-ink-500', muted: 'text-ink-500' },
};

// Renders nothing when there isn't enough ranking_snapshot_history yet to
// compute a baseline (see DECISIONS.md D-031) — same "just omit it" idiom
// BusinessDetail already uses for ranking?.rank being absent.
export function RankingTrendBadge({ trend, variant = 'dark' }: RankingTrendBadgeProps) {
  if (!trend) {
    return null;
  }

  const isUp = trend.rankChange > 0;
  const isDown = trend.rankChange < 0;
  const Icon = isUp ? TrendingUp : isDown ? TrendingDown : Minus;
  const colors = COLOR_CLASSES[variant];
  const colorClassName = isUp ? colors.up : isDown ? colors.down : colors.flat;

  return (
    <span className={`inline-flex items-center gap-1 text-xs font-bold ${colorClassName}`}>
      <Icon className="h-3.5 w-3.5" />
      {trend.rankChange !== 0 ? Math.abs(trend.rankChange) : '—'}
      <span className={`font-normal ${colors.muted}`}>/ {PERIOD_LABEL[trend.period]}</span>
    </span>
  );
}
