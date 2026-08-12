import { Injectable } from '@nestjs/common'
import { NotificationRepository } from '../../domain/repositories/notification.repository'

@Injectable()
export class MarkAllReadUseCase {
  constructor(private readonly notificationRepository: NotificationRepository) {}

  async execute({ userId }: { userId: number }) {
    const updatedCount = await this.notificationRepository.markAllAsRead(userId)
    return { updatedCount }
  }
}
