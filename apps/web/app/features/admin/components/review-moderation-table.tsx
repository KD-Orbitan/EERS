'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { CheckCircle2, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StarRating } from '@/features/review/components/star-rating';
import { getErrorMessage } from '@/lib/get-error-message';
import { useBusinessesQuery } from '@/features/business/queries/use-businesses.query';
import { useBusinessReviewsQuery } from '@/features/review/queries/use-business-reviews.query';
import { useApproveReviewMutation } from '@/features/admin/mutations/use-approve-review.mutation';
import { useRejectReviewMutation } from '@/features/admin/mutations/use-reject-review.mutation';
import { RejectModal } from '@/features/admin/components/reject-modal';

// There's no global "all pending reviews" endpoint (only GET
// /businesses/:id/reviews?status=pending, per-business, admin-only). So this
// scopes moderation to one business at a time, picked from the public
// approved-businesses list — the only business picker the API supports.
export function ReviewModerationTable() {
  const [businessId, setBusinessId] = useState<number | undefined>(undefined);
  const [rejectingReviewId, setRejectingReviewId] = useState<number | null>(null);

  const { data: businesses } = useBusinessesQuery({ limit: 100, sortBy: 'createdAt', sortOrder: 'desc' });
  const { data: reviewsData, isLoading } = useBusinessReviewsQuery(businessId, { status: 'pending', limit: 50 });
  const approveMutation = useApproveReviewMutation(businessId ?? 0);
  const rejectMutation = useRejectReviewMutation(businessId ?? 0);

  const onApprove = async (reviewId: number) => {
    try {
      await approveMutation.mutateAsync(reviewId);
      toast.success('Review approved.');
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Unable to approve review.'));
    }
  };

  const onReject = async (data: { reason: string }) => {
    if (rejectingReviewId === null) return;
    try {
      await rejectMutation.mutateAsync({ reviewId: rejectingReviewId, ...data });
      toast.success('Review rejected.');
      setRejectingReviewId(null);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Unable to reject review.'));
    }
  };

  return (
    <div className="space-y-4">
      <div className="max-w-sm">
        <label className="mb-1 block text-sm font-medium text-ink-700" htmlFor="business-picker">
          Business
        </label>
        <select
          id="business-picker"
          value={businessId ?? ''}
          onChange={(event) => setBusinessId(event.target.value ? Number(event.target.value) : undefined)}
          className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
        >
          <option value="">Select a business...</option>
          {businesses?.items.map((business) => (
            <option key={business.businessId} value={business.businessId}>
              {business.name}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-ink-500">Only approved businesses are listed here (the only business picker the API supports).</p>
      </div>

      {!businessId ? null : isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-24 animate-pulse rounded-2xl bg-white shadow-xs ring-1 ring-slate-200" />
          ))}
        </div>
      ) : !reviewsData || reviewsData.items.length === 0 ? (
        <div className="rounded-3xl bg-white p-10 text-center shadow-xs ring-1 ring-slate-200">
          <p className="text-sm text-ink-700">No pending reviews for this business.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviewsData.items.map((review) => (
            <div key={review.reviewId} className="rounded-2xl bg-white p-5 shadow-xs ring-1 ring-slate-200">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-serif text-sm font-bold text-ink-900">{review.author.name}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <StarRating value={review.overallRating} readOnly size="sm" />
                    <span className="text-xs text-ink-500">{new Date(review.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <Badge variant="warning">pending</Badge>
              </div>

              <p className="mt-3 whitespace-pre-wrap text-sm text-ink-700">{review.content}</p>

              {review.criteriaRatings.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {review.criteriaRatings.map((criterion) => (
                    <Badge key={criterion.criterionId} variant="brand">
                      {criterion.criterionName} {criterion.ratingValue}/5
                    </Badge>
                  ))}
                </div>
              ) : null}

              <div className="mt-3 flex items-center gap-3 border-t border-slate-100 pt-3">
                <Button
                  onClick={() => onApprove(review.reviewId)}
                  disabled={approveMutation.isPending}
                  className="gap-1.5 bg-emerald-600 py-1.5 text-xs hover:bg-emerald-700"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Approve
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setRejectingReviewId(review.reviewId)}
                  disabled={rejectMutation.isPending}
                  className="gap-1.5 py-1.5 text-xs text-red-600 hover:bg-red-50"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  Reject
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <RejectModal
        isOpen={rejectingReviewId !== null}
        onClose={() => setRejectingReviewId(null)}
        onSubmit={onReject}
        isLoading={rejectMutation.isPending}
        title="Reject review"
      />
    </div>
  );
}
