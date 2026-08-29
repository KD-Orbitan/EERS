'use client';

import { useRef, useState } from 'react';
import { ImagePlus, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/get-error-message';
import { ALLOWED_IMAGE_ACCEPT, validateImageFile } from '@/lib/image-upload';
import { ReviewPhoto } from '@/features/review/types/review.type';
import { useUploadReviewPhotosMutation } from '@/features/review/mutations/use-upload-review-photos.mutation';
import { useDeleteReviewPhotoMutation } from '@/features/review/mutations/use-delete-review-photo.mutation';

const MAX_REVIEW_PHOTOS = 5;

interface ReviewPhotoUploadProps {
  reviewId: number;
  businessId?: number;
  photos: ReviewPhoto[];
  isAuthor: boolean;
}

export function ReviewPhotoUpload({ reviewId, businessId, photos, isAuthor }: ReviewPhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pendingImageId, setPendingImageId] = useState<number | null>(null);
  const uploadPhotosMutation = useUploadReviewPhotosMutation(reviewId, businessId);
  const deletePhotoMutation = useDeleteReviewPhotoMutation(reviewId, businessId);

  if (!isAuthor && photos.length === 0) {
    return null;
  }

  const onFilesChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (files.length === 0) return;

    if (photos.length + files.length > MAX_REVIEW_PHOTOS) {
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

    try {
      await uploadPhotosMutation.mutateAsync(files);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Unable to upload photos. Please try again.'));
    }
  };

  const onDelete = async (imageId: number) => {
    setPendingImageId(imageId);
    try {
      await deletePhotoMutation.mutateAsync(imageId);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Unable to remove photo. Please try again.'));
    } finally {
      setPendingImageId(null);
    }
  };

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      {photos.map((photo) => (
        <div key={photo.imageId} className="group relative h-16 w-16 overflow-hidden rounded-lg bg-ink-100">
          <a href={photo.url} target="_blank" rel="noreferrer">
            {/* eslint-disable-next-line @next/next/no-img-element -- external Cloudinary URL, next/image remote patterns not configured */}
            <img src={photo.url} alt="Review photo" className="h-full w-full object-cover" />
          </a>
          {isAuthor ? (
            <button
              type="button"
              onClick={() => onDelete(photo.imageId)}
              disabled={pendingImageId === photo.imageId}
              className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-ink-900/70 text-white opacity-0 transition group-hover:opacity-100 disabled:cursor-not-allowed"
              aria-label="Remove photo"
            >
              {pendingImageId === photo.imageId ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
            </button>
          ) : null}
        </div>
      ))}

      {isAuthor && photos.length < MAX_REVIEW_PHOTOS ? (
        <>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploadPhotosMutation.isPending}
            className="flex h-16 w-16 items-center justify-center rounded-lg border border-dashed border-ink-300 text-ink-500 transition hover:border-primary-400 hover:text-primary-600 disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="Add photos"
          >
            {uploadPhotosMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept={ALLOWED_IMAGE_ACCEPT}
            multiple
            className="hidden"
            onChange={onFilesChange}
          />
        </>
      ) : null}
    </div>
  );
}
