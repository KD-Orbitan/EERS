import { ApproveBusinessUseCase } from '../application/use-cases/approve-business.use-case'
import { RejectBusinessUseCase } from '../application/use-cases/reject-business.use-case'
import { ApproveReviewUseCase } from '../application/use-cases/approve-review.use-case'
import { RejectReviewUseCase } from '../application/use-cases/reject-review.use-case'
import { BusinessNotFoundException, BusinessNotPendingException } from '../../business/domain/exceptions/business.exceptions'
import { ReviewNotFoundException, ReviewNotPendingException } from '../../review/domain/exceptions/review.exceptions'
import { PrismaService } from '../../../infrastructure/database/prisma.service'
import { CreateNotificationUseCase } from '../../notification/application/use-cases/create-notification.use-case'
import { NOTIFICATION_TYPE } from '@eers/shared-constants'

describe('Admin moderation use cases', () => {
  let prisma: any
  let createNotificationUseCase: jest.Mocked<Pick<CreateNotificationUseCase, 'execute'>>

  beforeEach(() => {
    prisma = {
      $transaction: jest.fn(async (callback: any) => callback(prisma)),
      business: {
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      user: {
        updateMany: jest.fn(),
      },
      role: {
        findFirst: jest.fn(),
      },
      review: {
        findFirst: jest.fn(),
        update: jest.fn(),
      },
    }
    createNotificationUseCase = { execute: jest.fn().mockResolvedValue(undefined) }
  })

  describe('ApproveBusinessUseCase', () => {
    it('sets status to approved, updates owner role to BUSINESS_OWNER, and notifies the owner', async () => {
      prisma.business.findFirst.mockResolvedValue({ businessId: 7, name: 'Acme', ownerUserId: 3, status: 'pending' })
      prisma.role.findFirst.mockResolvedValue({ roleId: 2 })

      const useCase = new ApproveBusinessUseCase(prisma as unknown as PrismaService, createNotificationUseCase as unknown as CreateNotificationUseCase)
      const result = await useCase.execute({ businessId: 7, currentUserId: 5 })

      expect(result).toEqual({ businessId: 7, status: 'approved' })
      expect(prisma.business.update).toHaveBeenCalledWith(expect.objectContaining({ data: { status: 'approved', approvedByUserId: 5 } }))
      expect(prisma.user.updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: 3 } }))
      expect(createNotificationUseCase.execute).toHaveBeenCalledWith(expect.objectContaining({ userId: 3, type: NOTIFICATION_TYPE.BUSINESS_APPROVED }))
    })

    it('throws BusinessNotFoundException for unknown id', async () => {
      prisma.business.findFirst.mockResolvedValue(null)

      const useCase = new ApproveBusinessUseCase(prisma as unknown as PrismaService, createNotificationUseCase as unknown as CreateNotificationUseCase)
      await expect(useCase.execute({ businessId: 999, currentUserId: 5 })).rejects.toBeInstanceOf(BusinessNotFoundException)
    })

    it('throws BusinessNotPendingException if not pending', async () => {
      prisma.business.findFirst.mockResolvedValue({ businessId: 7, name: 'Acme', ownerUserId: 3, status: 'approved' })

      const useCase = new ApproveBusinessUseCase(prisma as unknown as PrismaService, createNotificationUseCase as unknown as CreateNotificationUseCase)
      await expect(useCase.execute({ businessId: 7, currentUserId: 5 })).rejects.toBeInstanceOf(BusinessNotPendingException)
    })
  })

  describe('RejectBusinessUseCase', () => {
    it('sets status to rejected and notifies the owner', async () => {
      prisma.business.findFirst.mockResolvedValue({ businessId: 7, name: 'Acme', ownerUserId: 3, status: 'pending' })

      const useCase = new RejectBusinessUseCase(prisma as unknown as PrismaService, createNotificationUseCase as unknown as CreateNotificationUseCase)
      const result = await useCase.execute({ businessId: 7, currentUserId: 5, reason: 'This is clearly unacceptable and too long' })

      expect(result).toEqual({ businessId: 7, status: 'rejected' })
      expect(prisma.business.update).toHaveBeenCalledWith(expect.objectContaining({ data: { status: 'rejected' } }))
      expect(createNotificationUseCase.execute).toHaveBeenCalledWith(expect.objectContaining({ userId: 3, type: NOTIFICATION_TYPE.BUSINESS_REJECTED }))
    })

    it('throws BusinessNotPendingException if not pending', async () => {
      prisma.business.findFirst.mockResolvedValue({ businessId: 7, name: 'Acme', ownerUserId: 3, status: 'approved' })

      const useCase = new RejectBusinessUseCase(prisma as unknown as PrismaService, createNotificationUseCase as unknown as CreateNotificationUseCase)
      await expect(useCase.execute({ businessId: 7, currentUserId: 5, reason: 'This is clearly unacceptable and too long' })).rejects.toBeInstanceOf(BusinessNotPendingException)
    })
  })

  describe('ApproveReviewUseCase', () => {
    it('sets status to approved and notifies the review author', async () => {
      prisma.review.findFirst.mockResolvedValue({ reviewId: 11, status: 'pending', writerUserId: 9, business: { name: 'Acme' } })

      const useCase = new ApproveReviewUseCase(prisma as unknown as PrismaService, createNotificationUseCase as unknown as CreateNotificationUseCase)
      const result = await useCase.execute({ reviewId: 11, currentUserId: 5 })

      expect(result).toEqual({ reviewId: 11, status: 'approved' })
      expect(prisma.review.update).toHaveBeenCalledWith(expect.objectContaining({ data: { status: 'approved', managedByUserId: 5 } }))
      expect(createNotificationUseCase.execute).toHaveBeenCalledWith(expect.objectContaining({ userId: 9, type: NOTIFICATION_TYPE.REVIEW_APPROVED }))
    })

    it('throws ReviewNotFoundException for unknown id', async () => {
      prisma.review.findFirst.mockResolvedValue(null)

      const useCase = new ApproveReviewUseCase(prisma as unknown as PrismaService, createNotificationUseCase as unknown as CreateNotificationUseCase)
      await expect(useCase.execute({ reviewId: 999, currentUserId: 5 })).rejects.toBeInstanceOf(ReviewNotFoundException)
    })

    it('throws ReviewNotPendingException if not pending', async () => {
      prisma.review.findFirst.mockResolvedValue({ reviewId: 11, status: 'approved', writerUserId: 9, business: { name: 'Acme' } })

      const useCase = new ApproveReviewUseCase(prisma as unknown as PrismaService, createNotificationUseCase as unknown as CreateNotificationUseCase)
      await expect(useCase.execute({ reviewId: 11, currentUserId: 5 })).rejects.toBeInstanceOf(ReviewNotPendingException)
    })
  })

  describe('RejectReviewUseCase', () => {
    it('sets status to rejected and notifies the review author', async () => {
      prisma.review.findFirst.mockResolvedValue({ reviewId: 11, status: 'pending', writerUserId: 9, business: { name: 'Acme' } })

      const useCase = new RejectReviewUseCase(prisma as unknown as PrismaService, createNotificationUseCase as unknown as CreateNotificationUseCase)
      const result = await useCase.execute({ reviewId: 11, currentUserId: 5, reason: 'This is clearly unacceptable and too long' })

      expect(result).toEqual({ reviewId: 11, status: 'rejected' })
      expect(prisma.review.update).toHaveBeenCalledWith(expect.objectContaining({ data: { status: 'rejected', managedByUserId: 5 } }))
      expect(createNotificationUseCase.execute).toHaveBeenCalledWith(expect.objectContaining({ userId: 9, type: NOTIFICATION_TYPE.REVIEW_REJECTED }))
    })

    it('throws ReviewNotPendingException if not pending', async () => {
      prisma.review.findFirst.mockResolvedValue({ reviewId: 11, status: 'approved', writerUserId: 9, business: { name: 'Acme' } })

      const useCase = new RejectReviewUseCase(prisma as unknown as PrismaService, createNotificationUseCase as unknown as CreateNotificationUseCase)
      await expect(useCase.execute({ reviewId: 11, currentUserId: 5, reason: 'This is clearly unacceptable and too long' })).rejects.toBeInstanceOf(ReviewNotPendingException)
    })
  })
})
