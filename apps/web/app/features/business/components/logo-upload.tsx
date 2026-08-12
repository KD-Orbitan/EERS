'use client';

import { useRef, useState } from 'react';
import { Building2, Camera, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/get-error-message';
import { ALLOWED_IMAGE_ACCEPT, validateImageFile } from '@/lib/image-upload';
import { useUploadLogoMutation } from '@/features/business/mutations/use-upload-logo.mutation';
import { useDeleteLogoMutation } from '@/features/business/mutations/use-delete-logo.mutation';

interface LogoUploadProps {
  businessId: number;
  logoUrl: string | null;
  isOwner: boolean;
}

// Small square brand mark (distinct from the wide CoverUpload banner) —
// mirrors AvatarUpload's badge layout, plus a remove control since (unlike
// user avatars) business logos have a documented DELETE endpoint.
export function LogoUpload({ businessId, logoUrl, isOwner }: LogoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const uploadLogoMutation = useUploadLogoMutation(businessId);
  const deleteLogoMutation = useDeleteLogoMutation(businessId);

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
      await uploadLogoMutation.mutateAsync(file);
      toast.success('Logo updated.');
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Unable to upload logo. Please try again.'));
    } finally {
      URL.revokeObjectURL(objectUrl);
      setPreview(null);
    }
  };

  const onRemove = async () => {
    if (!window.confirm('Remove the logo?')) return;

    try {
      await deleteLogoMutation.mutateAsync();
      toast.success('Logo removed.');
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Unable to remove logo. Please try again.'));
    }
  };

  const displayUrl = preview ?? logoUrl;
  const isBusy = uploadLogoMutation.isPending || deleteLogoMutation.isPending;

  return (
    <div className="relative h-16 w-16 shrink-0">
      <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-white/90 shadow-lg">
        {displayUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- external Cloudinary URL, next/image remote patterns not configured
          <img src={displayUrl} alt="Logo" className="h-full w-full object-cover" />
        ) : (
          <Building2 className="h-8 w-8 text-primary-600" />
        )}
      </div>

      {isOwner ? (
        <>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={isBusy}
            className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary-600 text-white shadow-md ring-2 ring-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
            aria-label={logoUrl ? 'Change logo' : 'Add logo'}
          >
            {uploadLogoMutation.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Camera className="h-3.5 w-3.5" />
            )}
          </button>
          {logoUrl ? (
            <button
              type="button"
              onClick={onRemove}
              disabled={isBusy}
              className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-white text-red-600 shadow-md ring-2 ring-white transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
              aria-label="Remove logo"
            >
              {deleteLogoMutation.isPending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Trash2 className="h-3 w-3" />
              )}
            </button>
          ) : null}
          <input ref={inputRef} type="file" accept={ALLOWED_IMAGE_ACCEPT} className="hidden" onChange={onFileChange} />
        </>
      ) : null}
    </div>
  );
}
