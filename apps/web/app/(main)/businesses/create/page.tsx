'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/get-error-message';
import { CreateBusinessForm } from '@/features/business/components/create-business-form';
import { useCreateBusinessMutation } from '@/features/business/mutations/use-create-business.mutation';
import { CreateBusinessInput } from '@/features/business/schemas/create-business.schema';

export default function CreateBusinessPage() {
  const router = useRouter();
  const createBusinessMutation = useCreateBusinessMutation();

  const onSubmit = async (data: CreateBusinessInput) => {
    try {
      await createBusinessMutation.mutateAsync(data);
      toast.success('Business submitted for review.');
      router.push('/businesses/my');
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Unable to create business. Please try again.'));
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-6 font-sans text-3xl font-bold text-ink-900">List your business</h1>
        <CreateBusinessForm
          onSubmit={onSubmit}
          isLoading={createBusinessMutation.isPending}
          onCancel={() => router.push('/businesses/my')}
        />
      </div>
    </main>
  );
}
