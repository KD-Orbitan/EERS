'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { StarRating } from '@/features/review/components/star-rating';
import { CriteriaRatingInput } from '@/features/review/components/criteria-rating-input';
import { useBusinessCriteriaQuery } from '@/features/review/queries/use-business-criteria.query';
import { CreateReviewInput } from '@/features/review/schemas/create-review.schema';
import { UpdateReviewInput } from '@/features/review/schemas/update-review.schema';

interface WriteReviewFormInitialValues {
  overallRating: number;
  content: string;
  criteriaRatings: { criterionId: number; ratingValue: number }[];
}

interface WriteReviewFormProps {
  businessId: number;
  categoryIds: number[];
  initialValues?: WriteReviewFormInitialValues;
  onSubmit: (data: CreateReviewInput | UpdateReviewInput) => void | Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

const CONTENT_MAX_LENGTH = 2000;

export function WriteReviewForm({ businessId, categoryIds, initialValues, onSubmit, onCancel, isLoading }: WriteReviewFormProps) {
  const { data: criteria, isLoading: isLoadingCriteria } = useBusinessCriteriaQuery(categoryIds);

  const [overallRating, setOverallRating] = useState(initialValues?.overallRating ?? 0);
  const [content, setContent] = useState(initialValues?.content ?? '');
  const [criteriaRatings, setCriteriaRatings] = useState<Record<number, number>>(() =>
    Object.fromEntries((initialValues?.criteriaRatings ?? []).map((rating) => [rating.criterionId, rating.ratingValue])),
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError(null);

    if (overallRating < 1) {
      setFormError('Please select an overall rating.');
      return;
    }
    if (content.trim().length < 10) {
      setFormError('Please write at least 10 characters.');
      return;
    }
    const unratedCriterion = (criteria ?? []).find((criterion) => !criteriaRatings[criterion.criterionId]);
    if (unratedCriterion) {
      setFormError(`Please rate "${unratedCriterion.name}".`);
      return;
    }

    const payload: CreateReviewInput = {
      businessId,
      overallRating,
      content: content.trim(),
      criteriaRatings: (criteria ?? []).map((criterion) => ({
        criterionId: criterion.criterionId,
        ratingValue: criteriaRatings[criterion.criterionId],
      })),
    };

    setIsSubmitting(true);
    try {
      await onSubmit(payload);
    } finally {
      setIsSubmitting(false);
    }
  };

  const busy = isSubmitting || isLoading;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow-xs ring-1 ring-slate-200">
        <p className="mb-2 text-sm font-medium text-ink-700">Overall rating</p>
        <StarRating value={overallRating} onChange={setOverallRating} size="lg" />
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-xs ring-1 ring-slate-200">
        <p className="mb-1 text-sm font-medium text-ink-700">Criteria ratings</p>
        {isLoadingCriteria ? (
          <p className="text-sm text-ink-500">Loading criteria...</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {(criteria ?? []).map((criterion) => (
              <CriteriaRatingInput
                key={criterion.criterionId}
                criterionName={criterion.name}
                value={criteriaRatings[criterion.criterionId] ?? 0}
                onChange={(value) => setCriteriaRatings((prev) => ({ ...prev, [criterion.criterionId]: value }))}
              />
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-xs ring-1 ring-slate-200">
        <div className="mb-1 flex items-center justify-between">
          <label className="text-sm font-medium text-ink-700" htmlFor="content">
            Your review
          </label>
          <span className="text-xs text-ink-500">
            {content.length}/{CONTENT_MAX_LENGTH}
          </span>
        </div>
        <textarea
          id="content"
          rows={5}
          maxLength={CONTENT_MAX_LENGTH}
          value={content}
          onChange={(event) => setContent(event.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-primary-50 px-3 py-2 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
        />
      </div>

      {formError ? <p className="text-sm text-red-600">{formError}</p> : null}

      <div className="flex justify-end gap-3">
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
        ) : null}
        <Button type="submit" disabled={busy}>
          {busy ? 'Saving...' : initialValues ? 'Save changes' : 'Post Review'}
        </Button>
      </div>
    </form>
  );
}
