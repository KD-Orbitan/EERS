import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { InfrastructureModule } from '../../infrastructure/infrastructure.module'
import { NotificationController } from './presentation/controllers/notification.controller'
import { NotificationSseController } from './presentation/sse/notification-sse.controller'
import { NotificationRepository } from './domain/repositories/notification.repository'
import { PrismaNotificationRepository } from './infrastructure/repositories/prisma-notification.repository'
import { SseConnectionManager } from './infrastructure/sse/sse-connection.manager'
import { CreateNotificationUseCase } from './application/use-cases/create-notification.use-case'
import { GetNotificationsUseCase } from './application/use-cases/get-notifications.use-case'
import { GetUnreadCountUseCase } from './application/use-cases/get-unread-count.use-case'
import { GetNotificationByIdUseCase } from './application/use-cases/get-notification-by-id.use-case'
import { MarkAsReadUseCase } from './application/use-cases/mark-as-read.use-case'
import { MarkAllReadUseCase } from './application/use-cases/mark-all-read.use-case'

import { NotificationPublisher } from './application/ports/notification-publisher.port'

@Module({
  imports: [
    ConfigModule,
    InfrastructureModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.accessSecret') || 'change-me-access-secret',
      }),
    }),
  ],
  controllers: [NotificationSseController, NotificationController],
  providers: [
    {
      provide: NotificationRepository,
      useClass: PrismaNotificationRepository,
    },
    SseConnectionManager,
    { provide: NotificationPublisher, useExisting: SseConnectionManager },
    CreateNotificationUseCase,
    GetNotificationsUseCase,
    GetUnreadCountUseCase,
    GetNotificationByIdUseCase,
    MarkAsReadUseCase,
    MarkAllReadUseCase,
  ],
  // Exported for moderation workflows in other modules (admin, report, review) to
  // trigger notifications via the public UseCase contract, per D-021.
  exports: [CreateNotificationUseCase],
})
export class NotificationModule {}
