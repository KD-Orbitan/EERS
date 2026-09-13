import { GetNotificationsUseCase } from '../application/use-cases/get-notifications.use-case'
import { GetUnreadCountUseCase } from '../application/use-cases/get-unread-count.use-case'
import { GetNotificationByIdUseCase } from '../application/use-cases/get-notification-by-id.use-case'
import { MarkAsReadUseCase } from '../application/use-cases/mark-as-read.use-case'
import { MarkAllReadUseCase } from '../application/use-cases/mark-all-read.use-case'
import { NotificationRepository } from '../domain/repositories/notification.repository'
import { NotificationNotFoundException } from '../domain/exceptions/notification.exceptions'
import { ForbiddenException } from '@nestjs/common'

describe('Notification query/mutation use cases', () => {
  let notificationRepository: jest.Mocked<
    Pick<NotificationRepository, 'findByUser' | 'countUnread' | 'findById' | 'markAsRead' | 'markAllAsRead'>
  >

  beforeEach(() => {
    notificationRepository = {
      findByUser: jest.fn(),
      countUnread: jest.fn(),
      findById: jest.fn(),
      markAsRead: jest.fn(),
      markAllAsRead: jest.fn(),
    }
  })

  describe('GetNotificationsUseCase', () => {
    it('returns notifications scoped to the current user', async () => {
      notificationRepository.findByUser.mockResolvedValue({ items: [{ notificationId: 1 } as any], total: 1 })
      const useCase = new GetNotificationsUseCase(notificationRepository as unknown as NotificationRepository)

      const result = await useCase.execute({ userId: 3, page: 1, limit: 20 })

      expect(notificationRepository.findByUser).toHaveBeenCalledWith(3, 1, 20, undefined, undefined)
      expect(result).toEqual({ items: [{ notificationId: 1 }], total: 1 })
    })
  })

  describe('GetUnreadCountUseCase', () => {
    it('returns the unread count for the current user', async () => {
      notificationRepository.countUnread.mockResolvedValue(4)
      const useCase = new GetUnreadCountUseCase(notificationRepository as unknown as NotificationRepository)

      const result = await useCase.execute({ userId: 3 })

      expect(notificationRepository.countUnread).toHaveBeenCalledWith(3)
      expect(result).toEqual({ count: 4 })
    })
  })

  describe('GetNotificationByIdUseCase', () => {
    it('throws NOTIFICATION_NOT_FOUND for an unknown id', async () => {
      notificationRepository.findById.mockResolvedValue(null)
      const useCase = new GetNotificationByIdUseCase(notificationRepository as unknown as NotificationRepository)

      await expect(useCase.execute({ notificationId: 999, currentUserId: 3 })).rejects.toBeInstanceOf(NotificationNotFoundException)
    })

    it('throws FORBIDDEN when the notification belongs to another user', async () => {
      notificationRepository.findById.mockResolvedValue({ notificationId: 1, userId: 7 } as any)
      const useCase = new GetNotificationByIdUseCase(notificationRepository as unknown as NotificationRepository)

      await expect(useCase.execute({ notificationId: 1, currentUserId: 3 })).rejects.toBeInstanceOf(ForbiddenException)
    })
  })

  describe('MarkAsReadUseCase', () => {
    it('marks the notification as read when owned by the current user', async () => {
      notificationRepository.findById.mockResolvedValue({ notificationId: 1, userId: 3 } as any)
      const useCase = new MarkAsReadUseCase(notificationRepository as unknown as NotificationRepository)

      const result = await useCase.execute({ notificationId: 1, currentUserId: 3 })

      expect(notificationRepository.markAsRead).toHaveBeenCalledWith(1)
      expect(result).toEqual({ notificationId: 1, isRead: true })
    })

    it('throws FORBIDDEN when the notification belongs to another user', async () => {
      notificationRepository.findById.mockResolvedValue({ notificationId: 1, userId: 7 } as any)
      const useCase = new MarkAsReadUseCase(notificationRepository as unknown as NotificationRepository)

      await expect(useCase.execute({ notificationId: 1, currentUserId: 3 })).rejects.toBeInstanceOf(ForbiddenException)
    })

    it('throws NOTIFICATION_NOT_FOUND for an unknown id', async () => {
      notificationRepository.findById.mockResolvedValue(null)
      const useCase = new MarkAsReadUseCase(notificationRepository as unknown as NotificationRepository)

      await expect(useCase.execute({ notificationId: 999, currentUserId: 3 })).rejects.toBeInstanceOf(NotificationNotFoundException)
    })
  })

  describe('MarkAllReadUseCase', () => {
    it('marks all unread notifications for the current user as read', async () => {
      notificationRepository.markAllAsRead.mockResolvedValue(5)
      const useCase = new MarkAllReadUseCase(notificationRepository as unknown as NotificationRepository)

      const result = await useCase.execute({ userId: 3 })

      expect(notificationRepository.markAllAsRead).toHaveBeenCalledWith(3)
      expect(result).toEqual({ updatedCount: 5 })
    })
  })
})
