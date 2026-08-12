'use client';

import { ReviewCard } from '@/features/review/components/review-card';
import { ReplyInput } from '@/features/review/schemas/reply.schema';
import { ReviewListItem } from '@/features/review/types/review.type';
import { PaginationMeta } from '@/features/business/types/business.type';

interface ReviewListProps {
  reviews: ReviewListItem[];
  isLoading: boolean;
  pagination?: PaginationMeta;
  onPageChange?: (page: number) => void;
  businessId?: number;
  currentUserId?: number;
  isBusinessOwner?: boolean;
  onEdit?: (reviewId: number) => void;
  onDelete?: (reviewId: number) => void;
  onReply?: (reviewId: number, input: ReplyInput) => void | Promise<void>;
  replyingReviewId?: number | null;
  onReport?: (reviewId: number) => void;
}

export function ReviewList({
  reviews,
  isLoading,
  pagination,
  onPageChange,
  businessId,
  currentUserId,
  isBusinessOwner,
  onEdit,
  onDelete,
  onReply,
  replyingReviewId,
  onReport,
}: ReviewListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-32 animate-pulse rounded-2xl bg-white shadow-xs ring-1 ring-slate-200" />
        ))}
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="rounded-2xl bg-white p-10 text-center shadow-xs ring-1 ring-slate-200">
        <p className="text-sm text-ink-700">No reviews yet.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-4">
        {reviews.map((review) => (
          <ReviewCard
            key={review.reviewId}
            review={review}
            businessId={businessId}
            isAuthor={currentUserId === review.author.userId}
            canReply={isBusinessOwner}
            onEdit={() => onEdit?.(review.reviewId)}
            onDelete={() => onDelete?.(review.reviewId)}
            onReplySubmit={(input) => onReply?.(review.reviewId, input)}
            isReplying={replyingReviewId === review.reviewId}
            onReport={currentUserId && onReport ? () => onReport(review.reviewId) : undefined}
          />
        ))}
      </div>

      {pagination && pagination.totalPages > 1 && onPageChange ? (
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => onPageChange(pagination.page - 1)}
            disabled={pagination.page <= 1}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-slate-600">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            type="button"
            onClick={() => onPageChange(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      ) : null}
    </div>
  );
}
