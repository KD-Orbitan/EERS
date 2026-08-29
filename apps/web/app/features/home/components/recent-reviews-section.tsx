'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { StarRating } from '@/features/review/components/star-rating';
import { useRecentReviewsQuery } from '@/features/review/queries/use-recent-reviews.query';
import { useBusinessDetailQuery } from '@/features/business/queries/use-business-detail.query';
import { BusinessLogoBadge } from '@/features/business/components/business-logo-badge';
import { RecentReviewItem } from '@/features/review/types/review.type';

const CONTENT_PREVIEW_LENGTH = 160;

// Fills the gap left by the dropped Figma "Review Carousel" (see this file's
// sibling home-page comment): same horizontally-scrollable card row shape,
// now backed by the real GET /reviews/recent endpoint instead of fabricated
// testimonials.
//
// Trustpilot-style layout: business identity (logo + name) up top, stars,
// review excerpt, reviewer + date at the bottom. GET /reviews/recent only
// documents reviewId/overallRating/content/author.name/business.{id,name}/
// createdAt (API.md), so each card fetches the already documented
// GET /businesses/:businessId for that business's logoUrl (falls back to an
// icon placeholder via BusinessLogoBadge when none is set).
function ReviewerAvatar({ name }: { name: string }) {
  const initial = name.trim().charAt(0).toUpperCase() || '?';
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-medium text-primary-600">
      {initial}
    </span>
  );
}

function RecentReviewCard({ review }: { review: RecentReviewItem }) {
  const { data: business } = useBusinessDetailQuery(review.business.businessId);
  const isLong = review.content.length > CONTENT_PREVIEW_LENGTH;
  const preview = isLong ? `${review.content.slice(0, CONTENT_PREVIEW_LENGTH)}...` : review.content;

  return (
    <div className="ease-md flex w-80 shrink-0 snap-start flex-col rounded-2xl bg-primary-50 p-6 shadow-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-md">
      <Link href={`/businesses/${review.business.businessId}`} className="group flex items-center gap-3 pb-4">
        <BusinessLogoBadge logoUrl={business?.logoUrl} name={review.business.name} size="sm" />
        <span className="truncate text-sm font-medium tracking-tight text-ink-900 group-hover:text-primary-600">
          {review.business.name}
        </span>
      </Link>

      <div className="mt-2">
        <StarRating value={review.overallRating} readOnly size="sm" />
      </div>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-600">{preview}</p>

      <div className="mt-4 flex items-center gap-3 pt-4">
        <ReviewerAvatar name={review.author.name} />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-ink-900">{review.author.name}</p>
          <p className="text-xs text-ink-500">{new Date(review.createdAt).toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  );
}

export function RecentReviewsSection() {
  const { data, isLoading } = useRecentReviewsQuery({ limit: 12 });

  if (!isLoading && (!data || data.length === 0)) {
    return null;
  }

  return (
    <div className="px-4 py-16">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-medium tracking-tight text-ink-900 sm:text-4xl">Recent Reviews</h2>
            <p className="mt-2 text-base text-ink-600">Real feedback, freshly posted across the directory.</p>
          </div>
          <Link href="/rankings" className="group inline-flex items-center gap-1 text-sm font-medium text-primary-600">
            View top-ranked businesses
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-flow-col grid-rows-2 gap-4 overflow-hidden">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-56 w-80 shrink-0 animate-pulse rounded-2xl bg-primary-50 shadow-sm" />
            ))}
          </div>
        ) : (
          <div className="grid snap-x grid-flow-col grid-rows-2 gap-4 overflow-x-auto pb-2">
            {data!.map((review) => (
              <RecentReviewCard key={review.reviewId} review={review} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
