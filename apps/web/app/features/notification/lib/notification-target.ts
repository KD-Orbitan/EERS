import type { NotificationListItem } from '../types/notification.type';

const legacyTargets: Record<string, string> = {
  BUSINESS_APPROVED: '/businesses/my',
  BUSINESS_REJECTED: '/businesses/my',
  REVIEW_APPROVED: '/reviews/my',
  REVIEW_REJECTED: '/reviews/my',
  NEW_REPLY: '/reviews/my',
  NEW_REVIEW: '/businesses/my',
  REPORT_CREATED: '/admin/reports',
  REPORT_RESOLVED: '/reports/my',
  CLAIM_SUBMITTED: '/admin/business-claims',
  CLAIM_APPROVED: '/businesses/my',
  CLAIM_REJECTED: '/business-claims/my',
};

export function notificationTarget(notification: NotificationListItem, isAdmin = false): string {
  const path = notification.targetPath;
  if (path?.startsWith('/') && !path.startsWith('//') && !/[\\\s\u0000-\u001f]/.test(path)) return path;
  // Older notifications did not retain entity IDs. Open their related collection.
  return legacyTargets[notification.type] ?? (isAdmin ? '/admin' : '/profile');
}
