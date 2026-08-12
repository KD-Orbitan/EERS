import { CreateNotificationUseCase } from '../application/use-cases/create-notification.use-case'
import { NotificationRepository } from '../domain/repositories/notification.repository'
import { SseConnectionManager } from '../infrastructure/sse/sse-connection.manager'

describe('CreateNotificationUseCase', () => {
  let notificationRepository: jest.Mocked<Pick<NotificationRepository, 'create'>>
  let sseConnectionManager: jest.Mocked<Pick<SseConnectionManager, 'push'>>
  let useCase: CreateNotificationUseCase

  const savedNotification = {
    notificationId: 1,
    type: 'BUSINESS_APPROVED',
    title: 'Business approved',
    content: 'Your business has been approved.',
    isRead: false,
    createdAt: '2026-01-01T00:00:00.000Z',
  }

  beforeEach(() => {
    notificationRepository = { create: jest.fn().mockResolvedValue(savedNotification) }
    sseConnectionManager = { push: jest.fn() }
    useCase = new CreateNotificationUseCase(notificationRepository as unknown as NotificationRepository, sseConnectionManager as unknown as SseConnectionManager)
  })

  it('persists the notification before attempting an SSE push', async () => {
    const callOrder: string[] = []
    notificationRepository.create.mockImplementation(async () => {
      callOrder.push('persist')
      return savedNotification
    })
    sseConnectionManager.push.mockImplementation(() => {
      callOrder.push('push')
    })

    const result = await useCase.execute({ userId: 3, type: 'BUSINESS_APPROVED', title: 'Business approved', content: 'Your business has been approved.' })

    expect(callOrder).toEqual(['persist', 'push'])
    expect(result).toEqual(savedNotification)
    expect(sseConnectionManager.push).toHaveBeenCalledWith(3, {
      event: 'notification',
      notificationId: savedNotification.notificationId,
      type: savedNotification.type,
      title: savedNotification.title,
      content: savedNotification.content,
    })
  })

  it('does not throw when the SSE push fails', async () => {
    sseConnectionManager.push.mockImplementation(() => {
      throw new Error('no active connection')
    })

    await expect(
      useCase.execute({ userId: 3, type: 'BUSINESS_APPROVED', title: 'Business approved', content: 'Your business has been approved.' }),
    ).resolves.toEqual(savedNotification)
  })
})
