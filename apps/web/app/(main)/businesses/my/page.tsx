'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { getErrorMessage } from '@/lib/get-error-message';
import { BusinessList } from '@/features/business/components/business-list';
import { useMyBusinessesQuery } from '@/features/business/queries/use-my-businesses.query';
import { useDeleteBusinessMutation } from '@/features/business/mutations/use-delete-business.mutation';

export default function MyBusinessesPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useMyBusinessesQuery({ page });
  const deleteBusinessMutation = useDeleteBusinessMutation();

  const onDelete = async (businessId: number) => {
    if (!window.confirm('Delete this business? This cannot be undone.')) return;

    try {
      await deleteBusinessMutation.mutateAsync(businessId);
      toast.success('Business deleted.');
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Unable to delete business. Please try again.'));
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-serif text-3xl font-bold text-ink-900">My businesses</h1>
          <Link href="/businesses/create">
            <Button>
              <Plus className="mr-1.5 h-4 w-4" />
              New business
            </Button>
          </Link>
        </div>

        <BusinessList
          businesses={data?.items ?? []}
          isLoading={isLoading}
          pagination={data?.meta}
          onPageChange={setPage}
          onDelete={onDelete}
          emptyMessage="You haven't created any businesses yet."
        />
      </div>
    </main>
  );
}
