'use client';

import { Suspense, useMemo, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { Plus } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { BusinessSearchBar } from '@/features/business/components/business-search-bar';
import { BusinessSortTabs } from '@/features/business/components/business-sort-tabs';
import { BusinessList } from '@/features/business/components/business-list';
import { BusinessSpotlightCard } from '@/features/business/components/business-spotlight-card';
import { useBusinessesQuery, BusinessListParams } from '@/features/business/queries/use-businesses.query';
import { MapPin } from '@/features/business/components/business-directory-map';

// Leaflet needs `window` — loaded client-only, never during SSR/prerender.
const BusinessDirectoryMap = dynamic(
  () => import('@/features/business/components/business-directory-map').then((mod) => mod.BusinessDirectoryMap),
  { ssr: false, loading: () => <div className="h-full min-h-[400px] animate-pulse rounded-3xl bg-white shadow-xs ring-1 ring-slate-200" /> },
);

const SORT_BY_VALUES: NonNullable<BusinessListParams['sortBy']>[] = ['avgRating', 'createdAt', 'reviewCount'];

// Reads initial search/categoryId/sortBy from the URL (?search=, ?categoryId=,
// ?sortBy=) so links from the homepage hero search, the "Explore by Sector"
// category grid, and the rankings page's "Trending"/"Best in Category"
// sections land pre-filtered/sorted here — this page previously only
// supported filtering via its own inputs, so those incoming links would
// silently show unfiltered results. useSearchParams() requires a Suspense
// boundary (see default export below), otherwise Next.js bails the whole
// route out of static prerendering.
function BusinessesPageContent() {
  const { isAuthenticated } = useAuth();
  const searchParams = useSearchParams();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState(searchParams.get('search') ?? '');
  const [categoryId, setCategoryId] = useState<number | undefined>(() => {
    const raw = searchParams.get('categoryId');
    return raw ? Number(raw) : undefined;
  });
  const [province, setProvince] = useState('');
  const [sortBy, setSortBy] = useState<NonNullable<BusinessListParams['sortBy']>>(() => {
    const raw = searchParams.get('sortBy');
    return SORT_BY_VALUES.includes(raw as NonNullable<BusinessListParams['sortBy']>) ? (raw as NonNullable<BusinessListParams['sortBy']>) : 'avgRating';
  });

  const { data, isLoading } = useBusinessesQuery({
    page,
    search: search || undefined,
    categoryId,
    province: province || undefined,
    sortBy,
    sortOrder: 'desc',
  });

  // The "top" business is simply items[0] of the already avgRating-sorted,
  // currently-filtered result set — the global top when nothing is
  // filtered/searched, the top match when something is. Only meaningful on
  // page 1 (items[0] on later pages is just that page's first row, not a
  // real "top").
  const items = data?.items ?? [];
  const showSpotlight = page === 1 && items.length > 0;
  const topBusiness = showSpotlight ? items[0] : undefined;
  const gridBusinesses = showSpotlight ? items.slice(1) : items;

  const mapPins = useMemo<MapPin[]>(
    () =>
      items
        .filter((business): business is typeof business & { latitude: number; longitude: number } => business.latitude !== null && business.longitude !== null)
        .map((business) => ({
          businessId: business.businessId,
          name: business.name,
          latitude: business.latitude,
          longitude: business.longitude,
        })),
    [items],
  );

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-7xl">
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

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr] lg:items-start">
          <div>
            {topBusiness ? (
              <div className="mb-6">
                <BusinessSpotlightCard business={topBusiness} />
              </div>
            ) : null}

            <BusinessList businesses={gridBusinesses} isLoading={isLoading} pagination={data?.meta} onPageChange={setPage} />
          </div>

          <div className="lg:sticky lg:top-20 lg:h-[calc(100vh-6rem)]">
            <BusinessDirectoryMap pins={mapPins} />
          </div>
        </div>
      </div>
    </main>
  );
}

export default function BusinessesPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-slate-50 px-4 py-8" />}>
      <BusinessesPageContent />
    </Suspense>
  );
}
