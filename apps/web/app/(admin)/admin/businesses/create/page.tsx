'use client';

import { type ListingPhotos, emptyListingPhotos } from '@/features/business/components/listing-photo-picker';
import { uploadListingPhotos, hasListingPhotos } from '@/features/business/mutations/upload-listing-photos';
import { useState } from 'react';
import { BusinessPhotosStep } from '@/features/business/components/business-photos-step';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/get-error-message';
import { CreateBusinessForm } from '@/features/business/components/create-business-form';
import { useAdminCreateBusinessMutation } from '@/features/admin/mutations/use-admin-create-business.mutation';
import { CreateBusinessInput } from '@/features/business/schemas/create-business.schema';

export default function AdminCreateBusinessPage() {
  const router = useRouter();
  const [failedPhotos, setFailedPhotos] = useState<ListingPhotos>(emptyListingPhotos);
  const [saving, setSaving] = useState(false);
  const [createdBusinessId, setCreatedBusinessId] = useState<number>();
  const adminCreateBusinessMutation = useAdminCreateBusinessMutation();

  const onSubmit = async (data: CreateBusinessInput, photos: ListingPhotos) => {
    setSaving(true);
    try {
      const business = await adminCreateBusinessMutation.mutateAsync(data);
      const failed = await uploadListingPhotos(business.businessId, photos);
      setFailedPhotos(failed);
      setCreatedBusinessId(business.businessId);
      if (hasListingPhotos(failed)) toast.error('Business saved, but some photos could not be uploaded. Retry them below.');
      else toast.success('Business created and approved.');

    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Unable to create business. Please try again.'));
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-sans text-3xl font-bold text-ink-900">Add business</h1>
        <p className="mt-1 text-sm text-ink-700">
          Creates an auto-approved, unclaimed business. Its real owner can later submit a claim to take it over.
        </p>
      </div>
      {createdBusinessId ? <BusinessPhotosStep initialFailedPhotos={failedPhotos} businessId={createdBusinessId} onDone={() => router.push('/admin/businesses')} /> : <CreateBusinessForm
        mode="admin-create"
        onSubmit={onSubmit}
        isLoading={saving || adminCreateBusinessMutation.isPending}
        onCancel={() => router.push('/admin/businesses')}
      />}
    </div>
  );
}
