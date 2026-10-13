'use client';

import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';
import { OwnerDashboardSidebar } from '@/features/business/components/owner-dashboard-sidebar';
import { BusinessStatTiles } from '@/features/business/components/business-stat-tiles';
import { LocationList } from '@/features/business/components/location-list';
import { useBusinessDetailQuery } from '@/features/business/queries/use-business-detail.query';
import { useBusinessRankingQuery } from '@/features/ranking/queries/use-business-ranking.query';
import { MarketCompetitorsCard } from '@/features/ranking/components/market-competitors-card';
import { CriteriaScoresCard } from '@/features/review/components/criteria-scores-card';
import { ReviewDistributionCard } from '@/features/review/components/review-distribution-card';
import { SentimentSummaryCard } from '@/features/review/components/sentiment-summary-card';
import { ReviewSummary } from '@/features/review/components/review-summary';
import { ReviewTrendChart } from '@/features/business/components/review-trend-chart';

export default function BusinessOwnerDashboardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const businessId = Number(id);
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();

  const { data: business, isLoading, isError } = useBusinessDetailQuery(businessId);
  const { data: ranking } = useBusinessRankingQuery(businessId);

  const isOwner = Boolean(business && user && (business.owner?.userId === user.userId || user.role === 'ADMIN'));

  useEffect(() => {
    if (!isAuthLoading && !isLoading && business && !isOwner) {
      toast.error('You do not have access to this dashboard.');
      router.replace(`/businesses/${businessId}`);
    }
  }, [isAuthLoading, isLoading, business, isOwner, router, businessId]);

  if (isLoading || isAuthLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-ink-50">
        <p className="text-sm text-ink-600">Loading...</p>
      </main>
    );
  }

  if (isError || !business || !isOwner) {
    return null;
  }

  const lastCalculated = ranking?.lastCalculatedAt
    ? new Date(ranking.lastCalculatedAt).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : null;

  return (
    <div className="flex min-h-screen bg-ink-50">
      <OwnerDashboardSidebar businessId={businessId} currentPath={`/businesses/${businessId}/dashboard`} />

      <div className="flex-1 px-6 py-8 sm:px-10">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="font-sans text-3xl font-bold text-ink-900">Dashboard Overview</h1>
              <p className="mt-1 text-sm text-ink-700">Performance overview for {business.name}</p>
            </div>
            {lastCalculated ? (
              <span className="rounded-full border border-ink-200 bg-ink-50 px-4 py-2 text-xs font-medium text-ink-700">
                Rank last calculated {lastCalculated}
              </span>
            ) : null}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <BusinessStatTiles
              avgRating={business.avgRating}
              reviewCount={business.reviewCount}
              rank={ranking?.rank}
              trend={ranking?.trend}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <ReviewDistributionCard businessId={businessId} />
            <SentimentSummaryCard businessId={businessId} />
          </div>

          <ReviewTrendChart businessId={businessId} />

          <CriteriaScoresCard businessId={businessId} />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr] lg:items-start">
            <ReviewSummary businessId={businessId} isOwner={true} />

            <div className="space-y-6">
              <MarketCompetitorsCard businessId={businessId} />
              <LocationList businessId={businessId} locations={business.locations} isOwner={isOwner} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
