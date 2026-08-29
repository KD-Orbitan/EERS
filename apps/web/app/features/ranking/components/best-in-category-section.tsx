'use client';

import { useCategoriesByBusinessCountQuery } from '@/features/ranking/queries/use-categories-by-business-count.query';
import { useCategoryLeaderboardsQuery } from '@/features/ranking/queries/use-category-leaderboards.query';
import { CategoryLeaderboardRow } from '@/features/ranking/components/category-leaderboard-row';
import { LEADERBOARD_CARD_CLASS, LEADERBOARD_ROW_CLASS } from '@/features/ranking/utils/leaderboard-grid';

const FEATURED_CATEGORY_COUNT = 2;
const ITEMS_PER_CATEGORY = 4;

// "Best in Category" — one Trustpilot "Best in Bank"-style row per featured
// category: title + "See more" pill, then a row of business cards (shared
// CategoryLeaderboardRow, same visual pattern as TrendingBusinessesSection).
// No growth badge here — ranking_snapshot_history only tracks GLOBAL scope
// (DECISIONS.md D-031), so category-filtered results have no trend to show.
// Featured categories are the FEATURED_CATEGORY_COUNT categories with the
// most ranked businesses (useCategoriesByBusinessCountQuery), not just the
// first N from GET /categories.
export function BestInCategorySection() {
  const { data: categoriesByCount, isLoading: isLoadingCategories } = useCategoriesByBusinessCountQuery();
  const featured = categoriesByCount.slice(0, FEATURED_CATEGORY_COUNT).map((entry) => entry.category);
  const leaderboards = useCategoryLeaderboardsQuery(featured, ITEMS_PER_CATEGORY);

  const isLoading = isLoadingCategories || leaderboards.some((board) => board.isLoading);
  const populated = leaderboards.filter((board) => board.items.length > 0);

  if (!isLoading && populated.length === 0) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="space-y-8">
        {Array.from({ length: FEATURED_CATEGORY_COUNT }).map((_, index) => (
          <div key={index} className="space-y-4">
            <div className="h-8 w-56 animate-pulse rounded bg-ink-200" />
            <div className={LEADERBOARD_ROW_CLASS}>
              {Array.from({ length: ITEMS_PER_CATEGORY }).map((_, cardIndex) => (
                <div key={cardIndex} className={`h-48 animate-pulse rounded-2xl bg-ink-50 shadow-xs ring-1 ring-ink-200 ${LEADERBOARD_CARD_CLASS}`} />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {populated.map(({ category, items }) => (
        <CategoryLeaderboardRow key={category.categoryId} category={category} items={items} />
      ))}
    </div>
  );
}
