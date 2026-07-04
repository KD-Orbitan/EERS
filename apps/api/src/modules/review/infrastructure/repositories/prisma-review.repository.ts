import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../../infrastructure/database/prisma.service'
import { ReviewRepository } from '../../domain/repositories/review.repository'

@Injectable()
export class PrismaReviewRepository extends ReviewRepository {
  constructor(private readonly prisma: PrismaService) {
    super()
  }

  async findById(reviewId: number) {
    const review = await this.prisma.review.findFirst({
      where: { reviewId: BigInt(reviewId), deletedAt: null },
    })
    return review ? this.mapToEntity(review) : null
  }

  async findByWriterAndBusiness(writerUserId: number, businessId: number) {
    const review = await this.prisma.review.findFirst({
      where: { writerUserId: BigInt(writerUserId), businessId: BigInt(businessId), deletedAt: null },
    })
    return review ? this.mapToEntity(review) : null
  }

  async findBusinessById(businessId: number) {
    const business = await this.prisma.business.findFirst({
      where: { businessId: BigInt(businessId), deletedAt: null },
      select: { businessId: true, status: true, ownerUserId: true, deletedAt: true },
    })
    return business ? { businessId: Number(business.businessId), status: business.status, ownerUserId: Number(business.ownerUserId), deletedAt: business.deletedAt } : null
  }

  async findBusinessCriteria(businessId: number) {
    const rows = await this.prisma.categoryCriterion.findMany({
      where: {
        category: {
          businessCategories: {
            some: { businessId: BigInt(businessId) },
          },
        },
      },
      select: { criterionId: true },
    })
    return rows.map((row) => ({ criterionId: row.criterionId }))
  }

  async createReviewWithCriteria(params) {
    const result = await this.prisma.$transaction(async (tx) => {
      const createdReview = await tx.review.create({
        data: {
          writerUserId: BigInt(params.writerUserId),
          businessId: BigInt(params.businessId),
          overallRating: params.overallRating,
          content: params.content,
          status: 'pending',
          sentiment: null,
        },
      })
      await Promise.all(
        params.criteriaRatings.map((entry) =>
          tx.reviewCriterion.create({
            data: {
              reviewId: createdReview.reviewId,
              criterionId: entry.criterionId,
              ratingValue: entry.ratingValue,
            },
          }),
        ),
      )
      return { reviewId: Number(createdReview.reviewId), status: createdReview.status }
    })
    return result
  }

