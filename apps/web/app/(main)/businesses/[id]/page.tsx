'use client';

import { use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';
import { getErrorMessage } from '@/lib/get-error-message';
import { BusinessDetail } from '@/features/business/components/business-detail';
import { useBusinessDetailQuery } from '@/features/business/queries/use-business-detail.query';
import { useDeleteBusinessMutation } from '@/features/business/mutations/use-delete-business.mutation';
import { useBusinessRankingQuery } from '@/features/ranking/queries/use-business-ranking.query';

export default function BusinessDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const businessId = Number(id);
  const router = useRouter();
  const { user } = useAuth();

  const { data: business, isLoading, isError } = useBusinessDetailQuery(businessId);
  const isOwner = Boolean(business && user && (user.userId === business.owner.userId || user.role === 'ADMIN'));

  const { data: ranking } = useBusinessRankingQuery(businessId);
  const deleteBusinessMutation = useDeleteBusinessMutation();

  const onDelete = async () => {
    if (!window.confirm('Delete this business? This cannot be undone.')) return;

    try {
      await deleteBusinessMutation.mutateAsync(businessId);
      toast.success('Business deleted.');
      router.push('/businesses/my');
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Unable to delete business. Please try again.'));
    }
  };

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-600">Loading...</p>
      </main>
    );
  }

  if (isError || !business) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-200">
          <p className="text-lg font-semibold text-slate-900">Business not found</p>
          <Link href="/businesses" className="mt-3 inline-block text-sm font-medium text-primary-600 hover:text-primary-700">
            Back to businesses
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-7xl">
        <BusinessDetail
          business={business}
          ranking={ranking}
          isOwner={isOwner}
          onDelete={onDelete}
          isDeleting={deleteBusinessMutation.isPending}
        />
      </div>
    </main>
  );
}
