'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Bell } from 'lucide-react';
import { useUnreadCountQuery } from '@/features/notification/queries/use-unread-count.query';
import { useNotificationsQuery } from '@/features/notification/queries/use-notifications.query';
import { useMarkAsReadMutation } from '@/features/notification/mutations/use-mark-as-read.mutation';
import { useMarkAllReadMutation } from '@/features/notification/mutations/use-mark-all-read.mutation';
import { useNotificationStream } from '@/features/notification/hooks/use-notification-stream';
import { NotificationItem } from '@/features/notification/components/notification-item';

const RECENT_LIMIT = 5;

export function NotificationBell({ enabled }: { enabled: boolean }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useNotificationStream(enabled);
  const { data: unreadCount = 0 } = useUnreadCountQuery(enabled);
  const { data, isLoading } = useNotificationsQuery({ limit: RECENT_LIMIT });
  const markAsReadMutation = useMarkAsReadMutation();
  const markAllReadMutation = useMarkAllReadMutation();

  useEffect(() => {
    if (!open) return;

    function onClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  if (!enabled) return null;

  const notifications = data?.items ?? [];

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Notifications"
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-ink-700 transition hover:bg-ink-100"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-80 rounded-2xl bg-ink-50 p-2 shadow-lg ring-1 ring-ink-200">
          <div className="flex items-center justify-between px-2 py-1.5">
            <p className="font-sans text-sm font-bold text-ink-900">Notifications</p>
            {unreadCount > 0 ? (
              <button
                type="button"
                onClick={() => markAllReadMutation.mutate()}
                disabled={markAllReadMutation.isPending}
                className="text-xs font-medium text-primary-600 hover:text-primary-700 disabled:opacity-60"
              >
                Mark all read
              </button>
            ) : null}
          </div>

          <div className="max-h-80 space-y-1 overflow-y-auto">
            {isLoading ? (
              <div className="space-y-1.5 p-2">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="h-14 animate-pulse rounded-xl bg-ink-100" />
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <p className="px-2 py-6 text-center text-sm text-ink-500">You&apos;re all caught up.</p>
            ) : (
              notifications.map((notification) => (
                <NotificationItem
                  key={notification.notificationId}
                  notification={notification}
                  compact
                  onClick={
                    notification.isRead ? undefined : () => markAsReadMutation.mutate(notification.notificationId)
                  }
                />
              ))
            )}
          </div>

          <Link
            href="/notifications"
            onClick={() => setOpen(false)}
            className="mt-1 block rounded-xl px-2 py-2 text-center text-sm font-medium text-primary-600 hover:bg-primary-50"
          >
            View all
          </Link>
        </div>
      ) : null}
    </div>
  );
}
