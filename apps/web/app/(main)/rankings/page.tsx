'use client';

import { useState } from 'react';
import { RankingFilters } from '@/features/ranking/components/ranking-filters';
import { RankingSpotlight } from '@/features/ranking/components/ranking-spotlight';
import { RankingMethodology } from '@/features/ranking/components/ranking-methodology';
import { RankingTable } from '@/features/ranking/components/ranking-table';
import { useRankingsQuery } from '@/features/ranking/queries/use-rankings.query';
import { useTopBusinessesQuery } from '@/features/ranking/queries/use-top-businesses.query';

export default function RankingsPage() {
  const [page, setPage] = useState(1);
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined);
  const [province, setProvince] = useState('');

  const filterParams = { categoryId, province: province || undefined };

  const { data: topBusinesses, isLoading: isLoadingTop } = useTopBusinessesQuery({ limit: 3, ...filterParams });
  const { data, isLoading } = useRankingsQuery({ page, ...filterParams });

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
            <h1 className="font-serif text-4xl font-bold text-ink-900 sm:text-5xl">Enterprise Leaderboard</h1>
            <p className="mt-3 text-base text-ink-700">
              Businesses ranked by review score across EERS, recalculated hourly from approved customer reviews.
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

        <RankingTable rankings={data?.items ?? []} isLoading={isLoading} pagination={data?.meta} onPageChange={setPage} />
      </div>
    </main>
  );
}
