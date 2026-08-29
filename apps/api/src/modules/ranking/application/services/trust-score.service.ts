import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../../infrastructure/database/prisma.service'
import { ScoringConfigService } from '../../infrastructure/services/scoring-config.service'

@Injectable()
export class TrustScoreService {
  constructor(private readonly prisma: PrismaService, private readonly scoringConfigService: ScoringConfigService) {}

  private sigmoid(x: number): number {
    return 1 / (1 + Math.exp(-x))
  }

  async computeAll(): Promise<void> {
    const config = await this.scoringConfigService.getConfig()
    const now = new Date()

    const users = await this.prisma.user.findMany({
      where: { deletedAt: null },
      select: { userId: true, createdAt: true },
    })

    const reviewCounts = await this.prisma.review.groupBy({
      by: ['writerUserId'],
      where: { status: 'approved', deletedAt: null },
      _count: { reviewId: true },
    })

    const fraudReviews = await this.prisma.reviewFraudScore.findMany({
      where: { fraudStatus: { in: ['REJECTED', 'SUSPICIOUS'] } },
      select: { review: { select: { writerUserId: true } } },
    })

    const fraudCountByUser = fraudReviews.reduce((map, item) => {
      const userId = Number(item.review.writerUserId)
      map.set(userId, (map.get(userId) ?? 0) + 1)
      return map
    }, new Map<number, number>())

    const reviewCountByUser = new Map<number, number>()
    reviewCounts.forEach((item) => reviewCountByUser.set(Number(item.writerUserId), item._count.reviewId))

    const upserts = users.map(async (user) => {
      const n = reviewCountByUser.get(Number(user.userId)) ?? 0
      const a = Math.floor((now.getTime() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24))
      const f = fraudCountByUser.get(Number(user.userId)) ?? 0
      const score = this.sigmoid(config.trustAlpha * Math.log(1 + n) + config.trustBeta * Math.log(1 + a) - config.trustGamma * f)

      await this.prisma.userTrustScore.upsert({
        where: { userId: user.userId },
        update: {
          trustScore: score,
          validReviews: n,
          accountAgeDays: a,
          flaggedCount: f,
        },
        create: {
          userId: user.userId,
          trustScore: score,
          validReviews: n,
          accountAgeDays: a,
          flaggedCount: f,
        },
      })
    })

    await Promise.all(upserts)
  }
}
