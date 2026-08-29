import { Injectable } from '@nestjs/common'
import { ReviewRepository } from '../../domain/repositories/review.repository'
import { ReviewAlreadyExistsException, InvalidRatingException, InvalidCriterionException } from '../../domain/exceptions/review.exceptions'
import { BusinessNotApprovedException, BusinessNotFoundException } from '../../../business/domain/exceptions/business.exceptions'
import { BusinessRepository } from '../../../business/domain/repositories/business.repository'
import { PrismaService } from '../../../../infrastructure/database/prisma.service'
import { CreateNotificationUseCase } from '../../../notification/application/use-cases/create-notification.use-case'
import { NOTIFICATION_TYPE } from '@eers/shared-constants'

@Injectable()
export class CreateReviewUseCase {
  constructor(
    private readonly reviewRepository: ReviewRepository,
    private readonly businessRepository: BusinessRepository,
    private readonly prisma: PrismaService,
    private readonly createNotificationUseCase: CreateNotificationUseCase,
  ) {}

  async execute({ currentUserId, dto }: { currentUserId: number; dto: { businessId: number; overallRating: number; content: string; criteriaRatings: Array<{ criterionId: number; ratingValue: number }> } }) {
    const business = await this.businessRepository.findById(dto.businessId)
    if (!business) {
      throw new BusinessNotFoundException()
    }
    if (business.status !== 'approved') {
      throw new BusinessNotApprovedException()
    }

    const existing = await this.reviewRepository.findByWriterAndBusiness(currentUserId, dto.businessId)
    if (existing) {
      throw new ReviewAlreadyExistsException()
    }

    if (!Number.isInteger(dto.overallRating) || dto.overallRating < 1 || dto.overallRating > 5) {
      throw new InvalidRatingException()
    }

    const validCriteria = await this.reviewRepository.findBusinessCriteria(dto.businessId)
    const validCriterionIds = new Set(validCriteria.map((item) => item.criterionId))
    for (const criterion of dto.criteriaRatings) {
      if (!validCriterionIds.has(criterion.criterionId)) {
        throw new InvalidCriterionException()
      }
      if (!Number.isInteger(criterion.ratingValue) || criterion.ratingValue < 1 || criterion.ratingValue > 5) {
        throw new InvalidRatingException()
      }
    }

    const review = await this.reviewRepository.createReviewWithCriteria({
      writerUserId: currentUserId,
      businessId: dto.businessId,
      overallRating: dto.overallRating,
      content: dto.content,
      criteriaRatings: dto.criteriaRatings,
    })

    if (business.ownerUserId !== null) {
      await this.createNotificationUseCase.execute({
        userId: business.ownerUserId,
        type: NOTIFICATION_TYPE.NEW_REVIEW,
        title: 'New Review',
        content: `Your business "${business.name}" received a new review.`,
      })
    }

    return review
  }
}
