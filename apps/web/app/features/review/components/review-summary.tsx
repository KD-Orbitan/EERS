'use client';

import Link from 'next/link';
import { Star } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';
import { getErrorMessage } from '@/lib/get-error-message';
import { useReviewStatisticsQuery } from '@/features/review/queries/use-review-statistics.query';
import { useBusinessReviewsQuery } from '@/features/review/queries/use-business-reviews.query';
import { useCreateReplyMutation } from '@/features/review/mutations/use-create-reply.mutation';
import { ReviewList } from '@/features/review/components/review-list';
import { ReplyInput } from '@/features/review/schemas/reply.schema';

interface ReviewSummaryProps {
  businessId: number;
  isOwner: boolean;
}

// Embedded on the business detail page (PLAYBOOK-WEB.md Phase 3, "embed in
// business detail"): stats + latest reviews + links to the full list / write page.
export function ReviewSummary({ businessId, isOwner }: ReviewSummaryProps) {
  const { user, isAuthenticated } = useAuth();
  const { data: stats } = useReviewStatisticsQuery(businessId);
  const { data, isLoading } = useBusinessReviewsQuery(businessId, { limit: 3 });
  const createReplyMutation = useCreateReplyMutation(businessId);

  const onReply = async (reviewId: number, input: ReplyInput) => {
    try {
      await createReplyMutation.mutateAsync({ reviewId, input });
      toast.success('Reply posted.');
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Unable to post reply. Please try again.'));
    }
  };

  return (
    <div className="rounded-2xl bg-white p-6 shadow-xs ring-1 ring-slate-200">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-serif text-lg font-bold text-ink-900">Reviews</h2>
          {stats ? (
            <div className="mt-1 flex items-center gap-1.5 text-sm text-ink-700">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span className="font-bold text-ink-900">{stats.avgRating.toFixed(1)}</span>
              <span>({stats.reviewCount} reviews)</span>
            </div>
          ) : null}
        </div>

        {isAuthenticated && !isOwner ? (
          <Link
            href={`/businesses/${businessId}/reviews/write`}
            className="text-sm font-bold text-primary-600 hover:text-primary-700"
          >
            Write a Review
          </Link>
        ) : null}
      </div>

      <ReviewList
        reviews={data?.items ?? []}
        isLoading={isLoading}
        currentUserId={user?.userId}
        isBusinessOwner={isOwner}
        onReply={onReply}
      />

      {stats && stats.reviewCount > 3 ? (
        <Link
          href={`/businesses/${businessId}/reviews`}
          className="mt-4 inline-block text-sm font-medium text-primary-600 hover:text-primary-700"
        >
          View all reviews
        </Link>
      ) : null}
    </div>
  );
}
