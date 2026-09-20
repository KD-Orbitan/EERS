export interface NotificationEvent {
  event: 'notification'
  notificationId: number
  type: string
  title: string
  content: string
}

export abstract class NotificationPublisher {
  abstract push(userId: number, event: NotificationEvent): void
}
