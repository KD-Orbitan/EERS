import { Controller, Get, Param, ParseIntPipe, Patch, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { CurrentUser } from '../../../../common/decorators/current-user.decorator'
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard'
import { NotificationListQueryDto } from '../../application/dto/notification-list-query.dto'
import { GetNotificationsUseCase } from '../../application/use-cases/get-notifications.use-case'
import { GetUnreadCountUseCase } from '../../application/use-cases/get-unread-count.use-case'
import { GetNotificationByIdUseCase } from '../../application/use-cases/get-notification-by-id.use-case'
import { MarkAsReadUseCase } from '../../application/use-cases/mark-as-read.use-case'
import { MarkAllReadUseCase } from '../../application/use-cases/mark-all-read.use-case'

@ApiTags('notifications')
@ApiBearerAuth()
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(
    private readonly getNotificationsUseCase: GetNotificationsUseCase,
    private readonly getUnreadCountUseCase: GetUnreadCountUseCase,
    private readonly getNotificationByIdUseCase: GetNotificationByIdUseCase,
    private readonly markAsReadUseCase: MarkAsReadUseCase,
    private readonly markAllReadUseCase: MarkAllReadUseCase,
  ) {}

  // Registered before :notificationId — see docs/API.md Chapter 10 note.
  @Get('unread-count')
  async getUnreadCount(@CurrentUser() user: { userId: number }) {
    return this.getUnreadCountUseCase.execute({ userId: user.userId })
  }

  // Registered before :notificationId — see docs/API.md Chapter 10 note.
  @Patch('read-all')
  async markAllRead(@CurrentUser() user: { userId: number }) {
    return this.markAllReadUseCase.execute({ userId: user.userId })
  }

  @Get()
  async getNotifications(@CurrentUser() user: { userId: number }, @Query() query: NotificationListQueryDto) {
    const { items, total } = await this.getNotificationsUseCase.execute({
      userId: user.userId,
      page: query.page,
      limit: query.limit,
      isRead: query.isRead,
    })
    const page = query.page ?? 1
    const limit = query.limit ?? 20
    return { success: true, data: items, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } }
  }

  @Get(':notificationId')
  async getNotificationById(@CurrentUser() user: { userId: number }, @Param('notificationId', ParseIntPipe) notificationId: number) {
    return this.getNotificationByIdUseCase.execute({ notificationId, currentUserId: user.userId })
  }

  @Patch(':notificationId/read')
  async markAsRead(@CurrentUser() user: { userId: number }, @Param('notificationId', ParseIntPipe) notificationId: number) {
    return this.markAsReadUseCase.execute({ notificationId, currentUserId: user.userId })
  }
}
