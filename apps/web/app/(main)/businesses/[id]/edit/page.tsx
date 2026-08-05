'use client';

import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';
import { getErrorMessage } from '@/lib/get-error-message';
import { CreateBusinessForm } from '@/features/business/components/create-business-form';
import { useBusinessDetailQuery } from '@/features/business/queries/use-business-detail.query';
import { useUpdateBusinessMutation } from '@/features/business/mutations/use-update-business.mutation';
import { UpdateBusinessInput } from '@/features/business/schemas/update-business.schema';

export default function EditBusinessPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const businessId = Number(id);
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();

  const { data: business, isLoading, isError } = useBusinessDetailQuery(businessId);
  const updateBusinessMutation = useUpdateBusinessMutation(businessId);

  const isOwner = Boolean(business && user && (user.userId === business.owner.userId || user.role === 'ADMIN'));

  useEffect(() => {
    if (!isAuthLoading && !isLoading && business && !isOwner) {
      router.replace(`/businesses/${businessId}`);
    }
  }, [isAuthLoading, isLoading, business, isOwner, router, businessId]);

  const onSubmit = async (data: UpdateBusinessInput) => {
    try {
      await updateBusinessMutation.mutateAsync(data);
      toast.success('Business updated.');
      router.push(`/businesses/${businessId}`);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Unable to update business. Please try again.'));
    }
  };

  if (isLoading || isAuthLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-600">Loading...</p>
      </main>
    );
  }

  if (isError || !business || !isOwner) {
    return null;
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-6 font-serif text-3xl font-bold text-ink-900">Edit business</h1>
        <CreateBusinessForm
          initialData={business}
          onSubmit={onSubmit}
          isLoading={updateBusinessMutation.isPending}
          onCancel={() => router.push(`/businesses/${businessId}`)}
        />
      </div>
    </main>
  );
}
