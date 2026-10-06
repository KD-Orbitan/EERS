import { Injectable } from '@nestjs/common'
import { RankingRepository } from '../ports/ranking.repository'
import { ScoringConfig, ScoringConfigPort } from '../ports/scoring-config.port'

@Injectable()
export class TrustScoreService {
  constructor(private readonly repository: RankingRepository, private readonly scoringConfigService: ScoringConfigPort) {}

  private sigmoid(x: number): number {
    return 1 / (1 + Math.exp(-x))
  }

  async computeAll(config?: ScoringConfig): Promise<void> {
    config ??= await this.scoringConfigService.getConfig()
    const now = new Date()

    const users = await this.repository.getAllUsers()
    const reviewCountByUser = await this.repository.getApprovedReviewCountsByUser()
    // Only moderation decisions affect trust, never automatic fraud labels.
    const fraudCountByUser = await this.repository.getFlaggedReviewCountsByUser()

    const upserts = users.map(async (user) => {
      const n = reviewCountByUser.get(Number(user.userId)) ?? 0
      const a = Math.max(0, Math.floor((now.getTime() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)))
      const f = fraudCountByUser.get(Number(user.userId)) ?? 0
      const score = this.sigmoid(config.trustAlpha * Math.log(1 + n) + config.trustBeta * Math.log(1 + a) - config.trustGamma * f)

      await this.repository.upsertUserTrustScore({
        userId: user.userId, trustScore: score, validReviews: n, accountAgeDays: a, flaggedCount: f,
      })
    })

    await Promise.all(upserts)
  }
}
