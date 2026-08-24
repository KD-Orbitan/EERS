'use client';

import { useReviewStatisticsQuery } from '@/features/review/queries/use-review-statistics.query';

interface ReviewDistributionCardProps {
  businessId: number;
}

// Public "Review Distribution" widget from the Figma Business Profile mockup
// — percentage per star, computed from the same public review-statistics
// endpoint ReviewSummary already uses for its avgRating/count line.
export function ReviewDistributionCard({ businessId }: ReviewDistributionCardProps) {
  const { data, isLoading } = useReviewStatisticsQuery(businessId);

  if (isLoading) {
    return <div className="h-64 animate-pulse rounded-3xl bg-white shadow-xs ring-1 ring-slate-200" />;
  }

  if (!data || data.reviewCount === 0) {
    return (
      <div className="rounded-3xl bg-white p-6 shadow-xs ring-1 ring-slate-200">
        <h2 className="font-sans text-lg font-bold text-ink-900">Review Distribution</h2>
        <p className="mt-8 text-center text-sm text-ink-500">No approved reviews yet.</p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl bg-white p-6 shadow-xs ring-1 ring-slate-200">
      <h2 className="font-sans text-lg font-bold text-ink-900">Review Distribution</h2>

      <div className="mt-4 space-y-2">
        {([5, 4, 3, 2, 1] as const).map((star) => {
          const count = data.ratingDistribution[star];
          const percentage = Math.round((count / data.reviewCount) * 100);
          return (
            <div key={star} className="flex items-center gap-2 text-xs text-ink-700">
              <span className="w-8 shrink-0">{star}★</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-primary-100">
                <div className="h-full rounded-full bg-primary-600" style={{ width: `${percentage}%` }} />
              </div>
              <span className="w-9 shrink-0 text-right">{percentage}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
