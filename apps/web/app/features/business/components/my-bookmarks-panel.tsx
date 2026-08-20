'use client';

import Link from 'next/link';
import { useMyBookmarksQuery } from '@/features/business/queries/use-my-bookmarks.query';
import { BusinessList } from '@/features/business/components/business-list';
import { BusinessCardData } from '@/features/business/components/business-card';

// "My Bookmarks" profile tab: a 5-item preview + "View all" link to the
// full /bookmarks page.
export function MyBookmarksPanel() {
  const { data, isLoading } = useMyBookmarksQuery({ page: 1, limit: 5 });
  const total = data?.meta?.total ?? 0;
  const businesses: BusinessCardData[] = (data?.items ?? []).map((item) => item.business);

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-serif text-lg font-bold text-ink-900">
          {total} {total === 1 ? 'Bookmark' : 'Bookmarks'}
        </h2>
        {total > 0 ? (
          <Link href="/bookmarks" className="text-sm font-medium text-primary-600 hover:text-primary-700">
            View all
          </Link>
        ) : null}
      </div>

      <BusinessList businesses={businesses} isLoading={isLoading} emptyMessage="You haven't bookmarked any businesses yet." />
    </>
  );
}
