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

  async updateSentiment(reviewId: number, result: { sentiment: string; sentimentScore: number; sentimentAnalyzedAt: Date }) {
    await this.prisma.review.update({
      where: { reviewId: BigInt(reviewId) },
      data: {
        sentiment: result.sentiment as any,
        sentimentScore: result.sentimentScore,
        sentimentAnalyzedAt: result.sentimentAnalyzedAt,
      },
    })
  }

  async findUnanalyzed(limit: number) {
    const reviews = await this.prisma.review.findMany({
      where: { sentimentAnalyzedAt: null, deletedAt: null },
      select: { reviewId: true, content: true },
      take: limit,
    })
    return reviews.map((review) => ({ reviewId: Number(review.reviewId), content: review.content }))
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

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (options.page - 1) * options.limit,
        take: options.limit,
        include: {
          writer: true,
          reviewCriteria: { include: { criterion: true } },
          replies: { take: 1, orderBy: { createdAt: 'desc' } },
          images: { where: { imageType: 'REVIEW_PHOTO' } },
        },
      }),
      this.prisma.review.count({ where }),
    ])

    return {
      items: reviews.map((review) => ({
        reviewId: Number(review.reviewId),
        overallRating: review.overallRating,
        content: review.content,
        status: review.status,
        sentiment: review.sentiment,
        author: { userId: Number(review.writer.userId), name: review.writer.name },
        criteriaRatings: review.reviewCriteria.map((item) => ({ criterionId: item.criterion.criterionId, criterionName: item.criterion.name, ratingValue: item.ratingValue })),
        photos: review.images.map((image) => ({ imageId: Number(image.imageId), url: image.secureUrl })),
        reply: review.replies[0]
          ? { replyId: Number(review.replies[0].replyId), content: review.replies[0].content, createdAt: review.replies[0].createdAt.toISOString() }
          : null,
        createdAt: review.createdAt.toISOString(),
      })),
      total,
    }
  }

  async listByUser(userId: number, page: number, limit: number) {
    const where = { writerUserId: BigInt(userId), deletedAt: null }
    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { business: true },
      }),
      this.prisma.review.count({ where }),
    ])
    return {
      items: reviews.map((review) => ({
        reviewId: Number(review.reviewId),
        overallRating: review.overallRating,
        status: review.status,
        business: { businessId: Number(review.business.businessId), name: review.business.name },
        createdAt: review.createdAt.toISOString(),
      })),
      total,
    }
  }

  async getReviewDetail(reviewId: number, options?: { admin?: boolean }) {
    const review = await this.prisma.review.findFirst({
      where: { reviewId: BigInt(reviewId), deletedAt: null },
      include: {
        writer: true,
        business: true,
        reviewCriteria: { include: { criterion: true } },
        replies: { take: 1, orderBy: { createdAt: 'desc' } },
        images: { where: { imageType: 'REVIEW_PHOTO' } },
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
      photos: review.images.map((image) => ({ imageId: Number(image.imageId), url: image.secureUrl })),
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

  async getSentimentSummary(businessId: number) {
    const grouped = await this.prisma.review.groupBy({
      by: ['sentiment'],
      where: { businessId: BigInt(businessId), status: 'approved', deletedAt: null, sentiment: { not: null } },
      _count: { sentiment: true },
    })

    const counts = { positive: 0, neutral: 0, negative: 0 }
    grouped.forEach((item) => {
      if (item.sentiment) {
        counts[item.sentiment] = item._count.sentiment
      }
    })

    const totalReviews = counts.positive + counts.neutral + counts.negative
    if (totalReviews === 0) {
      return { positive: 0, neutral: 0, negative: 0, totalReviews: 0 }
    }

    return {
      positive: Math.round((counts.positive / totalReviews) * 100),
      neutral: Math.round((counts.neutral / totalReviews) * 100),
      negative: Math.round((counts.negative / totalReviews) * 100),
      totalReviews,
    }
  }

  async getCriteriaScores(businessId: number) {
    const [categoryCriteria, grouped] = await Promise.all([
      this.prisma.categoryCriterion.findMany({
        where: { category: { businessCategories: { some: { businessId: BigInt(businessId) } } } },
        include: { criterion: true },
      }),
      this.prisma.reviewCriterion.groupBy({
        by: ['criterionId'],
        where: { review: { businessId: BigInt(businessId), status: 'approved', deletedAt: null } },
        _avg: { ratingValue: true },
        _count: { ratingValue: true },
      }),
    ])

    const statsByCriterion = new Map(grouped.map((row) => [row.criterionId, row]))
    const seen = new Set<number>()
    const items: { criterionId: number; criterionName: string; avgRating: number; reviewCount: number }[] = []

    for (const row of categoryCriteria) {
      if (seen.has(row.criterionId)) continue
      seen.add(row.criterionId)
      const stats = statsByCriterion.get(row.criterionId)
      items.push({
        criterionId: row.criterionId,
        criterionName: row.criterion.name,
        avgRating: stats?._avg.ratingValue ? Number(stats._avg.ratingValue.toFixed(2)) : 0,
        reviewCount: stats?._count.ratingValue ?? 0,
      })
    }

    return items
  }

  async getApprovedReviews() {
    const reviews = await this.prisma.review.findMany({ where: { status: 'approved', deletedAt: null }, select: { reviewId: true, businessId: true, overallRating: true, content: true } })
    return reviews.map((review) => ({ reviewId: Number(review.reviewId), businessId: Number(review.businessId), overallRating: review.overallRating, content: review.content }))
  }

  async getRecentReviews(limit: number) {
    const reviews = await this.prisma.review.findMany({
      where: { status: 'approved', deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { writer: true, business: true },
    })
    return reviews.map((review) => ({
      reviewId: Number(review.reviewId),
      overallRating: review.overallRating,
      content: review.content,
      author: { name: review.writer.name },
      business: { businessId: Number(review.business.businessId), name: review.business.name },
      createdAt: review.createdAt.toISOString(),
    }))
  }

  private mapToEntity(review: any) {
    return {
      reviewId: Number(review.reviewId),
      content: review.content,
      overallRating: review.overallRating,
      sentiment: review.sentiment,
      sentimentScore: review.sentimentScore ? Number(review.sentimentScore) : null,
      sentimentAnalyzedAt: review.sentimentAnalyzedAt,
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
