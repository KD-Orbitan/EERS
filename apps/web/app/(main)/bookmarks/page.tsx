'use client';

import { useState } from 'react';
import { useMyBookmarksQuery } from '@/features/business/queries/use-my-bookmarks.query';
import { BusinessList } from '@/features/business/components/business-list';
import { BusinessCardData } from '@/features/business/components/business-card';

export default function MyBookmarksPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useMyBookmarksQuery({ page });

  const businesses: BusinessCardData[] = (data?.items ?? []).map((item) => item.business);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <h1 className="font-sans text-3xl font-bold text-ink-900">My Bookmarks</h1>
          <p className="mt-1 text-sm text-ink-700">Businesses you&apos;ve saved for later.</p>
        </div>

        <BusinessList
          businesses={businesses}
          isLoading={isLoading}
          pagination={data?.meta}
          onPageChange={setPage}
          emptyMessage="You haven't bookmarked any businesses yet."
        />
      </div>
    </main>
  );
}
