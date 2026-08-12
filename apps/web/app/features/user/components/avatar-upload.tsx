'use client';

import { useRef, useState } from 'react';
import { Camera, Loader2, UserCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/get-error-message';
import { ALLOWED_IMAGE_ACCEPT, validateImageFile } from '@/lib/image-upload';
import { useUploadAvatarMutation } from '@/features/user/mutations/use-upload-avatar.mutation';

interface AvatarUploadProps {
  avatarUrl: string | null;
  size?: 'md' | 'lg';
}

const sizeClass: Record<NonNullable<AvatarUploadProps['size']>, string> = {
  md: 'h-20 w-20',
  lg: 'h-32 w-32',
};

const iconSizeClass: Record<NonNullable<AvatarUploadProps['size']>, string> = {
  md: 'h-11 w-11',
  lg: 'h-16 w-16',
};

const buttonSizeClass: Record<NonNullable<AvatarUploadProps['size']>, string> = {
  md: 'h-7 w-7',
  lg: 'h-9 w-9',
};

export function AvatarUpload({ avatarUrl, size = 'md' }: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const uploadAvatarMutation = useUploadAvatarMutation();

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
      await uploadAvatarMutation.mutateAsync(file);
      toast.success('Avatar updated.');
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Unable to upload avatar. Please try again.'));
    } finally {
      URL.revokeObjectURL(objectUrl);
      setPreview(null);
    }
  };

  const displayUrl = preview ?? avatarUrl;
  const isUploading = uploadAvatarMutation.isPending;

  return (
    <div className={`relative shrink-0 ${sizeClass[size]}`}>
      <div className={`flex items-center justify-center overflow-hidden rounded-full bg-primary-100 ${sizeClass[size]}`}>
        {displayUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- external Cloudinary URL, next/image remote patterns not configured
          <img src={displayUrl} alt="Avatar" className="h-full w-full object-cover" />
        ) : (
          <UserCircle2 className={`text-primary-600 ${iconSizeClass[size]}`} />
        )}
      </div>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isUploading}
        className={`absolute -bottom-1 -right-1 flex items-center justify-center rounded-full bg-primary-600 text-white shadow-md ring-2 ring-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60 ${buttonSizeClass[size]}`}
        aria-label="Change avatar"
      >
        {isUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_IMAGE_ACCEPT}
        className="hidden"
        onChange={onFileChange}
      />
    </div>
  );
}
