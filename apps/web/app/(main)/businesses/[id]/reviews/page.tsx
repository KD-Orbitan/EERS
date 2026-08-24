'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Star } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { getErrorMessage } from '@/lib/get-error-message';
import { useBusinessDetailQuery } from '@/features/business/queries/use-business-detail.query';
import { useReviewStatisticsQuery } from '@/features/review/queries/use-review-statistics.query';
import { useBusinessReviewsQuery } from '@/features/review/queries/use-business-reviews.query';
import { useDeleteReviewMutation } from '@/features/review/mutations/use-delete-review.mutation';
import { useCreateReplyMutation } from '@/features/review/mutations/use-create-reply.mutation';
import { ReviewList } from '@/features/review/components/review-list';
import { ReplyInput } from '@/features/review/schemas/reply.schema';
import { useCreateReportMutation } from '@/features/report/mutations/use-create-report.mutation';
import { ReportReviewModal } from '@/features/report/components/report-review-modal';
import { CreateReportInput } from '@/features/report/schemas/create-report.schema';

export default function BusinessReviewsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const businessId = Number(id);
  const router = useRouter();
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [reportingReviewId, setReportingReviewId] = useState<number | null>(null);

  const { data: business } = useBusinessDetailQuery(businessId);
  const { data: stats } = useReviewStatisticsQuery(businessId);
  const { data, isLoading } = useBusinessReviewsQuery(businessId, { page });
  const deleteReviewMutation = useDeleteReviewMutation();
  const createReplyMutation = useCreateReplyMutation(businessId);
  const createReportMutation = useCreateReportMutation();

  const isOwner = Boolean(business && user && (user.userId === business.owner.userId || user.role === 'ADMIN'));

  const onEdit = (reviewId: number) => {
    router.push(`/businesses/${businessId}/reviews/write?reviewId=${reviewId}`);
  };

  const onDelete = async (reviewId: number) => {
    if (!window.confirm('Delete this review? This cannot be undone.')) return;

    try {
      await deleteReviewMutation.mutateAsync({ reviewId, businessId });
      toast.success('Review deleted.');
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Unable to delete review. Please try again.'));
    }
  };

  const onReply = async (reviewId: number, input: ReplyInput) => {
    try {
      await createReplyMutation.mutateAsync({ reviewId, input });
      toast.success('Reply posted.');
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Unable to post reply. Please try again.'));
    }
  };

  const onReportSubmit = async (data: CreateReportInput) => {
    if (reportingReviewId === null) return;
    try {
      await createReportMutation.mutateAsync({ reviewId: reportingReviewId, ...data });
      toast.success('Report submitted. Our team will look into it.');
      setReportingReviewId(null);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Unable to submit report. Please try again.'));
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <Link href={`/businesses/${businessId}`} className="text-sm font-medium text-primary-600 hover:text-primary-700">
          &larr; Back to {business?.name ?? 'business'}
        </Link>

        <div className="mt-3 mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-sans text-3xl font-bold text-ink-900">Reviews</h1>
            {stats ? (
              <div className="mt-1 flex items-center gap-1.5 text-sm text-ink-700">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <span className="font-bold text-ink-900">{stats.avgRating.toFixed(1)}</span>
                <span>({stats.reviewCount} reviews)</span>
              </div>
            ) : null}
          </div>
          {user && !isOwner ? (
            <Link href={`/businesses/${businessId}/reviews/write`} className="text-sm font-bold text-primary-600 hover:text-primary-700">
              Write a Review
            </Link>
          ) : null}
        </div>

        <ReviewList
          reviews={data?.items ?? []}
          isLoading={isLoading}
          pagination={data?.meta}
          onPageChange={setPage}
          businessId={businessId}
          currentUserId={user?.userId}
          isBusinessOwner={isOwner}
          onEdit={onEdit}
          onDelete={onDelete}
          onReply={onReply}
          onReport={setReportingReviewId}
        />
      </div>

      <ReportReviewModal
        isOpen={reportingReviewId !== null}
        onClose={() => setReportingReviewId(null)}
        onSubmit={onReportSubmit}
        isLoading={createReportMutation.isPending}
      />
    </main>
  );
}
