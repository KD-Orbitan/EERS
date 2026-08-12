import { BusinessVerificationPanel } from '@/features/admin/components/business-verification-panel';

export default function AdminBusinessesPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-ink-900">Business Verification</h1>
        <p className="mt-1 text-sm text-ink-700">Approve or reject pending enterprise registrations.</p>
      </div>
      <BusinessVerificationPanel />
    </div>
  );
}
