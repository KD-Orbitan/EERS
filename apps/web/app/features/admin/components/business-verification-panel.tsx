'use client';

import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Search, CheckCircle2, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getErrorMessage } from '@/lib/get-error-message';
import { useAdminBusinessesQuery } from '@/features/admin/queries/use-admin-businesses.query';
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

const STATUS_TABS: Array<{ value: BusinessStatus; label: string }> = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'hidden', label: 'Hidden' },
];

// Real queue-based moderation, replacing the old ID-lookup panel now that
// GET /admin/businesses exists (added specifically to back this UI — see
// docs/API.md "GET /admin/businesses").
export function BusinessVerificationPanel() {
  const [status, setStatus] = useState<BusinessStatus>('pending');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<number | undefined>(undefined);
  const [isRejectOpen, setRejectOpen] = useState(false);

  const { data, isLoading } = useAdminBusinessesQuery({ status, search: search || undefined, page, limit: 20 });
  const businessId = selectedId ?? data?.items[0]?.businessId;
  const { data: business, isLoading: isDetailLoading } = useBusinessDetailQuery(businessId);
  const approveMutation = useApproveBusinessMutation(businessId ?? 0);
  const rejectMutation = useRejectBusinessMutation(businessId ?? 0);

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
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,320px)_1fr] lg:items-start">
      <div className="space-y-3">
        <div className="flex flex-wrap gap-1.5">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => {
                setStatus(tab.value);
                setPage(1);
                setSelectedId(undefined);
              }}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                status === tab.value ? 'bg-primary-600 text-white' : 'bg-ink-50 text-ink-700 ring-1 ring-ink-200 hover:bg-ink-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input
            type="text"
            placeholder="Search businesses..."
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            className="w-full rounded-xl border border-ink-300 py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
          />
        </div>

        <div className="space-y-2">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-16 animate-pulse rounded-2xl bg-ink-50 shadow-xs ring-1 ring-ink-200" />
            ))
          ) : !data || data.items.length === 0 ? (
            <div className="rounded-2xl bg-ink-50 p-6 text-center shadow-xs ring-1 ring-ink-200">
              <p className="text-sm text-ink-700">No {status} businesses.</p>
            </div>
          ) : (
            data.items.map((item) => (
              <button
                key={item.businessId}
                type="button"
                onClick={() => setSelectedId(item.businessId)}
                className={`w-full rounded-2xl border p-4 text-left transition ${
                  businessId === item.businessId ? 'border-primary-500 bg-primary-50' : 'border-ink-200 bg-ink-50 hover:bg-ink-100'
                }`}
              >
                <p className="truncate font-sans text-sm font-bold text-ink-900">{item.name}</p>
                <p className="mt-0.5 truncate text-xs text-ink-500">
                  {item.ownerName} · {new Date(item.createdAt).toLocaleDateString()}
                </p>
              </button>
            ))
          )}
        </div>

        {data?.meta && data.meta.totalPages > 1 ? (
          <div className="flex items-center justify-center gap-3 pt-1">
            <button
              type="button"
              onClick={() => setPage((prev) => prev - 1)}
              disabled={data.meta.page <= 1}
              className="rounded-lg border border-ink-300 bg-ink-50 px-3 py-1.5 text-xs font-medium text-ink-700 transition hover:bg-ink-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-xs text-ink-600">
              {data.meta.page} / {data.meta.totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((prev) => prev + 1)}
              disabled={data.meta.page >= data.meta.totalPages}
              className="rounded-lg border border-ink-300 bg-ink-50 px-3 py-1.5 text-xs font-medium text-ink-700 transition hover:bg-ink-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        ) : null}
      </div>

      {!businessId ? (
        <div className="rounded-3xl bg-ink-50 p-10 text-center shadow-xs ring-1 ring-ink-200">
          <p className="text-sm text-ink-700">Select a business from the list to review it.</p>
        </div>
      ) : isDetailLoading ? (
        <div className="h-64 animate-pulse rounded-3xl bg-ink-50 shadow-xs ring-1 ring-ink-200" />
      ) : !business ? (
        <div className="rounded-3xl bg-ink-50 p-10 text-center shadow-xs ring-1 ring-ink-200">
          <p className="text-sm text-ink-700">Business not found.</p>
        </div>
      ) : (
        <div className="rounded-3xl bg-ink-50 p-6 shadow-xs ring-1 ring-ink-200 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-sans text-xl font-bold text-ink-900">{business.name}</h2>
                <Badge variant={statusVariant[business.status]}>{business.status}</Badge>
              </div>
              <p className="mt-1 text-sm text-ink-700">
                Owner: {business.owner?.name ?? 'Unclaimed'} · Submitted {new Date(business.createdAt).toLocaleDateString()}
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
            <div className="mt-6 flex items-center gap-3 border-t border-ink-100 pt-4">
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
            <p className="mt-6 border-t border-ink-100 pt-4 text-sm text-ink-500">
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
