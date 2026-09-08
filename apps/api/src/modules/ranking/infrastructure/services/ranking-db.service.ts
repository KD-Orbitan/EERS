import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../../infrastructure/database/prisma.service'

export type ApprovedBusinessRecord = {
  businessId: number
  categoryIds: number[]
  province: string | null
  avgRating: number
}

export type ApprovedReviewRecord = {
  reviewId: number
  businessId: number
  writerUserId: number
  content: string
  overallRating: number
  createdAt: Date
}

export type ReviewCriterionRecord = {
  reviewId: number
  criterionId: number
  ratingValue: number
}

export type CriterionWeightRecord = {
  categoryId: number
  criterionId: number
  weight: number
}

export type UserTrustScoreRecord = {
  userId: number
  trustScore: number
}

@Injectable()
export class RankingDbService {
  constructor(private readonly prisma: PrismaService) {}

  async getApprovedBusinesses(): Promise<ApprovedBusinessRecord[]> {
    const businesses = await this.prisma.business.findMany({
      where: { status: 'approved', deletedAt: null },
      include: {
        businessCategories: { include: { category: true } },
        locations: { include: { location: true } },
      },
    })

    return businesses.map((business) => ({
      businessId: Number(business.businessId),
      categoryIds: business.businessCategories.map((bc) => Number(bc.category.categoryId)),
      province: business.locations[0]?.location?.province ?? null,
      avgRating: Number(business.avgRating),
    }))
  }

  async getApprovedReviewsByBusinessIds(businessIds: number[]): Promise<ApprovedReviewRecord[]> {
    const reviews = await this.prisma.review.findMany({
      where: { businessId: { in: businessIds.map((id) => BigInt(id)) }, status: 'approved', deletedAt: null },
      select: {
        reviewId: true,
        businessId: true,
        writerUserId: true,
        content: true,
        overallRating: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    })

    return reviews.map((review) => ({
      reviewId: Number(review.reviewId),
      businessId: Number(review.businessId),
      writerUserId: Number(review.writerUserId),
      content: review.content,
      overallRating: review.overallRating,
      createdAt: review.createdAt,
    }))
  }

  async getReviewCriteriaByReviewIds(reviewIds: number[]): Promise<ReviewCriterionRecord[]> {
    const criteria = await this.prisma.reviewCriterion.findMany({
      where: { reviewId: { in: reviewIds.map((id) => BigInt(id)) } },
      select: { reviewId: true, criterionId: true, ratingValue: true },
    })

    return criteria.map((item) => ({
      reviewId: Number(item.reviewId),
      criterionId: item.criterionId,
      ratingValue: item.ratingValue,
    }))
  }

  async getCriterionWeightsByCategoryIds(categoryIds: number[]): Promise<CriterionWeightRecord[]> {
    const weights = await this.prisma.criterionWeight.findMany({
      where: { categoryId: { in: categoryIds } },
      select: { categoryId: true, criterionId: true, weight: true },
    })
    return weights.map((item) => ({ categoryId: item.categoryId, criterionId: item.criterionId, weight: Number(item.weight) }))
  }

  async getUserTrustScoresByUserIds(userIds: number[]): Promise<UserTrustScoreRecord[]> {
    const scores = await this.prisma.userTrustScore.findMany({
      where: { userId: { in: userIds.map((id) => BigInt(id)) } },
      select: { userId: true, trustScore: true },
    })
    return scores.map((item) => ({ userId: Number(item.userId), trustScore: Number(item.trustScore) }))
  }

  async getAllUsers(): Promise<Array<{ userId: number; createdAt: Date }>> {
    const users = await this.prisma.user.findMany({ where: { deletedAt: null }, select: { userId: true, createdAt: true } })
    return users.map((user) => ({ userId: Number(user.userId), createdAt: user.createdAt }))
  }

  async getApprovedReviewCountsByUser(): Promise<Map<number, number>> {
    const groups = await this.prisma.review.groupBy({
      by: ['writerUserId'],
      where: { status: 'approved', deletedAt: null },
      _count: { reviewId: true },
    })
    const map = new Map<number, number>()
    groups.forEach((item) => map.set(Number(item.writerUserId), item._count.reviewId))
    return map
  }

  async getFlaggedReviewCountsByUser(): Promise<Map<number, number>> {
    const groups = await this.prisma.review.groupBy({
      by: ['writerUserId'],
      where: {
        status: 'rejected',
        deletedAt: null,
      },
      _count: { reviewId: true },
    })
    const map = new Map<number, number>()
    groups.forEach((item) => map.set(Number(item.writerUserId), item._count.reviewId))
    return map
  }

  async upsertUserTrustScore(params: {
    userId: number
    trustScore: number
    validReviews: number
    accountAgeDays: number
    flaggedCount: number
  }): Promise<void> {
    await this.prisma.userTrustScore.upsert({
      where: { userId: BigInt(params.userId) },
      create: {
        userId: BigInt(params.userId),
        trustScore: params.trustScore,
        validReviews: params.validReviews,
        accountAgeDays: params.accountAgeDays,
        flaggedCount: params.flaggedCount,
      },
      update: {
        trustScore: params.trustScore,
        validReviews: params.validReviews,
        accountAgeDays: params.accountAgeDays,
        flaggedCount: params.flaggedCount,
      },
    })
  }

  async upsertReviewFraudScore(params: {
    reviewId: number
    fraudScore: number
    duplicateSignal: number
    spamSignal: number
    trustSignal: number
    fraudStatus: string
  }): Promise<void> {
    await this.prisma.reviewFraudScore.upsert({
      where: { reviewId: BigInt(params.reviewId) },
      create: {
        reviewId: BigInt(params.reviewId),
        fraudScore: params.fraudScore,
        duplicateSignal: params.duplicateSignal,
        spamSignal: params.spamSignal,
        trustSignal: params.trustSignal,
        fraudStatus: params.fraudStatus,
      },
      update: {
        fraudScore: params.fraudScore,
        duplicateSignal: params.duplicateSignal,
        spamSignal: params.spamSignal,
        trustSignal: params.trustSignal,
        fraudStatus: params.fraudStatus,
      },
    })
  }

  async deleteAllRankingSnapshots(): Promise<void> {
    await this.prisma.rankingSnapshot.deleteMany({})
  }

  async createRankingSnapshots(snapshots: Array<{
    scope: string
    scopeId: number | null
    rank: number
    rankingScore: number
    avgRating: number
    reviewCount: number
    businessId: number
  }>): Promise<void> {
    await this.prisma.rankingSnapshot.createMany({
      data: snapshots.map((item) => ({
        scope: item.scope,
        scopeId: item.scopeId === null ? null : BigInt(item.scopeId),
        rank: item.rank,
        rankingScore: item.rankingScore,
        avgRating: item.avgRating,
        reviewCount: item.reviewCount,
        businessId: BigInt(item.businessId),
      })),
    })
  }

  async updateBusinessAvgRating(businessId: number, avgRating: number): Promise<void> {
    await this.prisma.business.updateMany({
      where: { businessId: BigInt(businessId), deletedAt: null },
      data: { avgRating },
    })
  }
}
