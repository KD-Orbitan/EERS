'use client';

import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Trash2, Pencil } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { StarRating } from '@/features/review/components/star-rating';
import { getErrorMessage } from '@/lib/get-error-message';
import { useMyReviewsQuery } from '@/features/review/queries/use-my-reviews.query';
import { useDeleteReviewMutation } from '@/features/review/mutations/use-delete-review.mutation';
import { ReviewStatus } from '@/features/review/types/review.type';

const statusVariant: Record<ReviewStatus, 'neutral' | 'success' | 'warning' | 'danger'> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
  hidden: 'neutral',
};

export default function MyReviewsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useMyReviewsQuery({ page });
  const deleteReviewMutation = useDeleteReviewMutation();

  const onDelete = async (reviewId: number, businessId: number) => {
    if (!window.confirm('Delete this review? This cannot be undone.')) return;

    try {
      await deleteReviewMutation.mutateAsync({ reviewId, businessId });
      toast.success('Review deleted.');
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Unable to delete review. Please try again.'));
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-6 font-sans text-3xl font-bold text-ink-900">My Reviews</h1>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-20 animate-pulse rounded-2xl bg-white shadow-xs ring-1 ring-slate-200" />
            ))}
          </div>
        ) : !data || data.items.length === 0 ? (
          <div className="rounded-2xl bg-white p-10 text-center shadow-xs ring-1 ring-slate-200">
            <p className="text-sm text-ink-700">You haven&apos;t written any reviews yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {data.items.map((review) => (
              <div
                key={review.reviewId}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-xs ring-1 ring-slate-200"
              >
                <div>
                  <Link
                    href={`/businesses/${review.business.businessId}`}
                    className="font-sans text-sm font-bold text-ink-900 hover:text-primary-600"
                  >
                    {review.business.name}
                  </Link>
                  <div className="mt-1 flex items-center gap-2">
                    <StarRating value={review.overallRating} readOnly size="sm" />
                    <Badge variant={statusVariant[review.status]}>{review.status}</Badge>
                    <span className="text-xs text-ink-500">{new Date(review.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Link
                    href={`/businesses/${review.business.businessId}/reviews/write?reviewId=${review.reviewId}`}
                    className="inline-flex items-center gap-1 text-sm font-medium text-ink-700 hover:text-primary-600"
                  >
                    <Pencil className="h-4 w-4" />
                    Edit
                  </Link>
                  <button
                    type="button"
                    onClick={() => onDelete(review.reviewId, review.business.businessId)}
                    className="inline-flex items-center gap-1 text-sm font-medium text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {data?.meta && data.meta.totalPages > 1 ? (
          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setPage((prev) => prev - 1)}
              disabled={data.meta.page <= 1}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-slate-600">
              Page {data.meta.page} of {data.meta.totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((prev) => prev + 1)}
              disabled={data.meta.page >= data.meta.totalPages}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        ) : null}
      </div>
    </main>
  );
}
