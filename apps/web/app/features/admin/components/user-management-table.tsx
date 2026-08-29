'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Search, ShieldBan, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getErrorMessage } from '@/lib/get-error-message';
import { useAdminUsersQuery } from '@/features/admin/queries/use-admin-users.query';
import { useBanUserMutation } from '@/features/admin/mutations/use-ban-user.mutation';
import { useUnbanUserMutation } from '@/features/admin/mutations/use-unban-user.mutation';
import { RejectModal } from '@/features/admin/components/reject-modal';

const statusVariant: Record<'active' | 'inactive' | 'banned', 'neutral' | 'success' | 'warning' | 'danger'> = {
  active: 'success',
  inactive: 'neutral',
  banned: 'danger',
};

const STATUS_TABS: Array<{ value: 'active' | 'inactive' | 'banned' | ''; label: string }> = [
  { value: '', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'banned', label: 'Banned' },
];

export function UserManagementTable() {
  const [status, setStatus] = useState<'active' | 'inactive' | 'banned' | ''>('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [banningUserId, setBanningUserId] = useState<number | null>(null);

  const { data, isLoading } = useAdminUsersQuery({ status: status || undefined, search: search || undefined, page, limit: 20 });
  const banMutation = useBanUserMutation();
  const unbanMutation = useUnbanUserMutation();

  const onBan = async (data: { reason: string }) => {
    if (banningUserId === null) return;
    try {
      await banMutation.mutateAsync({ userId: banningUserId, reason: data.reason });
      toast.success('User banned.');
      setBanningUserId(null);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Unable to ban user.'));
    }
  };

  const onUnban = async (userId: number) => {
    try {
      await unbanMutation.mutateAsync(userId);
      toast.success('User unbanned.');
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Unable to unban user.'));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => {
                setStatus(tab.value);
                setPage(1);
              }}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                status === tab.value ? 'bg-primary-600 text-white' : 'bg-ink-50 text-ink-700 ring-1 ring-ink-200 hover:bg-ink-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input
            type="text"
            placeholder="Search name or email..."
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            className="w-full rounded-xl border border-ink-300 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl bg-ink-50 shadow-xs ring-1 ring-ink-200">
        {isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-12 animate-pulse rounded-xl bg-ink-100" />
            ))}
          </div>
        ) : !data || data.items.length === 0 ? (
          <p className="p-10 text-center text-sm text-ink-700">No users found.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-ink-100 text-xs uppercase tracking-wide text-ink-500">
                <th className="px-5 py-3 font-medium">User</th>
                <th className="px-5 py-3 font-medium">Role</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Joined</th>
                <th className="px-5 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((user) => (
                <tr key={user.userId} className="border-b border-ink-100 last:border-0">
                  <td className="px-5 py-3">
                    <p className="font-medium text-ink-900">{user.name}</p>
                    <p className="text-xs text-ink-500">{user.email}</p>
                  </td>
                  <td className="px-5 py-3">
                    <Badge variant="brand">{user.role}</Badge>
                  </td>
                  <td className="px-5 py-3">
                    <Badge variant={statusVariant[user.status]}>{user.status}</Badge>
                  </td>
                  <td className="px-5 py-3 text-ink-700">{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td className="px-5 py-3">
                    {user.role === 'ADMIN' ? (
                      <span className="text-xs text-ink-400">—</span>
                    ) : user.status === 'banned' ? (
                      <Button
                        variant="outline"
                        onClick={() => onUnban(user.userId)}
                        disabled={unbanMutation.isPending}
                        className="gap-1.5 py-1.5 text-xs text-emerald-600 hover:bg-emerald-50"
                      >
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Unban
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        onClick={() => setBanningUserId(user.userId)}
                        disabled={banMutation.isPending}
                        className="gap-1.5 py-1.5 text-xs text-red-600 hover:bg-red-50"
                      >
                        <ShieldBan className="h-3.5 w-3.5" />
                        Ban
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

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
        isOpen={banningUserId !== null}
        onClose={() => setBanningUserId(null)}
        onSubmit={onBan}
        isLoading={banMutation.isPending}
        title="Ban user"
      />
    </div>
  );
}
