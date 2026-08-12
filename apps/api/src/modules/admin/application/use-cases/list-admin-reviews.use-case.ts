import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../../infrastructure/database/prisma.service'

@Injectable()
export class ListAdminReviewsUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute({ status = 'pending', page = 1, limit = 20 }: { status?: string; page?: number; limit?: number }) {
    const where = {
      deletedAt: null,
      status: status as 'pending' | 'approved' | 'rejected' | 'hidden',
    }

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        include: { business: true, writer: true },
        orderBy: { createdAt: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.review.count({ where }),
    ])

    const items = reviews.map((review) => ({
      reviewId: Number(review.reviewId),
      overallRating: review.overallRating,
      content: review.content,
      status: review.status,
      businessId: Number(review.businessId),
      businessName: review.business.name,
      authorName: review.writer.name,
      createdAt: review.createdAt.toISOString(),
    }))

    return { items, total }
  }
}
