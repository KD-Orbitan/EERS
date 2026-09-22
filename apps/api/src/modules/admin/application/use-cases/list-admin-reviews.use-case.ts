import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../../infrastructure/database/prisma.service'

@Injectable()
export class ListAdminReviewsUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute({ status = 'pending', search, page = 1, limit = 20 }: { status?: string; search?: string; page?: number; limit?: number }) {
    const where = {
      deletedAt: null,
      ...(search?.trim() ? { OR: [
        { content: { contains: search.trim(), mode: 'insensitive' as const } },
        { business: { name: { contains: search.trim(), mode: 'insensitive' as const } } },
        { writer: { name: { contains: search.trim(), mode: 'insensitive' as const } } },
        { writer: { email: { contains: search.trim(), mode: 'insensitive' as const } } },
      ] } : {}),
      status: status as 'pending' | 'approved' | 'rejected' | 'hidden',
    }

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        include: { business: true, writer: true, managedBy: { select: { userId: true, name: true } } },
        orderBy: [{ createdAt: 'asc' }, { reviewId: 'asc' }],
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
      managedBy: review.managedBy ? { userId: Number(review.managedBy.userId), name: review.managedBy.name } : null,
      moderatedAt: review.moderatedAt?.toISOString() ?? null,
      moderationReason: review.moderationReason,
    }))

    return { items, total }
  }
}
