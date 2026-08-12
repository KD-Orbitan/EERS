import { ListAdminBusinessesUseCase } from '../application/use-cases/list-admin-businesses.use-case'
import { ListAdminReviewsUseCase } from '../application/use-cases/list-admin-reviews.use-case'
import { ListAdminUsersUseCase } from '../application/use-cases/list-admin-users.use-case'
import { BanUserUseCase } from '../application/use-cases/ban-user.use-case'
import { UnbanUserUseCase } from '../application/use-cases/unban-user.use-case'
import { UserNotFoundException, CannotBanAdminException, UserNotBannedException } from '../../user/domain/exceptions/user.exceptions'
import { PrismaService } from '../../../infrastructure/database/prisma.service'

describe('Admin management use cases', () => {
  let prisma: any

  beforeEach(() => {
    prisma = {
      $transaction: jest.fn(async (callback: any) => callback(prisma)),
      business: { findMany: jest.fn(), count: jest.fn() },
      review: { findMany: jest.fn(), count: jest.fn() },
      user: { findMany: jest.fn(), count: jest.fn(), findFirst: jest.fn(), update: jest.fn() },
      refreshToken: { updateMany: jest.fn() },
      log: { create: jest.fn() },
    }
  })

  describe('ListAdminBusinessesUseCase', () => {
    it('maps businesses to admin list items with owner name and categories', async () => {
      prisma.business.findMany.mockResolvedValue([
        {
          businessId: BigInt(1),
          name: 'Acme',
          status: 'pending',
          phone: '123',
          createdAt: new Date('2026-01-01T00:00:00Z'),
          owner: { name: 'Jane' },
          businessCategories: [{ category: { categoryId: 1, categoryName: 'Finance' } }],
        },
      ])
      prisma.business.count.mockResolvedValue(1)

      const useCase = new ListAdminBusinessesUseCase(prisma as unknown as PrismaService)
      const result = await useCase.execute({ status: 'pending' })

      expect(result.total).toBe(1)
      expect(result.items).toEqual([
        {
          businessId: 1,
          name: 'Acme',
          status: 'pending',
          ownerName: 'Jane',
          phone: '123',
          createdAt: '2026-01-01T00:00:00.000Z',
          categories: [{ categoryId: 1, categoryName: 'Finance' }],
        },
      ])
      expect(prisma.business.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ deletedAt: null, status: 'pending' }) }),
      )
    })
  })

  describe('ListAdminReviewsUseCase', () => {
    it('maps reviews to admin list items with business/author names', async () => {
      prisma.review.findMany.mockResolvedValue([
        {
          reviewId: BigInt(5),
          overallRating: 4,
          content: 'Great service',
          status: 'pending',
          businessId: BigInt(2),
          createdAt: new Date('2026-02-01T00:00:00Z'),
          business: { name: 'Acme' },
          writer: { name: 'Bob' },
        },
      ])
      prisma.review.count.mockResolvedValue(1)

      const useCase = new ListAdminReviewsUseCase(prisma as unknown as PrismaService)
      const result = await useCase.execute({})

      expect(result.total).toBe(1)
      expect(result.items).toEqual([
        {
          reviewId: 5,
          overallRating: 4,
          content: 'Great service',
          status: 'pending',
          businessId: 2,
          businessName: 'Acme',
          authorName: 'Bob',
          createdAt: '2026-02-01T00:00:00.000Z',
        },
      ])
    })
  })

  describe('ListAdminUsersUseCase', () => {
    it('maps users to admin list items with role name', async () => {
      prisma.user.findMany.mockResolvedValue([
        {
          userId: BigInt(3),
          name: 'Sarah',
          email: 's@example.com',
          status: 'active',
          createdAt: new Date('2026-01-05T00:00:00Z'),
          role: { roleName: 'USER' },
        },
      ])
      prisma.user.count.mockResolvedValue(1)

      const useCase = new ListAdminUsersUseCase(prisma as unknown as PrismaService)
      const result = await useCase.execute({})

      expect(result.items).toEqual([
        { userId: 3, name: 'Sarah', email: 's@example.com', role: 'USER', status: 'active', createdAt: '2026-01-05T00:00:00.000Z' },
      ])
    })
  })

  describe('BanUserUseCase', () => {
    it('bans a non-admin user, revokes refresh tokens, and writes an audit log', async () => {
      prisma.user.findFirst.mockResolvedValue({ userId: 3, role: { roleName: 'USER' } })

      const useCase = new BanUserUseCase(prisma as unknown as PrismaService)
      const result = await useCase.execute({ userId: 3, currentUserId: 1, reason: 'Spam' })

      expect(result).toEqual({ userId: 3, status: 'banned' })
      expect(prisma.user.update).toHaveBeenCalledWith({ where: { userId: 3 }, data: { status: 'banned' } })
      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { userId: 3, revokedAt: null },
        data: { revokedAt: expect.any(Date) },
      })
      expect(prisma.log.create).toHaveBeenCalledWith({
        data: { action: 'USER_BANNED', entityType: 'User', entityId: 3, userId: 1, newData: { reason: 'Spam' } },
      })
    })

    it('throws USER_NOT_FOUND when the user does not exist', async () => {
      prisma.user.findFirst.mockResolvedValue(null)
      const useCase = new BanUserUseCase(prisma as unknown as PrismaService)

      await expect(useCase.execute({ userId: 3, currentUserId: 1, reason: 'Spam' })).rejects.toBeInstanceOf(UserNotFoundException)
    })

    it('throws CANNOT_BAN_ADMIN when target is an admin', async () => {
      prisma.user.findFirst.mockResolvedValue({ userId: 3, role: { roleName: 'ADMIN' } })
      const useCase = new BanUserUseCase(prisma as unknown as PrismaService)

      await expect(useCase.execute({ userId: 3, currentUserId: 1, reason: 'Spam' })).rejects.toBeInstanceOf(CannotBanAdminException)
      expect(prisma.user.update).not.toHaveBeenCalled()
    })
  })

  describe('UnbanUserUseCase', () => {
    it('reactivates a banned user', async () => {
      prisma.user.findFirst.mockResolvedValue({ userId: 3, status: 'banned' })
      const useCase = new UnbanUserUseCase(prisma as unknown as PrismaService)

      const result = await useCase.execute({ userId: 3 })

      expect(result).toEqual({ userId: 3, status: 'active' })
      expect(prisma.user.update).toHaveBeenCalledWith({ where: { userId: 3 }, data: { status: 'active' } })
    })

    it('throws USER_NOT_BANNED when the user is not currently banned', async () => {
      prisma.user.findFirst.mockResolvedValue({ userId: 3, status: 'active' })
      const useCase = new UnbanUserUseCase(prisma as unknown as PrismaService)

      await expect(useCase.execute({ userId: 3 })).rejects.toBeInstanceOf(UserNotBannedException)
    })

    it('throws USER_NOT_FOUND when the user does not exist', async () => {
      prisma.user.findFirst.mockResolvedValue(null)
      const useCase = new UnbanUserUseCase(prisma as unknown as PrismaService)

      await expect(useCase.execute({ userId: 3 })).rejects.toBeInstanceOf(UserNotFoundException)
    })
  })
})
