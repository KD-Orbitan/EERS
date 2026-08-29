'use client';

import Link from 'next/link';
import { useTrendingBusinessesQuery } from '@/features/ranking/queries/use-trending-businesses.query';
import { BusinessLeaderboardCard } from '@/features/ranking/components/business-leaderboard-card';
import { LEADERBOARD_CARD_CLASS, LEADERBOARD_ROW_CLASS } from '@/features/ranking/utils/leaderboard-grid';

// "Trending Businesses" — same "Best in Bank" card row as BestInCategorySection
// below: title + "See more" pill, then a row of business cards. Growth % sits
// next to the logo on each card (BusinessLeaderboardCard's growthPercent prop).
// Only ever shows GLOBAL-scope businesses since ranking_snapshot_history is
// GLOBAL-only (DECISIONS.md D-031); hides itself entirely once there isn't
// yet enough history to compute any positive growth.
//
// "See more" links to the Business Directory's existing "Growth" sort tab
// (sortBy=reviewCount) rather than a true growth-% sort — GET /businesses
// only allows sortBy avgRating/createdAt/reviewCount (API.md) and
// BusinessListItem carries no rankingScore/trend field, so there is no
// documented way to sort the directory by the same score-growth % this
// section itself computes from ranking_snapshot_history.
const TRENDING_LIMIT = 4;

export function TrendingBusinessesSection() {
  const { data, isLoading } = useTrendingBusinessesQuery({ limit: TRENDING_LIMIT });

  if (isLoading) {
    return (
      <div className={LEADERBOARD_ROW_CLASS}>
        {Array.from({ length: TRENDING_LIMIT }).map((_, index) => (
          <div key={index} className={`h-48 animate-pulse rounded-2xl bg-ink-50 shadow-xs ring-1 ring-ink-200 ${LEADERBOARD_CARD_CLASS}`} />
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return null;
  }

  return (
    <section>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-sans text-2xl font-bold text-ink-900">Trending Businesses</h2>
        <Link
          href="/businesses?sortBy=reviewCount"
          className="inline-flex shrink-0 items-center rounded-full border border-primary-600 px-4 py-1.5 text-sm font-bold text-primary-600 transition hover:bg-primary-50"
        >
          See more
        </Link>
      </div>
      <div className={LEADERBOARD_ROW_CLASS}>
        {data.map((item) => (
          <div key={item.businessId} className={LEADERBOARD_CARD_CLASS}>
            <BusinessLeaderboardCard
              businessId={item.businessId}
              businessName={item.businessName}
              province={item.province}
              rankingScore={item.rankingScore}
              reviewCount={item.reviewCount}
              growthPercent={item.growthPercent}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
