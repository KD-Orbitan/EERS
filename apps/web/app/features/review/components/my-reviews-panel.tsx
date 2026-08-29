'use client';

import Link from 'next/link';
import { useMyReviewsQuery } from '@/features/review/queries/use-my-reviews.query';
import { MyReviewRow } from '@/features/review/components/my-review-row';

// "My Reviews" profile tab: a 5-item preview + "View all" link to the full
// paginated /reviews/my page, same preview-then-link-out shape as the other
// profile tabs (businesses/bookmarks/reports).
export function MyReviewsPanel() {
  const { data, isLoading } = useMyReviewsQuery({ page: 1, limit: 5 });
  const reviewCount = data?.meta?.total ?? 0;

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-sans text-lg font-bold text-ink-900">
          {reviewCount} {reviewCount === 1 ? 'Review' : 'Reviews'}
        </h2>
        {reviewCount > 0 ? (
          <Link href="/reviews/my" className="text-sm font-medium text-primary-600 hover:text-primary-700">
            View all
          </Link>
        ) : null}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-20 animate-pulse rounded-2xl bg-ink-100" />
          ))}
        </div>
      ) : !data || data.items.length === 0 ? (
        <p className="text-sm text-ink-700">You haven&apos;t written any reviews yet.</p>
      ) : (
        <div className="space-y-3">
          {data.items.map((review) => (
            <MyReviewRow key={review.reviewId} review={review} />
          ))}
        </div>
      )}
    </>
  );
}
