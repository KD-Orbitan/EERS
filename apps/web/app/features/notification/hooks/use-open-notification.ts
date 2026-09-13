'use client';

import { useRef } from 'react';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/get-error-message';
import { useMarkAsReadMutation } from '../mutations/use-mark-as-read.mutation';
import type { NotificationListItem } from '../types/notification.type';

export function useOpenNotification() {
  const mutation = useMarkAsReadMutation();
  const pending = useRef(new Set<number>());

  return (notification: NotificationListItem) => {
    const id = notification.notificationId;
    if (notification.isRead || pending.current.has(id)) return;
    pending.current.add(id);
    void mutation.mutateAsync(id)
      .catch((error: unknown) => toast.error(getErrorMessage(error, 'Unable to mark notification as read.')))
      .finally(() => pending.current.delete(id));
  };
}
