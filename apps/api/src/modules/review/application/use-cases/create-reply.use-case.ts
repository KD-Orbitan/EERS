import { Injectable, ForbiddenException } from '@nestjs/common'
import { ReviewRepository } from '../../domain/repositories/review.repository'
import { ReplyRepository } from '../../domain/repositories/reply.repository'
import { ReviewNotFoundException, ReplyAlreadyExistsException } from '../../domain/exceptions/review.exceptions'
import { GetBusinessSummaryUseCase } from '../../../business/application/use-cases/get-business-summary.use-case'
import { CreateNotificationUseCase } from '../../../notification/application/use-cases/create-notification.use-case'
import { NOTIFICATION_TYPE } from '@eers/shared-constants'

@Injectable()
export class CreateReplyUseCase {
  constructor(
    private readonly reviewRepository: ReviewRepository,
    private readonly replyRepository: ReplyRepository,
    private readonly getBusinessSummaryUseCase: GetBusinessSummaryUseCase,
    private readonly createNotificationUseCase: CreateNotificationUseCase,
  ) {}

  async execute({ reviewId, currentUserId, currentUserRole, dto }: { reviewId: number; currentUserId: number; currentUserRole: string; dto: { content: string } }) {
    const review = await this.reviewRepository.findById(reviewId)
    if (!review || review.deletedAt) {
      throw new ReviewNotFoundException()
    }

    if (currentUserRole !== 'BUSINESS_OWNER' && currentUserRole !== 'ADMIN') {
      throw new ForbiddenException('Forbidden')
    }

    const business = await this.getBusinessSummaryUseCase.execute(review.businessId)
    if (!business || business.ownerUserId !== currentUserId) {
      throw new ForbiddenException('Forbidden')
    }

    const existingReply = await this.replyRepository.findByReviewId(reviewId)
    if (existingReply) {
      throw new ReplyAlreadyExistsException()
    }

    const reply = await this.replyRepository.createReply({ reviewId, userId: currentUserId, content: dto.content })

    await this.createNotificationUseCase.execute({
      userId: review.writerUserId,
      type: NOTIFICATION_TYPE.NEW_REPLY,
      targetPath: `/businesses/${review.businessId}/reviews?reviewId=${reviewId}`,
      title: 'New Reply',
      content: 'The business owner replied to your review.',
    })

    return reply
  }
}
