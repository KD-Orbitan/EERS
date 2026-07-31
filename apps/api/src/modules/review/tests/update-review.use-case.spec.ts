import { UpdateReviewUseCase } from '../application/use-cases/update-review.use-case'
import { ReviewRepository } from '../domain/repositories/review.repository'
import { ReviewNotFoundException, InvalidRatingException, InvalidCriterionException } from '../domain/exceptions/review.exceptions'
import { PrismaService } from '../../../../infrastructure/database/prisma.service'

describe('UpdateReviewUseCase', () => {
  let reviewRepository: jest.Mocked<Pick<ReviewRepository, 'findById' | 'findBusinessCriteria' | 'updateReviewWithCriteria'>>
  let prisma: { $transaction: jest.Mock }
  let useCase: UpdateReviewUseCase

  beforeEach(() => {
    reviewRepository = {
      findById: jest.fn(),
      findBusinessCriteria: jest.fn(),
      updateReviewWithCriteria: jest.fn(),
    }
    prisma = { $transaction: jest.fn((callback: any) => callback()) }
    useCase = new UpdateReviewUseCase(reviewRepository as unknown as ReviewRepository, prisma as unknown as PrismaService)
  })

  it('resets status to pending after edit', async () => {
    reviewRepository.findById.mockResolvedValue({ reviewId: 1, writerUserId: 5, businessId: 2, deletedAt: null } as any)
    reviewRepository.findBusinessCriteria.mockResolvedValue([{ criterionId: 1 }])
    reviewRepository.updateReviewWithCriteria.mockResolvedValue({ reviewId: 1, status: 'pending' })

    const result = await useCase.execute({ reviewId: 1, currentUserId: 5, currentUserRole: 'USER', dto: { content: 'Updated review contents here' } })

    expect(result.status).toBe('pending')
  })

  it('throws FORBIDDEN for non-owner edits', async () => {
    reviewRepository.findById.mockResolvedValue({ reviewId: 1, writerUserId: 5, businessId: 2, deletedAt: null } as any)

    await expect(useCase.execute({ reviewId: 1, currentUserId: 6, currentUserRole: 'USER', dto: { content: 'Updated review contents here' } })).rejects.toThrow('Forbidden')
  })

  it('throws REVIEW_NOT_FOUND for missing review', async () => {
    reviewRepository.findById.mockResolvedValue(null)

    await expect(useCase.execute({ reviewId: 1, currentUserId: 6, currentUserRole: 'USER', dto: { content: 'Updated review contents here' } })).rejects.toBeInstanceOf(ReviewNotFoundException)
  })

  it('throws INVALID_CRITERION for unsupported criterion', async () => {
    reviewRepository.findById.mockResolvedValue({ reviewId: 1, writerUserId: 5, businessId: 2, deletedAt: null } as any)
    reviewRepository.findBusinessCriteria.mockResolvedValue([{ criterionId: 1 }])

    await expect(useCase.execute({ reviewId: 1, currentUserId: 5, currentUserRole: 'USER', dto: { criteriaRatings: [{ criterionId: 9, ratingValue: 4 }] } })).rejects.toBeInstanceOf(InvalidCriterionException)
  })

  it('throws INVALID_RATING for wrong rating', async () => {
    reviewRepository.findById.mockResolvedValue({ reviewId: 1, writerUserId: 5, businessId: 2, deletedAt: null } as any)
    reviewRepository.findBusinessCriteria.mockResolvedValue([{ criterionId: 1 }])

    await expect(useCase.execute({ reviewId: 1, currentUserId: 5, currentUserRole: 'USER', dto: { overallRating: 6 } })).rejects.toBeInstanceOf(InvalidRatingException)
  })
})
