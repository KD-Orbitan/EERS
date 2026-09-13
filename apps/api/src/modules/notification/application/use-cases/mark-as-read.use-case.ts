import { Injectable, ForbiddenException } from '@nestjs/common'
import { NotificationRepository } from '../../domain/repositories/notification.repository'
import { NotificationNotFoundException } from '../../domain/exceptions/notification.exceptions'

@Injectable()
export class MarkAsReadUseCase {
  constructor(private readonly notificationRepository: NotificationRepository) {}

  async execute({ notificationId, currentUserId }: { notificationId: number; currentUserId: number }) {
    const notification = await this.notificationRepository.findById(notificationId)
    if (!notification) {
      throw new NotificationNotFoundException()
    }

    if (notification.userId !== currentUserId) {
      throw new ForbiddenException('Forbidden')
    }

    if (!notification.isRead) {
      await this.notificationRepository.markAsRead(notificationId)
    }
    return { notificationId, isRead: true as const }
  }
}
