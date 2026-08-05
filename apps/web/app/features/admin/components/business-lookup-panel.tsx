'use client';

import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Search, CheckCircle2, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getErrorMessage } from '@/lib/get-error-message';
import { useBusinessDetailQuery } from '@/features/business/queries/use-business-detail.query';
import { useApproveBusinessMutation } from '@/features/admin/mutations/use-approve-business.mutation';
import { useRejectBusinessMutation } from '@/features/admin/mutations/use-reject-business.mutation';
import { RejectModal } from '@/features/admin/components/reject-modal';
import { BusinessStatus } from '@/features/business/types/business.type';

const statusVariant: Record<BusinessStatus, 'neutral' | 'success' | 'warning' | 'danger'> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
  hidden: 'neutral',
};

// There is no backend endpoint that lists pending businesses (GET
// /businesses is hard-filtered to status='approved' — confirmed in
// prisma-business.repository.ts), so this panel looks up one business at a
// time by ID rather than showing a queue, per the "build with what exists"
// decision for Phase 7.
export function BusinessLookupPanel() {
  const [inputValue, setInputValue] = useState('');
  const [businessId, setBusinessId] = useState<number | undefined>(undefined);
  const [isRejectOpen, setRejectOpen] = useState(false);

  const { data: business, isLoading, isError } = useBusinessDetailQuery(businessId);
  const approveMutation = useApproveBusinessMutation(businessId ?? 0);
  const rejectMutation = useRejectBusinessMutation(businessId ?? 0);

  const onLookup = (event: React.FormEvent) => {
    event.preventDefault();
    const parsed = Number(inputValue);
    setBusinessId(Number.isFinite(parsed) && parsed > 0 ? parsed : undefined);
  };

  const onApprove = async () => {
    try {
      await approveMutation.mutateAsync();
      toast.success('Business approved.');
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Unable to approve business.'));
    }
  };

  const onReject = async (data: { reason: string }) => {
    try {
      await rejectMutation.mutateAsync(data);
      toast.success('Business rejected.');
      setRejectOpen(false);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Unable to reject business.'));
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={onLookup} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input
            type="number"
            min={1}
            placeholder="Enter business ID (e.g. from an owner's support request)"
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            className="w-full rounded-xl border border-slate-300 py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
          />
        </div>
        <Button type="submit">Look up</Button>
      </form>

      {!businessId ? (
        <div className="rounded-3xl bg-white p-10 text-center shadow-xs ring-1 ring-slate-200">
          <p className="text-sm text-ink-700">
            Enter a business ID above to review it. There&apos;s no endpoint to list all pending businesses, so
            moderation here is by ID — typically shared via a notification or support request.
          </p>
        </div>
      ) : isLoading ? (
        <div className="h-48 animate-pulse rounded-3xl bg-white shadow-xs ring-1 ring-slate-200" />
      ) : isError || !business ? (
        <div className="rounded-3xl bg-white p-10 text-center shadow-xs ring-1 ring-slate-200">
          <p className="text-sm text-ink-700">No business found with ID {businessId}.</p>
        </div>
      ) : (
        <div className="rounded-3xl bg-white p-6 shadow-xs ring-1 ring-slate-200 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-serif text-xl font-bold text-ink-900">{business.name}</h2>
                <Badge variant={statusVariant[business.status]}>{business.status}</Badge>
              </div>
              <p className="mt-1 text-sm text-ink-700">
                Owner: {business.owner.name} · Submitted {new Date(business.createdAt).toLocaleDateString()}
              </p>
              {business.categories.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {business.categories.map((category) => (
                    <Badge key={category.categoryId} variant="brand">
                      {category.categoryName}
                    </Badge>
                  ))}
                </div>
              ) : null}
            </div>
            <Link href={`/businesses/${business.businessId}`} className="text-sm font-medium text-primary-600 hover:text-primary-700">
              View public page
            </Link>
          </div>

          {business.description ? <p className="mt-4 text-sm text-ink-700">{business.description}</p> : null}

          <div className="mt-4 grid grid-cols-1 gap-2 text-sm text-ink-700 sm:grid-cols-2">
            <p>Phone: {business.phone}</p>
            {business.email ? <p>Email: {business.email}</p> : null}
            {business.locations[0] ? (
              <p className="sm:col-span-2">
                Location: {business.locations[0].addressLine}, {business.locations[0].ward}, {business.locations[0].province}
              </p>
            ) : null}
          </div>

          {business.status === 'pending' ? (
            <div className="mt-6 flex items-center gap-3 border-t border-slate-100 pt-4">
              <Button onClick={onApprove} disabled={approveMutation.isPending} className="gap-1.5 bg-emerald-600 hover:bg-emerald-700">
                <CheckCircle2 className="h-4 w-4" />
                {approveMutation.isPending ? 'Approving...' : 'Approve Business'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setRejectOpen(true)}
                disabled={rejectMutation.isPending}
                className="gap-1.5 text-red-600 hover:bg-red-50"
              >
                <XCircle className="h-4 w-4" />
                Reject Business
              </Button>
            </div>
          ) : (
            <p className="mt-6 border-t border-slate-100 pt-4 text-sm text-ink-500">
              This business is already {business.status} — no moderation action available.
            </p>
          )}
        </div>
      )}

      <RejectModal
        isOpen={isRejectOpen}
        onClose={() => setRejectOpen(false)}
        onSubmit={onReject}
        isLoading={rejectMutation.isPending}
        title="Reject business"
      />
    </div>
  );
}
