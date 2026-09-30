'use client';

import { useState } from 'react';
import { Flag, MessageSquareReply, Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { StarRating } from '@/features/review/components/star-rating';
import { ReplyForm } from '@/features/review/components/reply-form';
import { ReviewPhotoUpload } from '@/features/review/components/review-photo-upload';
import { ReplyInput } from '@/features/review/schemas/reply.schema';
import { ReviewListItem, ReviewStatus } from '@/features/review/types/review.type';

const statusVariant: Record<ReviewStatus, 'neutral' | 'success' | 'warning' | 'danger'> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
  hidden: 'neutral',
};

const CONTENT_PREVIEW_LENGTH = 240;

interface ReviewCardProps {
  review: ReviewListItem;
  businessId?: number;
  isAuthor?: boolean;
  canReply?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onReplySubmit?: (input: ReplyInput) => void | Promise<void>;
  isReplying?: boolean;
  onReport?: () => void;
}

export function ReviewCard({ review, businessId, isAuthor, canReply, onEdit, onDelete, onReplySubmit, isReplying, onReport }: ReviewCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showReplyForm, setShowReplyForm] = useState(false);

  const isLong = review.content.length > CONTENT_PREVIEW_LENGTH;
  const displayContent = isExpanded || !isLong ? review.content : `${review.content.slice(0, CONTENT_PREVIEW_LENGTH)}...`;

  return (
    <div className="rounded-2xl bg-ink-50 p-5 shadow-xs ring-1 ring-ink-200">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-sans text-sm font-bold text-ink-900">{review.author.name}</p>
          <div className="mt-1 flex items-center gap-2">
            <StarRating value={review.overallRating} readOnly size="sm" />
            <span className="text-xs text-ink-500">{new Date(review.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
        {review.status !== 'approved' ? <Badge variant={statusVariant[review.status]}>{review.status}</Badge> : null}
      </div>

      <p className="mt-3 whitespace-pre-wrap text-sm text-ink-700">
        {displayContent}
        {isLong ? (
          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="ml-1 font-medium text-primary-600 hover:text-primary-700"
          >
            {isExpanded ? 'Show less' : 'Read more'}
          </button>
        ) : null}
      </p>

      {review.criteriaRatings.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {review.criteriaRatings.map((criterion) => (
            <Badge key={criterion.criterionId} variant="brand">
              {criterion.criterionName} {criterion.ratingValue}/5
            </Badge>
          ))}
        </div>
      ) : null}

      <ReviewPhotoUpload reviewId={review.reviewId} businessId={businessId} photos={review.photos} isAuthor={Boolean(isAuthor)} />

      {isAuthor || canReply || (!isAuthor && onReport) ? (
        <div className="mt-3 flex gap-3 border-t border-ink-100 pt-3">
          {isAuthor ? (
            <>
              <button
                type="button"
                onClick={onEdit}
                className="inline-flex items-center gap-1 text-xs font-medium text-ink-700 hover:text-primary-600"
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </button>
              <button
                type="button"
                onClick={onDelete}
                className="inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </button>
            </>
          ) : null}
          {canReply && !review.reply && !showReplyForm ? (
            <button
              type="button"
              onClick={() => setShowReplyForm(true)}
              className="text-xs font-medium text-primary-600 hover:text-primary-700"
            >
              Reply
            </button>
          ) : null}
          {!isAuthor && onReport ? (
            <button
              type="button"
              onClick={onReport}
              className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-ink-500 hover:text-red-600"
            >
              <Flag className="h-3.5 w-3.5" />
              Report
            </button>
          ) : null}
        </div>
      ) : null}

      {canReply && !review.reply && showReplyForm ? (
        <div className="mt-3">
          <ReplyForm
            isLoading={isReplying}
            onCancel={() => setShowReplyForm(false)}
            onSubmit={async (input) => {
              await onReplySubmit?.(input);
              setShowReplyForm(false);
            }}
          />
        </div>
      ) : null}

      {review.reply ? (
        <div className="mt-4 rounded-xl border border-ink-200/50 bg-primary-50/40 p-4 sm:ml-4">
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
            <p className="inline-flex items-center gap-2 text-xs font-semibold text-ink-700">
              <MessageSquareReply aria-hidden="true" className="h-4 w-4 shrink-0 text-primary-600" />
              Company Response
            </p>
            <time dateTime={review.reply.createdAt} className="text-xs text-ink-500">
              {new Date(review.reply.createdAt).toLocaleDateString()}
            </time>
          </div>
          <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed text-ink-700">{review.reply.content}</p>
        </div>
      ) : null}
    </div>
  );
}
