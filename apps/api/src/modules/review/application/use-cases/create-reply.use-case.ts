import { Injectable, ForbiddenException } from '@nestjs/common'
import { ReviewRepository } from '../../domain/repositories/review.repository'
import { ReplyRepository } from '../../domain/repositories/reply.repository'
import { ReviewNotFoundException, ReplyAlreadyExistsException } from '../../domain/exceptions/review.exceptions'
import { BusinessRepository } from '../../../business/domain/repositories/business.repository'
import { PrismaService } from '../../../../infrastructure/database/prisma.service'

@Injectable()
export class CreateReplyUseCase {
  constructor(
    private readonly reviewRepository: ReviewRepository,
    private readonly replyRepository: ReplyRepository,
    private readonly businessRepository: BusinessRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute({ reviewId, currentUserId, currentUserRole, dto }: { reviewId: number; currentUserId: number; currentUserRole: string; dto: { content: string } }) {
    const review = await this.reviewRepository.findById(reviewId)
    if (!review || review.deletedAt) {
      throw new ReviewNotFoundException()
    }

    if (currentUserRole !== 'BUSINESS_OWNER' && currentUserRole !== 'ADMIN') {
      throw new ForbiddenException('Forbidden')
    }

    const business = await this.businessRepository.findById(review.businessId)
    if (!business || business.ownerUserId !== currentUserId) {
      throw new ForbiddenException('Forbidden')
    }

    const existingReply = await this.replyRepository.findByReviewId(reviewId)
    if (existingReply) {
      throw new ReplyAlreadyExistsException()
    }

    return this.prisma.$transaction(async () => {
      return this.replyRepository.createReply({ reviewId, userId: currentUserId, content: dto.content })
    })
  }
}
