'use client';

import { type ListingPhotos, emptyListingPhotos } from '@/features/business/components/listing-photo-picker';
import { uploadListingPhotos, hasListingPhotos } from '@/features/business/mutations/upload-listing-photos';
import { useState } from 'react';
import { BusinessPhotosStep } from '@/features/business/components/business-photos-step';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/get-error-message';
import { CreateBusinessForm } from '@/features/business/components/create-business-form';
import { useCreateBusinessMutation } from '@/features/business/mutations/use-create-business.mutation';
import { CreateBusinessInput } from '@/features/business/schemas/create-business.schema';

export default function CreateBusinessPage() {
  const router = useRouter();
  const [failedPhotos, setFailedPhotos] = useState<ListingPhotos>(emptyListingPhotos);
  const [saving, setSaving] = useState(false);
  const [createdBusinessId, setCreatedBusinessId] = useState<number>();
  const createBusinessMutation = useCreateBusinessMutation();

  const onSubmit = async (data: CreateBusinessInput, photos: ListingPhotos) => {
    setSaving(true);
    try {
      const business = await createBusinessMutation.mutateAsync(data);
      const failed = await uploadListingPhotos(business.businessId, photos);
      setFailedPhotos(failed);
      setCreatedBusinessId(business.businessId);
      if (hasListingPhotos(failed)) toast.error('Business saved, but some photos could not be uploaded. Retry them below.');
      else toast.success('Business submitted for review.');

    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Unable to create business. Please try again.'));
    } finally { setSaving(false); }
  };

  return (
    <main className="min-h-screen bg-ink-50 px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <p className="mb-2 text-sm text-ink-700">Step {createdBusinessId ? 2 : 1} of 2: {createdBusinessId ? 'Review photos' : 'Business information and photos'}</p>
        <h1 className="mb-6 font-sans text-3xl font-bold text-ink-900">List your business</h1>
        {createdBusinessId ? <BusinessPhotosStep initialFailedPhotos={failedPhotos} businessId={createdBusinessId} onDone={() => router.push('/businesses/my')} /> : <CreateBusinessForm
          onSubmit={onSubmit}
          isLoading={saving || createBusinessMutation.isPending}
          onCancel={() => router.push('/businesses/my')}
        />}
      </div>
    </main>
  );
}
