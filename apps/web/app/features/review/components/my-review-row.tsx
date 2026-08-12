'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { BusinessLogoBadge } from '@/features/business/components/business-logo-badge';
import { useBusinessDetailQuery } from '@/features/business/queries/use-business-detail.query';
import { StarRating } from '@/features/review/components/star-rating';
import { MyReviewListItem, ReviewStatus } from '@/features/review/types/review.type';

const statusVariant: Record<ReviewStatus, 'neutral' | 'success' | 'warning' | 'danger'> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
  hidden: 'neutral',
};

// GET /reviews/my doesn't return review content (API.md) — only
// rating/business/date/status — so this row can't show a Yelp-style excerpt.
// The business logo thumbnail is the one extra bit of Yelp identity it can
// add for free, fetched the same composed way as the homepage widgets.
export function MyReviewRow({ review }: { review: MyReviewListItem }) {
  const { data: business } = useBusinessDetailQuery(review.business.businessId);

  return (
    <Link
      href={`/businesses/${review.business.businessId}`}
      className="flex items-center gap-4 rounded-2xl border border-slate-100 p-4 transition hover:-translate-y-0.5 hover:bg-primary-50 hover:shadow-md"
    >
      <BusinessLogoBadge logoUrl={business?.logoUrl} name={review.business.name} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-serif text-sm font-bold text-ink-900">{review.business.name}</p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <StarRating value={review.overallRating} readOnly size="sm" />
          <span className="text-xs text-ink-500">{new Date(review.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
      <Badge variant={statusVariant[review.status]}>{review.status}</Badge>
    </Link>
  );
}
