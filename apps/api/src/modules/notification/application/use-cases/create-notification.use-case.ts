import { Injectable, Logger } from '@nestjs/common'
import { NotificationRepository } from '../../domain/repositories/notification.repository'
import { SseConnectionManager } from '../../infrastructure/sse/sse-connection.manager'

@Injectable()
export class CreateNotificationUseCase {
  private readonly logger = new Logger(CreateNotificationUseCase.name)

  constructor(
    private readonly notificationRepository: NotificationRepository,
    private readonly sseConnectionManager: SseConnectionManager,
  ) {}

  async execute({ userId, type, title, content }: { userId: number; type: string; title: string; content: string }) {
    const notification = await this.notificationRepository.create({ userId, type, title, content })

    try {
      this.sseConnectionManager.push(userId, {
        event: 'notification',
        notificationId: notification.notificationId,
        type: notification.type,
        title: notification.title,
        content: notification.content,
      })
    } catch (error) {
      this.logger.warn(`SSE push failed for user ${userId}: ${(error as Error).message}`)
    }

    return notification
  }
}
