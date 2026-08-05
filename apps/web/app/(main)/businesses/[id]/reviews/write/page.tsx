'use client';

import { use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/get-error-message';
import { useBusinessDetailQuery } from '@/features/business/queries/use-business-detail.query';
import { useReviewDetailQuery } from '@/features/review/queries/use-review-detail.query';
import { useCreateReviewMutation } from '@/features/review/mutations/use-create-review.mutation';
import { useUpdateReviewMutation } from '@/features/review/mutations/use-update-review.mutation';
import { WriteReviewForm } from '@/features/review/components/write-review-form';
import { CreateReviewInput } from '@/features/review/schemas/create-review.schema';
import { UpdateReviewInput } from '@/features/review/schemas/update-review.schema';

export default function WriteReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const businessId = Number(id);
  const router = useRouter();
  const searchParams = useSearchParams();
  const editReviewId = searchParams.get('reviewId') ? Number(searchParams.get('reviewId')) : undefined;

  const { data: business, isLoading: isLoadingBusiness } = useBusinessDetailQuery(businessId);
  const { data: existingReview, isLoading: isLoadingReview } = useReviewDetailQuery(editReviewId);
  const createReviewMutation = useCreateReviewMutation(businessId);
  const updateReviewMutation = useUpdateReviewMutation(editReviewId ?? 0, businessId);

  const isEditMode = typeof editReviewId === 'number';

  const onSubmit = async (data: CreateReviewInput | UpdateReviewInput) => {
    try {
      if (isEditMode) {
        const { overallRating, content, criteriaRatings } = data as CreateReviewInput;
        await updateReviewMutation.mutateAsync({ overallRating, content, criteriaRatings });
        toast.success('Review updated and resubmitted for review.');
      } else {
        await createReviewMutation.mutateAsync(data as CreateReviewInput);
        toast.success('Review submitted for review.');
      }
      router.push(`/businesses/${businessId}/reviews`);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Unable to submit review. Please try again.'));
    }
  };

  if (isLoadingBusiness || (isEditMode && isLoadingReview)) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm text-ink-700">Loading...</p>
      </main>
    );
  }

  if (!business) {
    return null;
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-6 font-serif text-3xl font-bold text-ink-900">
          {isEditMode ? 'Edit your review' : `Write a review for ${business.name}`}
        </h1>
        <WriteReviewForm
          businessId={businessId}
          categoryIds={business.categories.map((category) => category.categoryId)}
          initialValues={existingReview ? { overallRating: existingReview.overallRating, content: existingReview.content, criteriaRatings: existingReview.criteriaRatings } : undefined}
          onSubmit={onSubmit}
          isLoading={createReviewMutation.isPending || updateReviewMutation.isPending}
          onCancel={() => router.push(`/businesses/${businessId}/reviews`)}
        />
      </div>
    </main>
  );
}
