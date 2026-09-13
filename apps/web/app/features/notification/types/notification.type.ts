export type NotificationType =
  | 'BUSINESS_APPROVED'
  | 'BUSINESS_REJECTED'
  | 'REVIEW_APPROVED'
  | 'REVIEW_REJECTED'
  | 'REPORT_RESOLVED'
  | 'NEW_REPLY'
  | 'REPORT_CREATED'
  | 'NEW_REVIEW'
  | 'CLAIM_SUBMITTED'
  | 'CLAIM_APPROVED'
  | 'CLAIM_REJECTED'
  | (string & {});

export interface NotificationListItem {
  notificationId: number;
  type: NotificationType;
  title: string;
  content: string;
  targetPath?: string | null;
  isRead: boolean;
  createdAt: string;
}
