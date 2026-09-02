'use client';

import Link from 'next/link';
import { Star, Trophy } from 'lucide-react';
import { useMarketCompetitorsQuery } from '@/features/ranking/queries/use-market-competitors.query';

interface MarketCompetitorsCardProps {
  businessId: number;
}

export function MarketCompetitorsCard({ businessId }: MarketCompetitorsCardProps) {
  const { data, isLoading } = useMarketCompetitorsQuery(businessId);

  if (isLoading) {
    return <div className="h-64 animate-pulse rounded-3xl bg-ink-50 shadow-xs ring-1 ring-ink-200" />;
  }

  if (!data || !data.categoryId || data.competitors.length === 0) {
    return (
      <div className="rounded-3xl bg-ink-50 p-6 shadow-xs ring-1 ring-ink-200">
        <h2 className="font-sans text-lg font-bold text-ink-900">Market Competitors</h2>
        <p className="mt-8 text-center text-sm text-ink-500">Not ranked in any category yet.</p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl bg-ink-50 p-6 shadow-xs ring-1 ring-ink-200">
      <h2 className="font-sans text-lg font-bold text-ink-900">Market Competitors</h2>
      <p className="mt-1 text-xs text-ink-500">
        {data.categoryName} · Rank #{data.businessRank}
      </p>

      <ul className="mt-4 space-y-2">
        {data.competitors.map((competitor) => (
          <li key={competitor.businessId}>
            <Link
              href={`/businesses/${competitor.businessId}`}
              className="flex items-center justify-between rounded-xl border border-ink-100 px-3 py-2.5 transition hover:border-primary-200 hover:bg-primary-50"
            >
              <div className="flex items-center gap-2 truncate">
                <span className="shrink-0 rounded-full bg-ink-100 px-2 py-0.5 text-xs font-bold text-ink-700">
                  #{competitor.rank}
                </span>
                <span className="truncate text-sm font-medium text-ink-900">{competitor.businessName}</span>
              </div>
              <div className="flex shrink-0 items-center gap-3 text-xs text-ink-700">
                <span className="flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  {competitor.avgRating.toFixed(1)}
                </span>
                <span className="flex items-center gap-1">
                  <Trophy className="h-3.5 w-3.5" />
                  {Math.round(competitor.rankingScore)}
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
