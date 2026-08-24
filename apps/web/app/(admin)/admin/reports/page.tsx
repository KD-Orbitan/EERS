import { ReportManagementTable } from '@/features/admin/components/report-management-table';

export default function AdminReportsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-sans text-3xl font-bold text-ink-900">Report Management</h1>
        <p className="mt-1 text-sm text-ink-700">Review user-submitted reports and resolve or reject them.</p>
      </div>
      <ReportManagementTable />
    </div>
  );
}
