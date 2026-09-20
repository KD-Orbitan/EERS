import { PrismaService } from './prisma.service'
import { PrismaReviewRepository } from '../../modules/review/infrastructure/repositories/prisma-review.repository'
import { PrismaRefreshTokenRepository } from '../../modules/auth/infrastructure/repositories/prisma-refresh-token.repository'

describe.each(['review deletion', 'login'] as const)('%s transaction', (operation) => {
  function setup() {
    const tx = {
      review: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
      refreshToken: { create: jest.fn().mockResolvedValue({}) },
      log: { create: jest.fn().mockResolvedValue({}) },
    }
    const prisma = {
      review: { updateMany: jest.fn() },
      refreshToken: { create: jest.fn() },
      log: { create: jest.fn() },
      $transaction: jest.fn(async (work: (client: typeof tx) => Promise<void>) => work(tx)),
    }
    const client = prisma as unknown as PrismaService
    const run = operation === 'review deletion'
      ? () => new PrismaReviewRepository(client).softDeleteReviewWithAudit(10, 2)
      : () => new PrismaRefreshTokenRepository(client).createWithLoginAudit({
        userId: 2, token: 'hashed-token', expiresAt: new Date('2030-01-01'),
      })
    return { tx, prisma, run }
  }

  it('performs both writes on the transaction client', async () => {
    const { tx, prisma, run } = setup()
    await run()
    expect(prisma.$transaction).toHaveBeenCalledTimes(1)
    if (operation === 'review deletion') {
      expect(tx.review.updateMany).toHaveBeenCalledWith({
        where: { reviewId: 10n, deletedAt: null }, data: { deletedAt: expect.any(Date) },
      })
    } else {
      expect(tx.refreshToken.create).toHaveBeenCalledWith({
        data: { userId: 2, token: 'hashed-token', expiresAt: new Date('2030-01-01') },
      })
    }
    expect(tx.log.create).toHaveBeenCalledTimes(1)
    expect(prisma.review.updateMany).not.toHaveBeenCalled()
    expect(prisma.refreshToken.create).not.toHaveBeenCalled()
    expect(prisma.log.create).not.toHaveBeenCalled()
  })

  it('propagates audit failure to the transaction so Prisma can roll back', async () => {
    const { tx, run } = setup()
    const failure = new Error('audit write failed')
    tx.log.create.mockRejectedValue(failure)
    await expect(run()).rejects.toBe(failure)
  })
})
