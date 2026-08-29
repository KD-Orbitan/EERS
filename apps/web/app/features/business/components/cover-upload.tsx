'use client';

import { useRef, useState } from 'react';
import { Camera, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/get-error-message';
import { ALLOWED_IMAGE_ACCEPT, validateImageFile } from '@/lib/image-upload';
import { useUploadCoverMutation } from '@/features/business/mutations/use-upload-cover.mutation';
import { useDeleteCoverMutation } from '@/features/business/mutations/use-delete-cover.mutation';

interface CoverUploadProps {
  businessId: number;
  coverUrl: string | null;
  isOwner: boolean;
}

// Renders the hero's background layer (image or gradient fallback) plus the
// owner-only upload/remove controls. Meant to sit as the first, absolutely
// positioned child of a `relative` hero container.
export function CoverUpload({ businessId, coverUrl, isOwner }: CoverUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const uploadCoverMutation = useUploadCoverMutation(businessId);
  const deleteCoverMutation = useDeleteCoverMutation(businessId);

  const onFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const validationError = validateImageFile(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    try {
      await uploadCoverMutation.mutateAsync(file);
      toast.success('Cover photo updated.');
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Unable to upload cover photo. Please try again.'));
    } finally {
      URL.revokeObjectURL(objectUrl);
      setPreview(null);
    }
  };

  const onRemove = async () => {
    if (!window.confirm('Remove the cover photo?')) return;

    try {
      await deleteCoverMutation.mutateAsync();
      toast.success('Cover photo removed.');
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Unable to remove cover photo. Please try again.'));
    }
  };

  const displayUrl = preview ?? coverUrl;
  const isBusy = uploadCoverMutation.isPending || deleteCoverMutation.isPending;

  return (
    <div className="absolute inset-0 z-0">
      {displayUrl ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element -- external Cloudinary URL, next/image remote patterns not configured */}
          <img src={displayUrl} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-linear-to-br from-primary-900/70 to-primary-700/50" />
        </>
      ) : (
        <div className="h-full w-full bg-linear-to-br from-primary-600 to-primary-500" />
      )}

      {isOwner ? (
        <div className="absolute bottom-4 right-4 z-10 flex gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={isBusy}
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-ink-50/10 px-3 py-2 text-xs font-bold text-white backdrop-blur-sm transition hover:bg-ink-50/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {uploadCoverMutation.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Camera className="h-3.5 w-3.5" />
            )}
            {coverUrl ? 'Change cover' : 'Add cover'}
          </button>
          {coverUrl ? (
            <button
              type="button"
              onClick={onRemove}
              disabled={isBusy}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-ink-50/10 px-3 py-2 text-xs font-bold text-white backdrop-blur-sm transition hover:bg-red-600/80 disabled:cursor-not-allowed disabled:opacity-60"
              aria-label="Remove cover photo"
            >
              {deleteCoverMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
            </button>
          ) : null}
          <input ref={inputRef} type="file" accept={ALLOWED_IMAGE_ACCEPT} className="hidden" onChange={onFileChange} />
        </div>
      ) : null}
    </div>
  );
}
