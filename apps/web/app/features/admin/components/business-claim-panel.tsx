'use client';

import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { CheckCircle2, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getErrorMessage } from '@/lib/get-error-message';
import { useAdminClaimsQuery } from '@/features/admin/queries/use-admin-claims.query';
import { useApproveClaimMutation } from '@/features/admin/mutations/use-approve-claim.mutation';
import { useRejectClaimMutation } from '@/features/admin/mutations/use-reject-claim.mutation';
import { RejectModal } from '@/features/admin/components/reject-modal';
import { RejectReasonInput } from '@/features/admin/schemas/reject-reason.schema';
import { BusinessClaimStatus } from '@/features/business-claim/types/business-claim.type';

const statusVariant: Record<BusinessClaimStatus, 'neutral' | 'success' | 'warning' | 'danger'> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
};

const STATUS_FILTERS: Array<{ value: BusinessClaimStatus; label: string }> = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

// Card-list rows + status pill tabs, same layout as ReportManagementTable.
// Approve is a direct mutation; Reject reuses the shared RejectModal
// (its min-10 zod schema is structurally identical to
// business-claim/schemas/reject-claim-reason.schema.ts) rather than
// duplicating the dialog.
export function BusinessClaimPanel() {
  const [status, setStatus] = useState<BusinessClaimStatus>('pending');
  const [page, setPage] = useState(1);
  const [rejectingClaimId, setRejectingClaimId] = useState<number | null>(null);

  const { data, isLoading } = useAdminClaimsQuery({ page, limit: 20, status });
  const approveMutation = useApproveClaimMutation();
  const rejectMutation = useRejectClaimMutation();

  const onApprove = async (claimId: number) => {
    try {
      await approveMutation.mutateAsync(claimId);
      toast.success('Claim approved. Ownership transferred.');
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Unable to approve claim.'));
    }
  };

  const onReject = async (data: RejectReasonInput) => {
    if (rejectingClaimId === null) return;

    try {
      await rejectMutation.mutateAsync({ claimId: rejectingClaimId, reason: data.reason });
      toast.success('Claim rejected.');
      setRejectingClaimId(null);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Unable to reject claim.'));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1.5">
        {STATUS_FILTERS.map((filter) => (
          <button
            key={filter.value}
            type="button"
            onClick={() => {
              setStatus(filter.value);
              setPage(1);
            }}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              status === filter.value ? 'bg-primary-600 text-white' : 'bg-ink-50 text-ink-700 ring-1 ring-ink-200 hover:bg-ink-100'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-24 animate-pulse rounded-2xl bg-ink-50 shadow-xs ring-1 ring-ink-200" />
          ))}
        </div>
      ) : !data || data.items.length === 0 ? (
        <div className="rounded-3xl bg-ink-50 p-10 text-center shadow-xs ring-1 ring-ink-200">
          <p className="text-sm text-ink-700">No {status} claims found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.items.map((claim) => (
            <div key={claim.claimId} className="rounded-2xl bg-ink-50 p-5 shadow-xs ring-1 ring-ink-200">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/businesses/${claim.businessId}`}
                      className="font-sans text-sm font-bold text-ink-900 hover:text-primary-600"
                    >
                      {claim.businessName}
                    </Link>
                    <Badge variant={statusVariant[claim.status]}>{claim.status}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-ink-500">
                    Claimed by {claim.claimantName} on {new Date(claim.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <p className="mt-3 whitespace-pre-wrap text-sm text-ink-700">{claim.message}</p>

              {claim.status === 'pending' ? (
                <div className="mt-3 flex items-center gap-3 border-t border-ink-100 pt-3">
                  <Button
                    onClick={() => onApprove(claim.claimId)}
                    disabled={approveMutation.isPending || rejectMutation.isPending}
                    className="gap-1.5 bg-emerald-600 py-1.5 text-xs hover:bg-emerald-700"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setRejectingClaimId(claim.claimId)}
                    disabled={approveMutation.isPending || rejectMutation.isPending}
                    className="gap-1.5 py-1.5 text-xs text-red-600 hover:bg-red-50"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    Reject
                  </Button>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}

      {data?.meta && data.meta.totalPages > 1 ? (
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setPage((prev) => prev - 1)}
            disabled={data.meta.page <= 1}
            className="rounded-lg border border-ink-300 bg-ink-50 px-4 py-2 text-sm font-medium text-ink-700 transition hover:bg-ink-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-ink-600">
            Page {data.meta.page} of {data.meta.totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((prev) => prev + 1)}
            disabled={data.meta.page >= data.meta.totalPages}
            className="rounded-lg border border-ink-300 bg-ink-50 px-4 py-2 text-sm font-medium text-ink-700 transition hover:bg-ink-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      ) : null}

      <RejectModal
        isOpen={rejectingClaimId !== null}
        onClose={() => setRejectingClaimId(null)}
        onSubmit={onReject}
        isLoading={rejectMutation.isPending}
        title="Reject claim"
      />
    </div>
  );
}
