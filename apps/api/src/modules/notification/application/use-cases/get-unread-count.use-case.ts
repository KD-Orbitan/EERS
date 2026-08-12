import { Injectable } from '@nestjs/common'
import { NotificationRepository } from '../../domain/repositories/notification.repository'

@Injectable()
export class GetUnreadCountUseCase {
  constructor(private readonly notificationRepository: NotificationRepository) {}

  async execute({ userId }: { userId: number }) {
    const count = await this.notificationRepository.countUnread(userId)
    return { count }
  }
}
