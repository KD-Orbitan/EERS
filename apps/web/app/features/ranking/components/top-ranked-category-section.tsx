'use client';

import { useTopBusinessesQuery } from '@/features/ranking/queries/use-top-businesses.query';
import { useBusinessDetailQuery } from '@/features/business/queries/use-business-detail.query';
import { useCategoryLeaderboardsQuery } from '@/features/ranking/queries/use-category-leaderboards.query';
import { CategoryLeaderboardRow } from '@/features/ranking/components/category-leaderboard-row';
import { LEADERBOARD_CARD_CLASS, LEADERBOARD_ROW_CLASS } from '@/features/ranking/utils/leaderboard-grid';

const ITEMS_PER_CATEGORY = 4;

// Single "Best in {category}" row for the category of the #1 overall-ranked
// business — "the category that has the top-ranked business". GET
// /rankings/top doesn't return a category (API.md), so this resolves it by
// fetching the #1 business's detail (GET /businesses/:id, already documented
// and already used elsewhere for this exact purpose, e.g. TopRankedBento)
// and reading its first category. Reuses CategoryLeaderboardRow, the same
// markup BestInCategorySection uses, so this reads as the same section type
// wherever it's shown (home page, and above the footer on /rankings).
export function TopRankedCategorySection() {
  const { data: topBusinesses, isLoading: isLoadingTop } = useTopBusinessesQuery({ limit: 1 });
  const topBusiness = topBusinesses?.[0];
  const { data: detail, isLoading: isLoadingDetail } = useBusinessDetailQuery(topBusiness?.businessId);
  const category = detail?.categories?.[0];

  const leaderboards = useCategoryLeaderboardsQuery(category ? [category] : [], ITEMS_PER_CATEGORY);
  const board = leaderboards[0];

  const isLoading = isLoadingTop || (Boolean(topBusiness) && isLoadingDetail) || (Boolean(category) && (board?.isLoading ?? false));

  if (!isLoading && (!category || !board || board.items.length === 0)) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-56 animate-pulse rounded bg-ink-200" />
        <div className={LEADERBOARD_ROW_CLASS}>
          {Array.from({ length: ITEMS_PER_CATEGORY }).map((_, index) => (
            <div key={index} className={`h-48 animate-pulse rounded-2xl bg-ink-50 shadow-xs ring-1 ring-ink-200 ${LEADERBOARD_CARD_CLASS}`} />
          ))}
        </div>
      </div>
    );
  }

  return <CategoryLeaderboardRow category={category!} items={board!.items} />;
}
