import { CreateReviewUseCase } from '../application/use-cases/create-review.use-case'
import { ReviewRepository } from '../domain/repositories/review.repository'
import { ReviewAlreadyExistsException, InvalidRatingException, InvalidCriterionException } from '../domain/exceptions/review.exceptions'
import { BusinessNotApprovedException } from '../../business/domain/exceptions/business.exceptions'
import { BusinessRepository } from '../../business/domain/repositories/business.repository'
import { PrismaService } from '../../../../infrastructure/database/prisma.service'

describe('CreateReviewUseCase', () => {
  let reviewRepository: jest.Mocked<Pick<ReviewRepository, 'findByWriterAndBusiness' | 'createReviewWithCriteria' | 'findBusinessCriteria' | 'findBusinessById'>>
  let businessRepository: jest.Mocked<Pick<BusinessRepository, 'findById'>>
  let prisma: { $transaction: jest.Mock }
  let useCase: CreateReviewUseCase

  beforeEach(() => {
    reviewRepository = {
      findByWriterAndBusiness: jest.fn(),
      createReviewWithCriteria: jest.fn(),
      findBusinessCriteria: jest.fn(),
      findBusinessById: jest.fn(),
    }
    businessRepository = { findById: jest.fn() }
    prisma = { $transaction: jest.fn((callback: any) => callback()) }
    useCase = new CreateReviewUseCase(reviewRepository as unknown as ReviewRepository, businessRepository as unknown as BusinessRepository, prisma as unknown as PrismaService)
  })

  it('creates review with pending status and null sentiment', async () => {
    businessRepository.findById.mockResolvedValue({ businessId: 1, status: 'approved', ownerUserId: 2, deletedAt: null } as any)
    reviewRepository.findByWriterAndBusiness.mockResolvedValue(null)
    reviewRepository.findBusinessCriteria.mockResolvedValue([{ criterionId: 1 }, { criterionId: 2 }])
    reviewRepository.createReviewWithCriteria.mockResolvedValue({ reviewId: 10, status: 'pending' })

    const result = await useCase.execute({ currentUserId: 5, dto: { businessId: 1, overallRating: 4, content: 'Great experience and service', criteriaRatings: [{ criterionId: 1, ratingValue: 4 }] } })

    expect(result).toEqual({ reviewId: 10, status: 'pending' })
    expect(reviewRepository.createReviewWithCriteria).toHaveBeenCalled()
  })

  it('throws REVIEW_ALREADY_EXISTS on duplicate review', async () => {
    businessRepository.findById.mockResolvedValue({ businessId: 1, status: 'approved', ownerUserId: 2, deletedAt: null } as any)
    reviewRepository.findByWriterAndBusiness.mockResolvedValue({ reviewId: 3 } as any)

    await expect(useCase.execute({ currentUserId: 5, dto: { businessId: 1, overallRating: 4, content: 'Great experience and service', criteriaRatings: [{ criterionId: 1, ratingValue: 4 }] } })).rejects.toBeInstanceOf(ReviewAlreadyExistsException)
  })

  it('throws BUSINESS_NOT_APPROVED for non-approved business', async () => {
    businessRepository.findById.mockResolvedValue({ businessId: 1, status: 'pending', ownerUserId: 2, deletedAt: null } as any)

    await expect(useCase.execute({ currentUserId: 5, dto: { businessId: 1, overallRating: 4, content: 'Great experience and service', criteriaRatings: [{ criterionId: 1, ratingValue: 4 }] } })).rejects.toBeInstanceOf(BusinessNotApprovedException)
  })

  it('throws INVALID_CRITERION when criterion does not belong to business', async () => {
    businessRepository.findById.mockResolvedValue({ businessId: 1, status: 'approved', ownerUserId: 2, deletedAt: null } as any)
    reviewRepository.findByWriterAndBusiness.mockResolvedValue(null)
    reviewRepository.findBusinessCriteria.mockResolvedValue([{ criterionId: 1 }])

    await expect(useCase.execute({ currentUserId: 5, dto: { businessId: 1, overallRating: 4, content: 'Great experience and service', criteriaRatings: [{ criterionId: 9, ratingValue: 4 }] } })).rejects.toBeInstanceOf(InvalidCriterionException)
  })

  it('throws INVALID_RATING for overall rating out of range', async () => {
    businessRepository.findById.mockResolvedValue({ businessId: 1, status: 'approved', ownerUserId: 2, deletedAt: null } as any)
    reviewRepository.findByWriterAndBusiness.mockResolvedValue(null)
    reviewRepository.findBusinessCriteria.mockResolvedValue([{ criterionId: 1 }])

    await expect(useCase.execute({ currentUserId: 5, dto: { businessId: 1, overallRating: 6, content: 'Great experience and service', criteriaRatings: [{ criterionId: 1, ratingValue: 4 }] } })).rejects.toBeInstanceOf(InvalidRatingException)
  })
})
