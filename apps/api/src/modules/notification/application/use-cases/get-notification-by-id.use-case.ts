import { Injectable, ForbiddenException } from '@nestjs/common'
import { NotificationRepository } from '../../domain/repositories/notification.repository'
import { NotificationNotFoundException } from '../../domain/exceptions/notification.exceptions'

@Injectable()
export class GetNotificationByIdUseCase {
  constructor(private readonly notificationRepository: NotificationRepository) {}

  async execute({ notificationId, currentUserId }: { notificationId: number; currentUserId: number }) {
    const notification = await this.notificationRepository.findById(notificationId)
    if (!notification) {
      throw new NotificationNotFoundException()
    }

    if (notification.userId !== currentUserId) {
      throw new ForbiddenException('Forbidden')
    }

    const { userId: _userId, ...detail } = notification
    return detail
  }
}
