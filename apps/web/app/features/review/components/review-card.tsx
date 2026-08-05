'use client';

import { useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { StarRating } from '@/features/review/components/star-rating';
import { ReplyForm } from '@/features/review/components/reply-form';
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
  isAuthor?: boolean;
  canReply?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onReplySubmit?: (input: ReplyInput) => void | Promise<void>;
  isReplying?: boolean;
}

export function ReviewCard({ review, isAuthor, canReply, onEdit, onDelete, onReplySubmit, isReplying }: ReviewCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showReplyForm, setShowReplyForm] = useState(false);

  const isLong = review.content.length > CONTENT_PREVIEW_LENGTH;
  const displayContent = isExpanded || !isLong ? review.content : `${review.content.slice(0, CONTENT_PREVIEW_LENGTH)}...`;

  return (
    <div className="rounded-2xl bg-white p-5 shadow-xs ring-1 ring-slate-200">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-serif text-sm font-bold text-ink-900">{review.author.name}</p>
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

      {isAuthor || canReply ? (
        <div className="mt-3 flex gap-3 border-t border-slate-100 pt-3">
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
        <div className="mt-3 rounded-xl bg-info-100 p-3">
          <Badge variant="info">Company Response</Badge>
          <p className="mt-2 text-sm text-ink-700">{review.reply.content}</p>
          <p className="mt-1 text-xs text-ink-500">{new Date(review.reply.createdAt).toLocaleDateString()}</p>
        </div>
      ) : null}
    </div>
  );
}
