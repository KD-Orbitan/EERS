import { Injectable } from '@nestjs/common'
import { NotificationRepository } from '../../domain/repositories/notification.repository'

@Injectable()
export class GetNotificationsUseCase {
  constructor(private readonly notificationRepository: NotificationRepository) {}

  async execute({ userId, page = 1, limit = 20, isRead }: { userId: number; page?: number; limit?: number; isRead?: boolean }) {
    return this.notificationRepository.findByUser(userId, page, limit, isRead)
  }
}
