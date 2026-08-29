'use client';

import Link from 'next/link';
import { useMyClaimsQuery } from '@/features/business-claim/queries/use-my-claims.query';
import { MyClaimRow } from '@/features/business-claim/components/my-claim-row';

// "My Claims" profile tab: a 5-item preview + "View all" link to the full
// /business-claims/my page — mirrors MyReportsPanel.
export function MyClaimsPanel() {
  const { data, isLoading } = useMyClaimsQuery({ page: 1, limit: 5 });
  const total = data?.meta?.total ?? 0;

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-sans text-lg font-bold text-ink-900">
          {total} {total === 1 ? 'Claim' : 'Claims'}
        </h2>
        {total > 0 ? (
          <Link href="/business-claims/my" className="text-sm font-medium text-primary-600 hover:text-primary-700">
            View all
          </Link>
        ) : null}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-16 animate-pulse rounded-2xl bg-ink-100" />
          ))}
        </div>
      ) : !data || data.items.length === 0 ? (
        <p className="text-sm text-ink-700">You haven&apos;t claimed any businesses.</p>
      ) : (
        <div className="space-y-3">
          {data.items.map((claim) => (
            <MyClaimRow key={claim.claimId} claim={claim} />
          ))}
        </div>
      )}
    </>
  );
}
