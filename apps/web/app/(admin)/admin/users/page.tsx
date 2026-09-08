import { UserManagementTable } from '@/features/admin/components/user-management-table';

export default function AdminUsersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-sans text-3xl font-bold text-ink-900">User Management</h1>
        <p className="mt-1 text-sm text-ink-700">Search, filter, and ban or unban platform users.</p>
      </div>
      <UserManagementTable />
    </div>
  );
}
