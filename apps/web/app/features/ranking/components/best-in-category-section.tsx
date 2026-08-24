'use client';

import Link from 'next/link';
import { useCategoriesQuery } from '@/features/business/queries/use-categories.query';
import { useCategoryLeaderboardsQuery } from '@/features/ranking/queries/use-category-leaderboards.query';
import { BusinessLeaderboardCard } from '@/features/ranking/components/business-leaderboard-card';
import { LEADERBOARD_CARD_CLASS, LEADERBOARD_ROW_CLASS } from '@/features/ranking/utils/leaderboard-grid';

const FEATURED_CATEGORY_COUNT = 3;
const ITEMS_PER_CATEGORY = 4;

// "Best in Category" — one Trustpilot "Best in Bank"-style row per featured
// category: title + "See more" pill, then a row of business cards (shared
// BusinessLeaderboardCard, same visual pattern as TrendingBusinessesSection).
// No growth badge here — ranking_snapshot_history only tracks GLOBAL scope
// (DECISIONS.md D-031), so category-filtered results have no trend to show.
// Featured categories are just the first FEATURED_CATEGORY_COUNT from
// GET /categories (no "featured" flag exists on BusinessCategory to pick a
// curated set instead).
export function BestInCategorySection() {
  const { data: categories, isLoading: isLoadingCategories } = useCategoriesQuery();
  const featured = (categories ?? []).slice(0, FEATURED_CATEGORY_COUNT);
  const leaderboards = useCategoryLeaderboardsQuery(featured, ITEMS_PER_CATEGORY);

  const isLoading = isLoadingCategories || leaderboards.some((board) => board.isLoading);
  const populated = leaderboards.filter((board) => board.items.length > 0);

  if (!isLoading && populated.length === 0) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="space-y-8">
        {Array.from({ length: 2 }).map((_, index) => (
          <div key={index} className="space-y-4">
            <div className="h-8 w-56 animate-pulse rounded bg-slate-200" />
            <div className={LEADERBOARD_ROW_CLASS}>
              {Array.from({ length: ITEMS_PER_CATEGORY }).map((_, cardIndex) => (
                <div key={cardIndex} className={`h-48 animate-pulse rounded-2xl bg-white shadow-xs ring-1 ring-slate-200 ${LEADERBOARD_CARD_CLASS}`} />
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
        <section key={category.categoryId}>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="font-sans text-2xl font-bold text-ink-900">Best in {category.categoryName}</h2>
            <Link
              href={`/businesses?categoryId=${category.categoryId}`}
              className="inline-flex shrink-0 items-center rounded-full border border-primary-600 px-4 py-1.5 text-sm font-bold text-primary-600 transition hover:bg-primary-50"
            >
              See more
            </Link>
          </div>
          <div className={LEADERBOARD_ROW_CLASS}>
            {items.map((item) => (
              <div key={item.businessId} className={LEADERBOARD_CARD_CLASS}>
                <BusinessLeaderboardCard
                  businessId={item.businessId}
                  businessName={item.businessName}
                  province={item.province}
                  rankingScore={item.rankingScore}
                />
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
