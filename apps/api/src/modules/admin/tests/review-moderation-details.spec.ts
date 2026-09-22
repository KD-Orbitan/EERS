import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { ApproveReviewDto } from '../application/dto/approve-review.dto'
import { RejectReviewDto } from '../application/dto/reject-review.dto'
import { ApproveReviewUseCase } from '../application/use-cases/approve-review.use-case'
import { RejectReviewUseCase } from '../application/use-cases/reject-review.use-case'
import { ListAdminReviewsUseCase } from '../application/use-cases/list-admin-reviews.use-case'
import { PrismaReviewRepository } from '../../review/infrastructure/repositories/prisma-review.repository'

describe('Review moderation details', () => {
  const setup = () => {
    const prisma: any = {
      review: {
        findFirst: jest.fn().mockResolvedValue({ reviewId: 11, writerUserId: 9, businessId: 2, status: 'pending' }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        update: jest.fn(), findMany: jest.fn(), count: jest.fn().mockResolvedValue(1),
      },
      log: { create: jest.fn() },
      $transaction: jest.fn(async (callback) => callback(prisma)),
    }
    const notifications: any = { execute: jest.fn() }
    return { prisma, notifications }
  }

  it('saves trimmed optional approval notes and an audit record before notifying', async () => {
    const { prisma, notifications } = setup()
    await new ApproveReviewUseCase(prisma, notifications).execute({ reviewId: 11, currentUserId: 5, reason: '  Verified experience  ' })
    expect(prisma.review.updateMany).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ moderationReason: 'Verified experience', moderatedAt: expect.any(Date) }) }))
    expect(prisma.log.create).toHaveBeenCalledWith({ data: expect.objectContaining({ action: 'REVIEW_APPROVED', entityId: 11n, userId: 5n, newData: expect.objectContaining({ moderationReason: 'Verified experience' }) }) })
    expect(notifications.execute).toHaveBeenCalledTimes(1)
  })

  it.each([ApproveReviewUseCase, RejectReviewUseCase])('does not log or notify a losing concurrent decision (%p)', async (UseCase) => {
    const { prisma, notifications } = setup()
    prisma.review.updateMany.mockResolvedValue({ count: 0 })
    await expect(new UseCase(prisma, notifications).execute({ reviewId: 11, currentUserId: 5, reason: 'Duplicate content' })).rejects.toThrow()
    expect(prisma.log.create).not.toHaveBeenCalled()
    expect(notifications.execute).not.toHaveBeenCalled()
  })

  it('returns admin identity, ISO timestamp and reason, with nulls for legacy records', async () => {
    const { prisma } = setup()
    const base = { reviewId: 11n, businessId: 2n, overallRating: 4, content: 'Review', status: 'rejected', business: { name: 'Acme' }, writer: { name: 'Author' }, createdAt: new Date('2026-09-01T00:00:00Z') }
    prisma.review.findMany.mockResolvedValue([
      { ...base, managedBy: { userId: 5n, name: 'Admin' }, moderatedAt: new Date('2026-09-21T00:00:00Z'), moderationReason: 'Duplicate content' },
      { ...base, managedBy: null, moderatedAt: null, moderationReason: null },
    ])
    const { items } = await new ListAdminReviewsUseCase(prisma).execute({ status: 'rejected' })
    expect(items[0]).toMatchObject({ managedBy: { userId: 5, name: 'Admin' }, moderatedAt: '2026-09-21T00:00:00.000Z', moderationReason: 'Duplicate content' })
    expect(items[1]).toMatchObject({ managedBy: null, moderatedAt: null, moderationReason: null })
  })

  it('clears the current decision on edit without deleting audit history', async () => {
    const { prisma } = setup()
    await new PrismaReviewRepository(prisma).updateReviewWithCriteria(11, { content: 'Edited content' })
    expect(prisma.review.update).toHaveBeenCalledWith({ where: { reviewId: 11n }, data: { content: 'Edited content', status: 'pending', managedByUserId: null, moderatedAt: null, moderationReason: null } })
  })

  it('validates trimmed rejection reasons and optional approval notes', async () => {
    expect(await validate(plainToInstance(RejectReviewDto, { reason: '           ' }))).not.toHaveLength(0)
    expect(await validate(plainToInstance(RejectReviewDto, { reason: 'x'.repeat(501) }))).not.toHaveLength(0)
    expect(await validate(plainToInstance(RejectReviewDto, { reason: '  Duplicate content  ' }))).toHaveLength(0)
    expect(await validate(plainToInstance(ApproveReviewDto, {}))).toHaveLength(0)
    expect(await validate(plainToInstance(ApproveReviewDto, { reason: 'x'.repeat(501) }))).not.toHaveLength(0)
  })
})
