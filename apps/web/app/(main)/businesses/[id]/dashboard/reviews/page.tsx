'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Star, Users } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { getErrorMessage } from '@/lib/get-error-message';
import { OwnerDashboardSidebar } from '@/features/business/components/owner-dashboard-sidebar';
import { useBusinessDetailQuery } from '@/features/business/queries/use-business-detail.query';
import { useReviewStatisticsQuery } from '@/features/review/queries/use-review-statistics.query';
import { useBusinessReviewsQuery } from '@/features/review/queries/use-business-reviews.query';
import { useCreateReplyMutation } from '@/features/review/mutations/use-create-reply.mutation';
import { ReviewList } from '@/features/review/components/review-list';
import { ReviewDistributionCard } from '@/features/review/components/review-distribution-card';
import { SentimentSummaryCard } from '@/features/review/components/sentiment-summary-card';
import { ReplyInput } from '@/features/review/schemas/reply.schema';
import { useCreateReportMutation } from '@/features/report/mutations/use-create-report.mutation';
import { ReportReviewModal } from '@/features/report/components/report-review-modal';
import { CreateReportInput } from '@/features/report/schemas/create-report.schema';

const RATING_OPTIONS = [5, 4, 3, 2, 1];

export default function BusinessDashboardReviewsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const businessId = Number(id);
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();

  const [page, setPage] = useState(1);
  const [ratingFilter, setRatingFilter] = useState(0);
  const [needsReplyOnly, setNeedsReplyOnly] = useState(false);
  const [reportingReviewId, setReportingReviewId] = useState<number | null>(null);

  const { data: business, isLoading, isError } = useBusinessDetailQuery(businessId);
  const { data: stats } = useReviewStatisticsQuery(businessId);
  const { data, isLoading: isReviewsLoading } = useBusinessReviewsQuery(businessId, {
    page,
    rating: ratingFilter || undefined,
  });
  const createReplyMutation = useCreateReplyMutation(businessId);
  const createReportMutation = useCreateReportMutation();

  const isOwner = Boolean(business && user && (business.owner?.userId === user.userId || user.role === 'ADMIN'));

  useEffect(() => {
    if (!isAuthLoading && !isLoading && business && !isOwner) {
      router.replace(`/businesses/${businessId}`);
    }
  }, [isAuthLoading, isLoading, business, isOwner, router, businessId]);

  const onRatingFilterChange = (value: number) => {
    setRatingFilter(value);
    setPage(1);
  };

  const onNeedsReplyToggle = () => {
    setNeedsReplyOnly((prev) => !prev);
    setPage(1);
  };

  const onReply = async (reviewId: number, input: ReplyInput) => {
    try {
      await createReplyMutation.mutateAsync({ reviewId, input });
      toast.success('Reply posted.');
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Unable to post reply. Please try again.'));
    }
  };

  const onReportSubmit = async (input: CreateReportInput) => {
    if (reportingReviewId === null) return;
    try {
      await createReportMutation.mutateAsync({ reviewId: reportingReviewId, ...input });
      toast.success('Report submitted. Our team will look into it.');
      setReportingReviewId(null);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Unable to submit report. Please try again.'));
    }
  };

  if (isLoading || isAuthLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-ink-50">
        <p className="text-sm text-ink-600">Loading...</p>
      </main>
    );
  }

  if (isError || !business || !isOwner) {
    return null;
  }

  const reviews = data?.items ?? [];
  const visibleReviews = needsReplyOnly ? reviews.filter((review) => !review.reply) : reviews;

  return (
    <div className="flex min-h-screen bg-ink-50">
      <OwnerDashboardSidebar businessId={businessId} currentPath={`/businesses/${businessId}/dashboard/reviews`} />

      <div className="flex-1 px-6 py-8 sm:px-10">
        <div className="mx-auto max-w-7xl space-y-6">
          <div>
            <h1 className="font-sans text-3xl font-bold text-ink-900">Reviews & Replies</h1>
            <p className="mt-1 text-sm text-ink-700">Manage feedback for {business.name}</p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-3xl border border-ink-200 bg-primary-50 p-6">
              <p className="text-xs uppercase tracking-wide text-ink-700">Average Rating</p>
              <div className="mt-1 flex items-center gap-2">
                <span className="font-sans text-4xl font-bold text-primary-600">{(stats?.avgRating ?? 0).toFixed(1)}</span>
                <Star className="h-6 w-6 fill-amber-400 text-amber-400" />
              </div>
            </div>
            <div className="rounded-3xl border border-ink-200 bg-primary-50 p-6">
              <p className="text-xs uppercase tracking-wide text-ink-700">Total Reviews</p>
              <div className="mt-1 flex items-center gap-2">
                <span className="font-sans text-4xl font-bold text-ink-900">{stats?.reviewCount ?? 0}</span>
                <Users className="h-6 w-6 text-ink-500" />
              </div>
            </div>
            <div className="sm:col-span-2 lg:col-span-2">
              <div className="grid h-full grid-cols-2 gap-4">
                <ReviewDistributionCard businessId={businessId} />
                <SentimentSummaryCard businessId={businessId} />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 rounded-2xl bg-ink-50 p-4 shadow-xs ring-1 ring-ink-200">
            <label className="flex items-center gap-2 text-sm font-medium text-ink-700">
              Rating
              <select
                value={ratingFilter}
                onChange={(event) => onRatingFilterChange(Number(event.target.value))}
                className="rounded-lg border border-ink-300 px-2 py-1.5 text-sm text-ink-900"
              >
                <option value={0}>All</option>
                {RATING_OPTIONS.map((rating) => (
                  <option key={rating} value={rating}>
                    {rating} star{rating > 1 ? 's' : ''}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex items-center gap-2 text-sm font-medium text-ink-700">
              <input type="checkbox" checked={needsReplyOnly} onChange={onNeedsReplyToggle} className="h-4 w-4 rounded border-ink-300" />
              Needs reply only
            </label>
          </div>

          <ReviewList
            reviews={visibleReviews}
            isLoading={isReviewsLoading}
            pagination={data?.meta}
            onPageChange={setPage}
            businessId={businessId}
            currentUserId={user?.userId}
            isBusinessOwner={isOwner}
            onReply={onReply}
            onReport={setReportingReviewId}
          />
        </div>
      </div>

      <ReportReviewModal
        isOpen={reportingReviewId !== null}
        onClose={() => setReportingReviewId(null)}
        onSubmit={onReportSubmit}
        isLoading={createReportMutation.isPending}
      />
    </div>
  );
}
