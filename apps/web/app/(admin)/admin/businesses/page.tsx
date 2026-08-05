import { BusinessLookupPanel } from '@/features/admin/components/business-lookup-panel';

export default function AdminBusinessesPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-ink-900">Business Verification</h1>
        <p className="mt-1 text-sm text-ink-700">Approve or reject a pending business registration by ID.</p>
      </div>
      <BusinessLookupPanel />
    </div>
  );
}