  async updateReviewWithCriteria(reviewId: number, params) {
    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.review.update({
        where: { reviewId: BigInt(reviewId) },
        data: {
          ...(params.overallRating !== undefined ? { overallRating: params.overallRating } : {}),
          ...(params.content !== undefined ? { content: params.content } : {}),
          status: 'pending',
        },
      })
      if (params.criteriaRatings) {
        await tx.reviewCriterion.deleteMany({ where: { reviewId: BigInt(reviewId) } })
        await Promise.all(
          params.criteriaRatings.map((entry) =>
            tx.reviewCriterion.create({
              data: {
                reviewId: BigInt(reviewId),
                criterionId: entry.criterionId,
                ratingValue: entry.ratingValue,
              },
            }),
          ),
        )
      }
      return { reviewId, status: 'pending' }
    })
    return updated
  }

  async softDeleteReview(reviewId: number) {
    await this.prisma.review.updateMany({
      where: { reviewId: BigInt(reviewId), deletedAt: null },
      data: { deletedAt: new Date() },
    })
  }

  async listByBusiness(businessId: number, options) {
    const where: any = {
      businessId: BigInt(businessId),
      deletedAt: null,
    }
    if (!options.admin) {
      where.status = { in: ['approved', 'pending'] }
    } else if (options.status) {
      where.status = options.status
    }
    if (options.rating) {
      where.overallRating = options.rating
    }

    const reviews = await this.prisma.review.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (options.page - 1) * options.limit,
      take: options.limit,
      include: {
        writer: true,
        reviewCriteria: { include: { criterion: true } },
        replies: { take: 1, orderBy: { createdAt: 'desc' } },
      },
    })

    return reviews.map((review) => ({
      reviewId: Number(review.reviewId),
      overallRating: review.overallRating,
      content: review.content,
      status: review.status,
      sentiment: review.sentiment,
      author: { userId: Number(review.writer.userId), name: review.writer.name },
      criteriaRatings: review.reviewCriteria.map((item) => ({ criterionId: item.criterion.criterionId, criterionName: item.criterion.name, ratingValue: item.ratingValue })),
      reply: review.replies[0]
        ? { replyId: Number(review.replies[0].replyId), content: review.replies[0].content, createdAt: review.replies[0].createdAt.toISOString() }
        : null,
      createdAt: review.createdAt.toISOString(),
    }))
  }

  async listByUser(userId: number, page: number, limit: number) {
    const reviews = await this.prisma.review.findMany({
      where: { writerUserId: BigInt(userId), deletedAt: null },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: { business: true },
    })
    return reviews.map((review) => ({
      reviewId: Number(review.reviewId),
      overallRating: review.overallRating,
      status: review.status,
      business: { businessId: Number(review.business.businessId), name: review.business.name },
      createdAt: review.createdAt.toISOString(),
    }))
  }

  async getReviewDetail(reviewId: number, options?: { admin?: boolean }) {
    const review = await this.prisma.review.findFirst({
      where: { reviewId: BigInt(reviewId), deletedAt: null },
      include: {
        writer: true,
        business: true,
        reviewCriteria: { include: { criterion: true } },
        replies: { take: 1, orderBy: { createdAt: 'desc' } },
      },
    })
    if (!review) {
      return null
    }
    return {
      reviewId: Number(review.reviewId),
      overallRating: review.overallRating,
      content: review.content,
      status: review.status,
      sentiment: review.sentiment,
      author: { userId: Number(review.writer.userId), name: review.writer.name },
      business: { businessId: Number(review.business.businessId), name: review.business.name },
      criteriaRatings: review.reviewCriteria.map((item) => ({ criterionId: item.criterion.criterionId, criterionName: item.criterion.name, ratingValue: item.ratingValue })),
      reply: review.replies[0]
        ? { replyId: Number(review.replies[0].replyId), content: review.replies[0].content, createdAt: review.replies[0].createdAt.toISOString() }
        : null,
      createdAt: review.createdAt.toISOString(),
      updatedAt: review.updatedAt.toISOString(),
    }
  }

  async getReviewStatistics(businessId: number) {
    const [reviewCount, grouped] = await Promise.all([
      this.prisma.review.count({ where: { businessId: BigInt(businessId), status: 'approved', deletedAt: null } }),
      this.prisma.review.groupBy({ by: ['overallRating'], where: { businessId: BigInt(businessId), status: 'approved', deletedAt: null }, _count: { overallRating: true } }),
    ])
    const avg = await this.prisma.review.aggregate({
      where: { businessId: BigInt(businessId), status: 'approved', deletedAt: null },
      _avg: { overallRating: true },
    })
    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    grouped.forEach((item) => {
      ratingDistribution[item.overallRating] = item._count.overallRating
    })
    return { reviewCount, avgRating: Number(avg._avg.overallRating ?? 0), ratingDistribution }
  }

  async getApprovedReviews() {
    const reviews = await this.prisma.review.findMany({ where: { status: 'approved', deletedAt: null }, select: { reviewId: true, businessId: true, overallRating: true, content: true } })
    return reviews.map((review) => ({ reviewId: Number(review.reviewId), businessId: Number(review.businessId), overallRating: review.overallRating, content: review.content }))
  }

  private mapToEntity(review: any) {
    return {
      reviewId: Number(review.reviewId),
      content: review.content,
      overallRating: review.overallRating,
      sentiment: review.sentiment,
      status: review.status,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
      deletedAt: review.deletedAt,
      writerUserId: Number(review.writerUserId),
      businessId: Number(review.businessId),
      managedByUserId: review.managedByUserId ? Number(review.managedByUserId) : null,
    }
  }
}
