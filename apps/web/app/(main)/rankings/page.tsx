'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { RankingFilters } from '@/features/ranking/components/ranking-filters';
import { RankingSpotlight } from '@/features/ranking/components/ranking-spotlight';
import { RankingMethodology } from '@/features/ranking/components/ranking-methodology';
import { RankingTable } from '@/features/ranking/components/ranking-table';
import { TrendingBusinessesSection } from '@/features/ranking/components/trending-businesses-section';
import { BestInCategorySection } from '@/features/ranking/components/best-in-category-section';
import { TopRankedCategorySection } from '@/features/ranking/components/top-ranked-category-section';
import { useRankingsQuery } from '@/features/ranking/queries/use-rankings.query';
import { useTopBusinessesQuery } from '@/features/ranking/queries/use-top-businesses.query';

// Reads the initial categoryId from the URL (?categoryId=) so the "Best in
// Category" section's "View all" links land pre-filtered here, same pattern
// as apps/web/app/(main)/businesses/page.tsx. useSearchParams() requires a
// Suspense boundary, hence the wrapper default export below.
function RankingsPageContent() {
  const searchParams = useSearchParams();
  const [page, setPage] = useState(1);
  const [categoryId, setCategoryId] = useState<number | undefined>(() => {
    const raw = searchParams.get('categoryId');
    return raw ? Number(raw) : undefined;
  });
  const [province, setProvince] = useState('');

  const filterParams = { categoryId, province: province || undefined };

  const { data: topBusinesses, isLoading: isLoadingTop } = useTopBusinessesQuery({ limit: 3, ...filterParams });
  const { data, isLoading } = useRankingsQuery({ page, ...filterParams });

  return (
    <main className="min-h-screen bg-ink-50 px-4 py-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
            <h1 className="font-sans text-4xl font-bold text-ink-900 sm:text-5xl">Enterprise Leaderboard</h1>
            <p className="mt-3 text-base text-ink-700">
              Compare businesses by review-based scores from the latest EERS ranking update.
            </p>
          </div>
          <RankingFilters
            categoryId={categoryId}
            province={province}
            onCategoryChange={(value) => {
              setCategoryId(value);
              setPage(1);
            }}
            onProvinceChange={(value) => {
              setProvince(value);
              setPage(1);
            }}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
          <RankingSpotlight items={topBusinesses ?? []} isLoading={isLoadingTop} />
          <RankingMethodology />
        </div>

        <TrendingBusinessesSection />

        <BestInCategorySection />

        <RankingTable rankings={data?.items ?? []} isLoading={isLoading} pagination={data?.meta} onPageChange={setPage} />

        <TopRankedCategorySection />
      </div>
    </main>
  );
}

export default function RankingsPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-ink-50 px-4 py-8" />}>
      <RankingsPageContent />
    </Suspense>
  );
}
