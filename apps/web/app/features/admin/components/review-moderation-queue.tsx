'use client';

import { useState } from 'react';
import { ListPagination, ListSearch } from '@/components/ui/list-controls';
import Link from 'next/link';
import { toast } from 'sonner';
import { CheckCircle2, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { StarRating } from '@/features/review/components/star-rating';
import { getErrorMessage } from '@/lib/get-error-message';
import { useAdminReviewsQuery } from '@/features/admin/queries/use-admin-reviews.query';
import { useApproveReviewMutation } from '@/features/admin/mutations/use-approve-review.mutation';
import { useRejectReviewMutation } from '@/features/admin/mutations/use-reject-review.mutation';
import { RejectModal } from '@/features/admin/components/reject-modal';
import { ReviewStatus } from '@/features/review/types/review.type';

const statusVariant: Record<ReviewStatus, 'neutral' | 'success' | 'warning' | 'danger'> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
  hidden: 'neutral',
};

const STATUS_TABS: Array<{ value: ReviewStatus; label: string }> = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'hidden', label: 'Hidden' },
];

// Real global queue across every business, replacing the old "pick one
// approved business then see its pending reviews" flow now that
// GET /admin/reviews exists (added specifically to back this UI).
export function ReviewModerationQueue() {
  const [status, setStatus] = useState<ReviewStatus>('pending');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [approvingReview, setApprovingReview] = useState<{ reviewId: number; businessId: number } | null>(null);
  const [approvalReason, setApprovalReason] = useState('');
  const [rejectingReviewId, setRejectingReviewId] = useState<{ reviewId: number; businessId: number } | null>(null);

  const { data, isLoading } = useAdminReviewsQuery({ search: search.trim() || undefined, status, page, limit: 20 });
  const approveMutation = useApproveReviewMutation();
  const rejectMutation = useRejectReviewMutation();

  const onApprove = async (reviewId: number, businessId: number) => {
    try {
      await approveMutation.mutateAsync({ reviewId, businessId, reason: approvalReason.trim() || undefined });
      setApprovingReview(null);
      setApprovalReason('');
      toast.success('Review approved.');
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Unable to approve review.'));
    }
  };

  const onReject = async (data: { reason: string }) => {
    if (!rejectingReviewId) return;
    try {
      await rejectMutation.mutateAsync({ ...rejectingReviewId, ...data });
      toast.success('Review rejected.');
      setRejectingReviewId(null);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Unable to reject review.'));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1.5">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => {
              setStatus(tab.value);
              setPage(1);
            }}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              status === tab.value ? 'bg-primary-600 text-white' : 'bg-ink-50 text-ink-700 ring-1 ring-ink-200 hover:bg-ink-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <p className="text-sm text-ink-500">
        {status === 'pending'
          ? 'Reviews awaiting a decision. Open Approved or Rejected to see who moderated each review, when, and why.'
          : status === 'approved' || status === 'rejected'
            ? 'Moderation details appear below each review. Older reviews may have no recorded date or reason.'
            : 'Hidden reviews are not publicly visible.'}
      </p>

      <ListSearch value={search} onChange={(value) => { setSearch(value); setPage(1); }}
        placeholder="Business, author or review content..." />

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-28 animate-pulse rounded-2xl bg-ink-50 shadow-xs ring-1 ring-ink-200" />
          ))}
        </div>
      ) : !data || data.items.length === 0 ? (
        <div className="rounded-3xl bg-ink-50 p-10 text-center shadow-xs ring-1 ring-ink-200">
          <p className="text-sm text-ink-700">No {status} reviews.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.items.map((review) => (
            <div key={review.reviewId} className="rounded-2xl bg-ink-50 p-5 shadow-xs ring-1 ring-ink-200">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <Link
                    href={`/businesses/${review.businessId}`}
                    className="font-sans text-sm font-bold text-primary-600 hover:text-primary-700"
                  >
                    {review.businessName}
                  </Link>
                  <p className="mt-0.5 text-xs text-ink-500">by {review.authorName}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <StarRating value={review.overallRating} readOnly size="sm" />
                    <span className="text-xs text-ink-500">{new Date(review.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <Badge variant={statusVariant[review.status]}>{review.status}</Badge>
              </div>

              <p className="mt-3 whitespace-pre-wrap text-sm text-ink-700">{review.content}</p>

              {review.status === 'approved' || review.status === 'rejected' ? (
                <dl className="mt-3 space-y-1 border-t border-ink-100 pt-3 text-xs text-ink-600">
                  <div><dt className="inline font-semibold">{review.status === 'approved' ? 'Approved by' : 'Rejected by'}: </dt>
                    <dd className="inline">{review.managedBy ? `${review.managedBy.name} (#${review.managedBy.userId})` : 'No recorded admin'}</dd></div>
                  <div><dt className="inline font-semibold">Moderated at: </dt>
                    <dd className="inline">{review.moderatedAt ? new Date(review.moderatedAt).toLocaleString() : 'No recorded date'}</dd></div>
                  <div><dt className="font-semibold">{review.status === 'approved' ? 'Approval note' : 'Rejection reason'}:</dt>
                    <dd className="whitespace-pre-wrap break-words">{review.moderationReason || (review.status === 'approved' && review.moderatedAt ? 'No note provided' : 'No recorded reason')}</dd></div>
                </dl>
              ) : null}

              {review.status === 'pending' ? (
                <div className="mt-3 flex items-center gap-3 border-t border-ink-100 pt-3">
                  <Button
                    onClick={() => { setApprovalReason(''); setApprovingReview({ reviewId: review.reviewId, businessId: review.businessId }); }}
                    disabled={approveMutation.isPending}
                    className="gap-1.5 bg-emerald-600 py-1.5 text-xs hover:bg-emerald-700"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setRejectingReviewId({ reviewId: review.reviewId, businessId: review.businessId })}
                    disabled={rejectMutation.isPending}
                    className="gap-1.5 py-1.5 text-xs text-red-600 hover:bg-red-50"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    Reject
                  </Button>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}

      {data?.meta ? (
        <ListPagination page={page} limit={data.meta.limit} total={data.meta.total} onPageChange={setPage} />
      ) : null}

      <Dialog open={approvingReview !== null} onOpenChange={(open) => { if (!open && !approveMutation.isPending) setApprovingReview(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Approve review</DialogTitle></DialogHeader>
          <form className="space-y-3" onSubmit={(event) => { event.preventDefault(); if (approvingReview && !approveMutation.isPending) void onApprove(approvingReview.reviewId, approvingReview.businessId); }}>
            <label htmlFor="approval-reason" className="block text-sm font-medium">Approval note (optional)</label>
            <textarea id="approval-reason" rows={4} maxLength={500} value={approvalReason} onChange={(event) => setApprovalReason(event.target.value)} disabled={approveMutation.isPending} className="w-full rounded-lg border border-ink-300 px-3 py-2 text-sm" />
            <p className="text-right text-xs text-ink-500">{approvalReason.length}/500</p>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" disabled={approveMutation.isPending} onClick={() => setApprovingReview(null)}>Cancel</Button>
              <Button type="submit" disabled={approveMutation.isPending}>{approveMutation.isPending ? 'Approving...' : 'Approve'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

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
