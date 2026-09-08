import { Injectable } from '@nestjs/common'
import { RankingDbService } from '../../infrastructure/services/ranking-db.service'
import { ScoringConfig, ScoringConfigService } from '../../infrastructure/services/scoring-config.service'

@Injectable()
export class ReviewWeightingService {
  constructor(private readonly rankingDbService: RankingDbService, private readonly scoringConfigService: ScoringConfigService) {}

  private getFraudStatusWeight(status: string, suspiciousDelta: number): number {
    if (status === 'VALID') return 1.0
    if (status === 'SUSPICIOUS') return suspiciousDelta
    return 0.0
  }

  private getTimeDecay(createdAt: Date, lambda: number): number {
    const deltaMs = Date.now() - createdAt.getTime()
    const deltaDays = Math.max(0, deltaMs / (1000 * 60 * 60 * 24))
    return Math.exp(-lambda * deltaDays)
  }

  async computeWeight(review: { writerUserId: number; fraudStatus: string; createdAt: Date }, config?: ScoringConfig): Promise<number> {
    config ??= await this.scoringConfigService.getConfig()
    const Rs_i = this.getFraudStatusWeight(review.fraudStatus, config.suspiciousDelta)
    if (Rs_i === 0) return 0
    const trustScores = await this.rankingDbService.getUserTrustScoresByUserIds([review.writerUserId])
    const trust = trustScores[0]?.trustScore ?? 0.5
    const D_i = this.getTimeDecay(review.createdAt, config.timeDecayLambda)
    return Rs_i * (config.weightAlpha * trust + config.weightBeta + config.weightGamma * D_i)
  }
}
