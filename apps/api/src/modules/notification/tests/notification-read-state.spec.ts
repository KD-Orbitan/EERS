import { BadRequestException, ValidationPipe } from '@nestjs/common'
import { NotificationListQueryDto } from '../application/dto/notification-list-query.dto'
import { MarkAsReadUseCase } from '../application/use-cases/mark-as-read.use-case'
import { NotificationRepository } from '../domain/repositories/notification.repository'
import { PrismaNotificationRepository } from '../infrastructure/repositories/prisma-notification.repository'
import { PrismaService } from '../../../infrastructure/database/prisma.service'

describe('Notification read state regression', () => {
  // Match the production ValidationPipe, including implicit conversion.
  const pipe = new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true,
    transformOptions: { enableImplicitConversion: true } })
  const parse = (value: unknown) => pipe.transform(value, { type: 'query', metatype: NotificationListQueryDto })

  it.each([['false', false], ['true', true], [false, false], [true, true]])('parses isRead=%s as %s', async (input, expected) => {
    const dto = await parse({ isRead: input })
    expect(dto.isRead).toBe(expected)
  })

  it('does not add a filter to All', async () => {
    expect((await parse({})).isRead).toBeUndefined()
  })

  it.each(['0', '1', 'invalid', '', ['false', 'true']])('rejects invalid boolean %j', async (input) => {
    await expect(parse({ isRead: input })).rejects.toBeInstanceOf(BadRequestException)
  })

  it('passes the unread filter to both the list and count query', async () => {
    const model = { findMany: jest.fn().mockResolvedValue([]), count: jest.fn().mockResolvedValue(0) }
    const repo = new PrismaNotificationRepository({ notification: model } as unknown as PrismaService)
    const dto = await parse({ isRead: 'false' })
    await repo.findByUser(7, 1, 20, dto.isRead)
    expect(model.count).toHaveBeenCalledWith({ where: { userId: 7n, isRead: false } })
    expect(model.findMany.mock.calls[0][0].where).toEqual({ userId: 7n, isRead: false })
  })

  it('repeated opens of the same notification only mark it read once', async () => {
    const notification = { notificationId: 1, userId: 7, isRead: false }
    const repository = {
      findById: jest.fn(async () => ({ ...notification })),
      markAsRead: jest.fn(async () => { notification.isRead = true }),
    }
    const useCase = new MarkAsReadUseCase(repository as unknown as NotificationRepository)
    await useCase.execute({ notificationId: 1, currentUserId: 7 })
    await useCase.execute({ notificationId: 1, currentUserId: 7 })
    expect(repository.markAsRead).toHaveBeenCalledTimes(1)
    expect(notification.isRead).toBe(true)
  })

  it('persists and returns the notification destination', async () => {
    const row = { notificationId: 1n, type: 'NEW_REPLY', title: 'Reply', content: 'New reply',
      isRead: false, targetPath: '/businesses/7/reviews', createdAt: new Date() }
    const model = { create: jest.fn().mockResolvedValue(row), findMany: jest.fn().mockResolvedValue([row]), count: jest.fn().mockResolvedValue(1) }
    const repo = new PrismaNotificationRepository({ notification: model } as unknown as PrismaService)
    const created = await repo.create({ userId: 2, type: row.type, title: row.title, content: row.content, targetPath: row.targetPath })
    expect(model.create).toHaveBeenCalledWith({ data: expect.objectContaining({ targetPath: row.targetPath }) })
    expect(created.targetPath).toBe(row.targetPath)
    expect((await repo.findByUser(2, 1, 20)).items[0].targetPath).toBe(row.targetPath)
  })
})
