'use client';

import Link from 'next/link';
import { useMyBusinessesQuery } from '@/features/business/queries/use-my-businesses.query';
import { BusinessList } from '@/features/business/components/business-list';

// "My Businesses" profile tab: a 5-item preview + links to the full
// /businesses/my page (where delete/manage lives) and to create a new one.
export function MyBusinessesPanel() {
  const { data, isLoading } = useMyBusinessesQuery({ page: 1, limit: 5 });
  const total = data?.meta?.total ?? 0;

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-serif text-lg font-bold text-ink-900">
          {total} {total === 1 ? 'Business' : 'Businesses'}
        </h2>
        <div className="flex items-center gap-4">
          {total > 0 ? (
            <Link href="/businesses/my" className="text-sm font-medium text-primary-600 hover:text-primary-700">
              View all
            </Link>
          ) : null}
          <Link href="/businesses/create" className="text-sm font-medium text-primary-600 hover:text-primary-700">
            New business
          </Link>
        </div>
      </div>

      <BusinessList businesses={data?.items ?? []} isLoading={isLoading} emptyMessage="You haven't created any businesses yet." />
    </>
  );
}
