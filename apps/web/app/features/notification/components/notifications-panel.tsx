'use client';

import { useState } from 'react';
import { ListPagination, ListSearch } from '@/components/ui/list-controls';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/get-error-message';
import { useNotificationsQuery } from '@/features/notification/queries/use-notifications.query';
import { useOpenNotification } from '@/features/notification/hooks/use-open-notification';
import { useAuth } from '@/hooks/use-auth';
import { useMarkAllReadMutation } from '@/features/notification/mutations/use-mark-all-read.mutation';
import { NotificationItem } from '@/features/notification/components/notification-item';

const FILTERS = [
  { label: 'All', value: undefined },
  { label: 'Unread', value: false },
  { label: 'Read', value: true },
] as const;

export function NotificationsPanel() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isRead, setIsRead] = useState<boolean | undefined>(undefined);

  const { data, isLoading } = useNotificationsQuery({ search: search.trim() || undefined, page, isRead });
  const openNotification = useOpenNotification();
  const { user } = useAuth();
  const markAllReadMutation = useMarkAllReadMutation();

  const onMarkAllRead = async () => {
    try {
      const updatedCount = await markAllReadMutation.mutateAsync();
      toast.success(updatedCount > 0 ? `Marked ${updatedCount} notification(s) as read.` : 'Nothing to mark as read.');
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Unable to mark notifications as read. Please try again.'));
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-sans text-3xl font-bold text-ink-900">Notifications</h1>
        <button
          type="button"
          onClick={onMarkAllRead}
          disabled={markAllReadMutation.isPending}
          className="text-sm font-medium text-primary-600 hover:text-primary-700 disabled:opacity-60"
        >
          Mark all as read
        </button>
      </div>

      <div className="mb-4 flex gap-2">
        {FILTERS.map((filter) => (
          <button
            key={filter.label}
            type="button"
            onClick={() => {
              setIsRead(filter.value);
              setPage(1);
            }}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
              isRead === filter.value ? 'bg-primary-600 text-white' : 'bg-ink-50 text-ink-700 ring-1 ring-ink-200 hover:bg-ink-100'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <ListSearch value={search} onChange={(value) => { setSearch(value); setPage(1); }}
        placeholder="Notification title or content..." />

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-20 animate-pulse rounded-2xl bg-ink-50 shadow-xs ring-1 ring-ink-200" />
          ))}
        </div>
      ) : !data || data.items.length === 0 ? (
        <div className="rounded-2xl bg-ink-50 p-10 text-center shadow-xs ring-1 ring-ink-200">
          <p className="text-sm text-ink-700">
            {isRead === false ? 'No unread notifications.' : isRead === true ? 'No read notifications.' : "You don't have any notifications yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-2 rounded-2xl bg-ink-50 p-2 shadow-xs ring-1 ring-ink-200">
          {data.items.map((notification) => (
            <NotificationItem
              key={notification.notificationId}
              notification={notification}
              isAdmin={user?.role === 'ADMIN'}
              onClick={
                () => openNotification(notification)
              }
            />
          ))}
        </div>
      )}

      {data?.meta ? (
        <ListPagination page={page} limit={data.meta.limit} total={data.meta.total} onPageChange={setPage} />
      ) : null}
    </div>
  );
}
