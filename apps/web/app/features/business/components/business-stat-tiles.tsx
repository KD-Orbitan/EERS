'use client';

import { Star, Trophy, Users } from 'lucide-react';
import { RankingTrendBadge } from '@/features/ranking/components/ranking-trend-badge';
import { RankingTrend } from '@/features/ranking/types/ranking.type';

interface BusinessStatTilesProps {
  avgRating: number;
  reviewCount: number;
  rank?: number | null;
  trend?: RankingTrend | null;
}

// Shared by BusinessDetail (public profile) and the owner dashboard page —
// same 3 real stat tiles (rating/reviews/rank), kept in one place to avoid drift.
export function BusinessStatTiles({ avgRating, reviewCount, rank, trend }: BusinessStatTilesProps) {
  return (
    <>
      <div className="rounded-3xl border border-slate-200 bg-primary-50 p-6">
        <p className="text-xs uppercase tracking-wide text-ink-700">Average Rating</p>
        <div className="mt-1 flex items-center gap-2">
          <span className="font-serif text-4xl font-bold text-primary-600">{avgRating.toFixed(1)}</span>
          <Star className="h-6 w-6 fill-amber-400 text-amber-400" />
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-primary-50 p-6">
        <p className="text-xs uppercase tracking-wide text-ink-700">Total Reviews</p>
        <div className="mt-1 flex items-center gap-2">
          <span className="font-serif text-4xl font-bold text-ink-900">{reviewCount}</span>
          <Users className="h-6 w-6 text-ink-500" />
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-primary-50 p-6">
        <p className="text-xs uppercase tracking-wide text-ink-700">Global Rank</p>
        <div className="mt-1 flex items-center gap-2">
          <span className="font-serif text-4xl font-bold text-ink-900">{rank ? `#${rank}` : '—'}</span>
          <Trophy className="h-6 w-6 text-amber-500" />
        </div>
        <RankingTrendBadge trend={trend} variant="light" />
      </div>
    </>
  );
}
