import { BusinessClaimPanel } from '@/features/admin/components/business-claim-panel';

export default function AdminBusinessClaimsPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="font-sans text-3xl font-bold text-ink-900">Business Claims</h1>
        <p className="mt-1 text-sm text-ink-700">Review ownership claims on unclaimed businesses.</p>
      </div>
      <BusinessClaimPanel />
    </div>
  );
}
