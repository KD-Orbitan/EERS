'use client';

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
  const [createdBusinessId, setCreatedBusinessId] = useState<number>();
  const createBusinessMutation = useCreateBusinessMutation();

  const onSubmit = async (data: CreateBusinessInput) => {
    try {
      const business = await createBusinessMutation.mutateAsync(data);
      setCreatedBusinessId(business.businessId);
      toast.success('Business submitted for review.');

    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Unable to create business. Please try again.'));
    }
  };

  return (
    <main className="min-h-screen bg-ink-50 px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <p className="mb-2 text-sm text-ink-700">Step {createdBusinessId ? 2 : 1} of 2: {createdBusinessId ? 'Photos (optional)' : 'Business information'}</p>
        <h1 className="mb-6 font-sans text-3xl font-bold text-ink-900">List your business</h1>
        {createdBusinessId ? <BusinessPhotosStep businessId={createdBusinessId} onDone={() => router.push('/businesses/my')} /> : <CreateBusinessForm
          onSubmit={onSubmit}
          isLoading={createBusinessMutation.isPending}
          onCancel={() => router.push('/businesses/my')}
        />}
      </div>
    </main>
  );
}
