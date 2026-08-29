'use client';

import { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, ImagePlus, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/get-error-message';
import { ALLOWED_IMAGE_ACCEPT, validateImageFile } from '@/lib/image-upload';
import { BusinessGalleryImage } from '@/features/business/types/business.type';
import { useUploadGalleryMutation } from '@/features/business/mutations/use-upload-gallery.mutation';
import { useDeleteGalleryImageMutation } from '@/features/business/mutations/use-delete-gallery-image.mutation';
import { useReorderGalleryMutation } from '@/features/business/mutations/use-reorder-gallery.mutation';

const MAX_FILES_PER_UPLOAD = 5;
const MAX_GALLERY_IMAGES = 20;

interface GalleryManagerProps {
  businessId: number;
  gallery: BusinessGalleryImage[];
  isOwner: boolean;
}

export function GalleryManager({ businessId, gallery, isOwner }: GalleryManagerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pendingImageId, setPendingImageId] = useState<number | null>(null);
  const uploadGalleryMutation = useUploadGalleryMutation(businessId);
  const deleteGalleryImageMutation = useDeleteGalleryImageMutation(businessId);
  const reorderGalleryMutation = useReorderGalleryMutation(businessId);

  if (!isOwner && gallery.length === 0) {
    return null;
  }

  const onFilesChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (files.length === 0) return;

    if (files.length > MAX_FILES_PER_UPLOAD) {
      toast.error(`You can upload up to ${MAX_FILES_PER_UPLOAD} images at a time.`);
      return;
    }
    if (gallery.length + files.length > MAX_GALLERY_IMAGES) {
      toast.error(`Gallery is limited to ${MAX_GALLERY_IMAGES} images.`);
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
      await uploadGalleryMutation.mutateAsync(files);
      toast.success(files.length > 1 ? 'Images added to gallery.' : 'Image added to gallery.');
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Unable to upload images. Please try again.'));
    }
  };

  const onDelete = async (imageId: number) => {
    setPendingImageId(imageId);
    try {
      await deleteGalleryImageMutation.mutateAsync(imageId);
      toast.success('Image removed.');
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Unable to remove image. Please try again.'));
    } finally {
      setPendingImageId(null);
    }
  };

  const onMove = async (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= gallery.length) return;

    const reordered = [...gallery];
    [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];

    try {
      await reorderGalleryMutation.mutateAsync(reordered.map((image) => image.imageId));
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Unable to reorder gallery. Please try again.'));
    }
  };

  const isBusy = uploadGalleryMutation.isPending || reorderGalleryMutation.isPending;

  return (
    <div className="rounded-3xl bg-ink-50 p-6 shadow-xs ring-1 ring-ink-200">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-sans text-lg font-bold text-ink-900">Gallery</h2>
        {isOwner ? (
          <>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={isBusy || gallery.length >= MAX_GALLERY_IMAGES}
              className="inline-flex items-center gap-1.5 rounded-xl border border-ink-200 bg-ink-50 px-3 py-2 text-sm font-medium text-ink-700 transition hover:bg-ink-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {uploadGalleryMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ImagePlus className="h-4 w-4" />
              )}
              Add photos
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

      {gallery.length === 0 ? (
        <p className="text-sm text-ink-700">No gallery photos yet.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {gallery.map((image, index) => (
            <div key={image.imageId} className="group relative aspect-square overflow-hidden rounded-xl bg-ink-100">
              {/* eslint-disable-next-line @next/next/no-img-element -- external Cloudinary URL, next/image remote patterns not configured */}
              <img src={image.url} alt="" className="h-full w-full object-cover" />

              {isOwner ? (
                <div className="absolute inset-0 flex flex-col justify-between bg-ink-900/0 p-1.5 opacity-0 transition group-hover:bg-ink-900/40 group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => onDelete(image.imageId)}
                    disabled={pendingImageId === image.imageId}
                    className="ml-auto flex h-7 w-7 items-center justify-center rounded-full bg-ink-50/90 text-red-600 shadow transition hover:bg-ink-50 disabled:cursor-not-allowed disabled:opacity-60"
                    aria-label="Remove image"
                  >
                    {pendingImageId === image.imageId ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </button>

                  <div className="flex w-full items-center justify-between">
                    <button
                      type="button"
                      onClick={() => onMove(index, -1)}
                      disabled={index === 0 || isBusy}
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-ink-50/90 text-ink-700 shadow transition hover:bg-ink-50 disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label="Move earlier"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onMove(index, 1)}
                      disabled={index === gallery.length - 1 || isBusy}
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-ink-50/90 text-ink-700 shadow transition hover:bg-ink-50 disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label="Move later"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
