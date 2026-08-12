import { AlertTriangle, Bell, CheckCircle2, Flag, MessageSquareText, Star, XCircle } from 'lucide-react';
import { NotificationListItem, NotificationType } from '@/features/notification/types/notification.type';

const iconByType: Partial<Record<NotificationType, typeof Bell>> = {
  BUSINESS_APPROVED: CheckCircle2,
  REVIEW_APPROVED: CheckCircle2,
  BUSINESS_REJECTED: XCircle,
  REVIEW_REJECTED: XCircle,
  REPORT_RESOLVED: Flag,
  NEW_REPLY: MessageSquareText,
  REPORT_CREATED: AlertTriangle,
  NEW_REVIEW: Star,
};

const iconColorByType: Partial<Record<NotificationType, string>> = {
  BUSINESS_APPROVED: 'text-emerald-600 bg-emerald-100',
  REVIEW_APPROVED: 'text-emerald-600 bg-emerald-100',
  BUSINESS_REJECTED: 'text-red-600 bg-red-100',
  REVIEW_REJECTED: 'text-red-600 bg-red-100',
  REPORT_RESOLVED: 'text-amber-600 bg-amber-100',
  NEW_REPLY: 'text-primary-600 bg-primary-100',
  REPORT_CREATED: 'text-red-600 bg-red-100',
  NEW_REVIEW: 'text-primary-600 bg-primary-100',
};

interface NotificationItemProps {
  notification: NotificationListItem;
  onClick?: () => void;
  compact?: boolean;
}

export function NotificationItem({ notification, onClick, compact = false }: NotificationItemProps) {
  const Icon = iconByType[notification.type] ?? Bell;
  const iconColor = iconColorByType[notification.type] ?? 'text-ink-700 bg-slate-100';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={`flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition ${
        notification.isRead ? 'bg-white' : 'bg-primary-50'
      } ${onClick ? 'hover:bg-slate-50 disabled:cursor-default' : 'cursor-default'}`}
    >
      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${iconColor}`}>
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate text-sm font-semibold text-ink-900">{notification.title}</span>
          {!notification.isRead ? <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary-600" /> : null}
        </span>
        <span className={`mt-0.5 block text-xs text-ink-700 ${compact ? 'line-clamp-2' : ''}`}>{notification.content}</span>
        <span className="mt-1 block text-xs text-ink-500">{new Date(notification.createdAt).toLocaleString()}</span>
      </span>
    </button>
  );
}
