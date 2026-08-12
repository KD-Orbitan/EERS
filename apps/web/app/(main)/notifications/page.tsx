'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/get-error-message';
import { useNotificationsQuery } from '@/features/notification/queries/use-notifications.query';
import { useMarkAsReadMutation } from '@/features/notification/mutations/use-mark-as-read.mutation';
import { useMarkAllReadMutation } from '@/features/notification/mutations/use-mark-all-read.mutation';
import { NotificationItem } from '@/features/notification/components/notification-item';

const FILTERS = [
  { label: 'All', value: undefined },
  { label: 'Unread', value: false },
] as const;

export default function NotificationsPage() {
  const [page, setPage] = useState(1);
  const [isRead, setIsRead] = useState<boolean | undefined>(undefined);

  const { data, isLoading } = useNotificationsQuery({ page, isRead });
  const markAsReadMutation = useMarkAsReadMutation();
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
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-serif text-3xl font-bold text-ink-900">Notifications</h1>
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
                isRead === filter.value ? 'bg-primary-600 text-white' : 'bg-white text-ink-700 ring-1 ring-slate-200 hover:bg-slate-50'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-20 animate-pulse rounded-2xl bg-white shadow-xs ring-1 ring-slate-200" />
            ))}
          </div>
        ) : !data || data.items.length === 0 ? (
          <div className="rounded-2xl bg-white p-10 text-center shadow-xs ring-1 ring-slate-200">
            <p className="text-sm text-ink-700">
              {isRead === false ? 'No unread notifications.' : "You don't have any notifications yet."}
            </p>
          </div>
        ) : (
          <div className="space-y-2 rounded-2xl bg-white p-2 shadow-xs ring-1 ring-slate-200">
            {data.items.map((notification) => (
              <NotificationItem
                key={notification.notificationId}
                notification={notification}
                onClick={
                  notification.isRead ? undefined : () => markAsReadMutation.mutate(notification.notificationId)
                }
              />
            ))}
          </div>
        )}

        {data?.meta && data.meta.totalPages > 1 ? (
          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setPage((prev) => prev - 1)}
              disabled={data.meta.page <= 1}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-slate-600">
              Page {data.meta.page} of {data.meta.totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((prev) => prev + 1)}
              disabled={data.meta.page >= data.meta.totalPages}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        ) : null}
      </div>
    </main>
  );
}
