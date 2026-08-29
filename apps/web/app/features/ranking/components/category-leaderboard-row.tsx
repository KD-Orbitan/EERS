'use client';

import Link from 'next/link';
import { BusinessCategory } from '@/features/business/types/business.type';
import { TopRankingItem } from '@/features/ranking/types/ranking.type';
import { BusinessLeaderboardCard } from '@/features/ranking/components/business-leaderboard-card';
import { LEADERBOARD_CARD_CLASS, LEADERBOARD_ROW_CLASS } from '@/features/ranking/utils/leaderboard-grid';

// Shared "Best in {category}" row: title + "See more" pill, then a row of
// business cards. Extracted out of BestInCategorySection so the single-category
// TopRankedCategorySection (home page + rankings page) can render the exact
// same card language without duplicating this markup.
export function CategoryLeaderboardRow({ category, items }: { category: BusinessCategory; items: TopRankingItem[] }) {
  return (
    <section>
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
  );
}
