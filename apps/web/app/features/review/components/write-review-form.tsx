'use client';

import { useRef, useState } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { StarRating } from '@/features/review/components/star-rating';
import { CriteriaRatingInput } from '@/features/review/components/criteria-rating-input';
import { useBusinessCriteriaQuery } from '@/features/review/queries/use-business-criteria.query';
import { CreateReviewInput } from '@/features/review/schemas/create-review.schema';
import { UpdateReviewInput } from '@/features/review/schemas/update-review.schema';
import { ALLOWED_IMAGE_ACCEPT, validateImageFile } from '@/lib/image-upload';

interface WriteReviewFormInitialValues {
  overallRating: number;
  content: string;
  criteriaRatings: { criterionId: number; ratingValue: number }[];
}

interface WriteReviewFormProps {
  businessId: number;
  categoryIds: number[];
  initialValues?: WriteReviewFormInitialValues;
  onSubmit: (data: CreateReviewInput | UpdateReviewInput, photos?: File[]) => void | Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

const CONTENT_MAX_LENGTH = 2000;
const MAX_REVIEW_PHOTOS = 5;

interface PhotoDraft {
  file: File;
  previewUrl: string;
}

export function WriteReviewForm({ businessId, categoryIds, initialValues, onSubmit, onCancel, isLoading }: WriteReviewFormProps) {
  const { data: criteria, isLoading: isLoadingCriteria } = useBusinessCriteriaQuery(categoryIds);
  const isEditMode = Boolean(initialValues);

  const [overallRating, setOverallRating] = useState(initialValues?.overallRating ?? 0);
  const [content, setContent] = useState(initialValues?.content ?? '');
  const [criteriaRatings, setCriteriaRatings] = useState<Record<number, number>>(() =>
    Object.fromEntries((initialValues?.criteriaRatings ?? []).map((rating) => [rating.criterionId, rating.ratingValue])),
  );
  const [photoDrafts, setPhotoDrafts] = useState<PhotoDraft[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const onPhotosSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (files.length === 0) return;

    if (photoDrafts.length + files.length > MAX_REVIEW_PHOTOS) {
      toast.error(`You can attach up to ${MAX_REVIEW_PHOTOS} photos per review.`);
      return;
    }
    for (const file of files) {
      const validationError = validateImageFile(file);
      if (validationError) {
        toast.error(validationError);
        return;
      }
    }

    setPhotoDrafts((prev) => [...prev, ...files.map((file) => ({ file, previewUrl: URL.createObjectURL(file) }))]);
  };

  const removePhotoDraft = (previewUrl: string) => {
    setPhotoDrafts((prev) => {
      const target = prev.find((draft) => draft.previewUrl === previewUrl);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((draft) => draft.previewUrl !== previewUrl);
    });
  };

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
      await onSubmit(payload, photoDrafts.map((draft) => draft.file));
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

      {!isEditMode ? (
        <div className="rounded-2xl bg-white p-6 shadow-xs ring-1 ring-slate-200">
          <p className="mb-2 text-sm font-medium text-ink-700">Photos (optional)</p>
          <div className="flex flex-wrap items-center gap-2">
            {photoDrafts.map((draft) => (
              <div key={draft.previewUrl} className="group relative h-16 w-16 overflow-hidden rounded-lg bg-slate-100">
                {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview, not a remote/optimizable image */}
                <img src={draft.previewUrl} alt="Selected review photo" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removePhotoDraft(draft.previewUrl)}
                  className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-slate-900/70 text-white opacity-0 transition group-hover:opacity-100"
                  aria-label="Remove selected photo"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}

            {photoDrafts.length < MAX_REVIEW_PHOTOS ? (
              <>
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  className="flex h-16 w-16 items-center justify-center rounded-lg border border-dashed border-slate-300 text-ink-500 transition hover:border-primary-400 hover:text-primary-600"
                  aria-label="Add photos"
                >
                  <ImagePlus className="h-4 w-4" />
                </button>
                <input
                  ref={photoInputRef}
                  type="file"
                  accept={ALLOWED_IMAGE_ACCEPT}
                  multiple
                  className="hidden"
                  onChange={onPhotosSelected}
                />
              </>
            ) : null}
          </div>
          <p className="mt-2 text-xs text-ink-500">Up to {MAX_REVIEW_PHOTOS} photos, JPG/PNG/WEBP, 10MB each.</p>
        </div>
      ) : null}

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
