export type NotificationType =
  | 'BUSINESS_APPROVED'
  | 'BUSINESS_REJECTED'
  | 'REVIEW_APPROVED'
  | 'REVIEW_REJECTED'
  | 'REPORT_RESOLVED'
  | 'NEW_REPLY'
  | 'REPORT_CREATED'
  | 'NEW_REVIEW'
  | (string & {});

export interface NotificationListItem {
  notificationId: number;
  type: NotificationType;
  title: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}
