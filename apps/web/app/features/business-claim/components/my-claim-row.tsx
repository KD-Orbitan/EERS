'use client';

import Link from 'next/link';
import { toast } from 'sonner';
import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getErrorMessage } from '@/lib/get-error-message';
import { useWithdrawClaimMutation } from '@/features/business-claim/mutations/use-withdraw-claim.mutation';
import { BusinessClaimStatus, MyClaimListItem } from '@/features/business-claim/types/business-claim.type';

const statusVariant: Record<BusinessClaimStatus, 'neutral' | 'success' | 'warning' | 'danger'> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
};

// Shared by the full /business-claims/my page and the "My Claims" profile
// tab preview, so withdraw behavior can't drift between the two — mirrors
// MyReportRow.
export function MyClaimRow({ claim }: { claim: MyClaimListItem }) {
  const withdrawClaimMutation = useWithdrawClaimMutation();

  const onWithdraw = async () => {
    if (!window.confirm('Withdraw this claim? This cannot be undone.')) return;

    try {
      await withdrawClaimMutation.mutateAsync(claim.claimId);
      toast.success('Claim withdrawn.');
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Unable to withdraw claim. Please try again.'));
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-ink-50 p-4 shadow-xs ring-1 ring-ink-200">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/businesses/${claim.businessId}`} className="font-sans text-sm font-bold text-ink-900 hover:text-primary-600">
            {claim.businessName}
          </Link>
          <Badge variant={statusVariant[claim.status]}>{claim.status}</Badge>
        </div>
        <p className="mt-1 max-w-xl truncate text-sm text-ink-700">{claim.message}</p>
        <p className="mt-1 text-xs text-ink-500">{new Date(claim.createdAt).toLocaleDateString()}</p>
      </div>

      {claim.status === 'pending' ? (
        <button
          type="button"
          onClick={onWithdraw}
          disabled={withdrawClaimMutation.isPending}
          className="inline-flex items-center gap-1 text-sm font-medium text-red-600 hover:text-red-700"
        >
          <X className="h-4 w-4" />
          Withdraw
        </button>
      ) : null}
    </div>
  );
}
