import Link from 'next/link';
import { Plus } from 'lucide-react';
import { BusinessVerificationPanel } from '@/features/admin/components/business-verification-panel';

export default function AdminBusinessesPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-sans text-3xl font-bold text-ink-900">Business Verification</h1>
          <p className="mt-1 text-sm text-ink-700">Approve or reject pending enterprise registrations.</p>
        </div>
        <Link
          href="/admin/businesses/create"
          className="inline-flex items-center gap-1.5 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-primary-700"
        >
          <Plus className="h-4 w-4" />
          Add Business
        </Link>
      </div>
      <BusinessVerificationPanel />
    </div>
  );
}
