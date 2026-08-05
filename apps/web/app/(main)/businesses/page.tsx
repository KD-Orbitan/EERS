'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { BusinessSearchBar } from '@/features/business/components/business-search-bar';
import { BusinessSortTabs } from '@/features/business/components/business-sort-tabs';
import { BusinessList } from '@/features/business/components/business-list';
import { useBusinessesQuery, BusinessListParams } from '@/features/business/queries/use-businesses.query';

export default function BusinessesPage() {
  const { isAuthenticated } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined);
  const [province, setProvince] = useState('');
  const [sortBy, setSortBy] = useState<NonNullable<BusinessListParams['sortBy']>>('avgRating');

  const { data, isLoading } = useBusinessesQuery({
    page,
    search: search || undefined,
    categoryId,
    province: province || undefined,
    sortBy,
    sortOrder: 'desc',
  });

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-serif text-3xl font-bold text-ink-900">Business Directory</h1>
            <p className="mt-1 text-sm text-ink-700">Browse approved businesses on EERS</p>
          </div>
          <BusinessSortTabs sortBy={sortBy} onSortByChange={setSortBy} />
        </div>

        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start">
          <div className="flex-1">
            <BusinessSearchBar
              search={search}
              categoryId={categoryId}
              province={province}
              onSearchChange={(value) => {
                setSearch(value);
                setPage(1);
              }}
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
          {isAuthenticated ? (
            <Link href="/businesses/create" className="shrink-0">
              <Button>
                <Plus className="mr-1.5 h-4 w-4" />
                List your business
              </Button>
            </Link>
          ) : null}
        </div>

        <BusinessList
          businesses={data?.items ?? []}
          isLoading={isLoading}
          pagination={data?.meta}
          onPageChange={setPage}
        />
      </div>
    </main>
  );
}
