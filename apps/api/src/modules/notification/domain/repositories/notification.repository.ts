export interface NotificationListItem {
  notificationId: number
  type: string
  title: string
  content: string
  isRead: boolean
  createdAt: string
}

export interface NotificationDetail {
  notificationId: number
  type: string
  title: string
  content: string
  isRead: boolean
  createdAt: string
  userId: number
}

export abstract class NotificationRepository {
  abstract create(params: { userId: number; type: string; title: string; content: string }): Promise<{ notificationId: number; type: string; title: string; content: string; isRead: boolean; createdAt: string }>
  abstract findByUser(userId: number, page: number, limit: number, isRead?: boolean): Promise<{ items: NotificationListItem[]; total: number }>
  abstract findById(notificationId: number): Promise<NotificationDetail | null>
  abstract countUnread(userId: number): Promise<number>
  abstract markAsRead(notificationId: number): Promise<void>
  abstract markAllAsRead(userId: number): Promise<number>
}
