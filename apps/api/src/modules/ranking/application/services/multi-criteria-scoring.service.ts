import { Injectable } from '@nestjs/common'
import { RankingDbService } from '../../infrastructure/services/ranking-db.service'

@Injectable()
export class MultiCriteriaScoringService {
  constructor(private readonly rankingDbService: RankingDbService) {}

  private normalizeRating(ratingValue: number): number {
    return (ratingValue - 1) / (5 - 1)
  }

  async computeScore(reviewId: number, categoryIds: number[]): Promise<number> {
    const criteria = await this.rankingDbService.getReviewCriteriaByReviewIds([reviewId])
    const weights = await this.rankingDbService.getCriterionWeightsByCategoryIds(categoryIds)

    const weightMap = new Map<number, number[]>()
    for (const weight of weights) {
      if (!weightMap.has(weight.criterionId)) {
        weightMap.set(weight.criterionId, [])
      }
      weightMap.get(weight.criterionId)!.push(weight.weight)
    }

    let sumWeighted = 0
    let sumWeights = 0

    for (const criterion of criteria) {
      const rawWeights = weightMap.get(criterion.criterionId) ?? []
      const weight = rawWeights.length > 0 ? rawWeights.reduce((acc, value) => acc + value, 0) / rawWeights.length : 1.0
      const normalizedRating = this.normalizeRating(criterion.ratingValue)
      sumWeighted += weight * normalizedRating
      sumWeights += weight
    }

    const S_i = sumWeights > 0 ? sumWeighted / sumWeights : 0

    return S_i
  }
}
