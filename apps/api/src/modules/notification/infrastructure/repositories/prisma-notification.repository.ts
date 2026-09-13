import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../../infrastructure/database/prisma.service'
import { NotificationRepository } from '../../domain/repositories/notification.repository'

@Injectable()
export class PrismaNotificationRepository extends NotificationRepository {
  constructor(private readonly prisma: PrismaService) {
    super()
  }

  async create(params: { userId: number; type: string; title: string; content: string }) {
    const notification = await this.prisma.notification.create({
      data: {
        userId: BigInt(params.userId),
        type: params.type,
        title: params.title,
        content: params.content,
      },
    })

    return {
      notificationId: Number(notification.notificationId),
      type: notification.type,
      title: notification.title,
      content: notification.content,
      isRead: notification.isRead,
      createdAt: notification.createdAt.toISOString(),
    }
  }

  async findByUser(userId: number, page: number, limit: number, isRead?: boolean, search?: string) {
    const where = {
      userId: BigInt(userId),
      ...(isRead !== undefined ? { isRead } : {}),
      ...(search?.trim() ? { OR: [
        { title: { contains: search.trim(), mode: 'insensitive' as const } },
        { content: { contains: search.trim(), mode: 'insensitive' as const } },
      ] } : {}),
    }
    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { notificationId: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.notification.count({ where }),
    ])

    return {
      items: notifications.map((notification) => ({
        notificationId: Number(notification.notificationId),
        type: notification.type,
        title: notification.title,
        content: notification.content,
        isRead: notification.isRead,
        createdAt: notification.createdAt.toISOString(),
      })),
      total,
    }
  }

  async findById(notificationId: number) {
    const notification = await this.prisma.notification.findUnique({ where: { notificationId: BigInt(notificationId) } })
    if (!notification) {
      return null
    }

    return {
      notificationId: Number(notification.notificationId),
      type: notification.type,
      title: notification.title,
      content: notification.content,
      isRead: notification.isRead,
      createdAt: notification.createdAt.toISOString(),
      userId: Number(notification.userId),
    }
  }

  async countUnread(userId: number) {
    return this.prisma.notification.count({ where: { userId: BigInt(userId), isRead: false } })
  }

  async markAsRead(notificationId: number) {
    await this.prisma.notification.update({ where: { notificationId: BigInt(notificationId) }, data: { isRead: true } })
  }

  async markAllAsRead(userId: number) {
    const result = await this.prisma.notification.updateMany({ where: { userId: BigInt(userId), isRead: false }, data: { isRead: true } })
    return result.count
  }
}
