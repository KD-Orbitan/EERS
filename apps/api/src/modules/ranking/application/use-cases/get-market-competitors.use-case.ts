import { Injectable } from '@nestjs/common'
import { RankingQueryRepository } from '../ports/ranking-query.repository'

@Injectable()
export class GetMarketCompetitorsUseCase {
  constructor(private readonly repository: RankingQueryRepository) {}

  async execute({ businessId, categoryId, limit = 5 }: { businessId: number; categoryId?: number; limit?: number }) {
    const normalizedLimit = Math.min(Math.max(limit, 1), 20)

    const ownCategorySnapshots = await this.repository.getBusinessCategoryRanks(businessId)

    const emptyResult = { categoryId: null, categoryName: null, businessRank: null, competitors: [] as Array<{ businessId: number; businessName: string; rank: number; rankingScore: number; avgRating: number }> }

    if (ownCategorySnapshots.length === 0) {
      return emptyResult
    }

    const target = categoryId
      ? ownCategorySnapshots.find((snapshot) => Number(snapshot.scopeId) === categoryId)
      : ownCategorySnapshots[0]

    if (!target || target.scopeId === null) {
      return emptyResult
    }

    const targetCategoryId = Number(target.scopeId)

    const [categoryName, categorySnapshots] = await Promise.all([
      this.repository.getCategoryName(targetCategoryId),
      this.repository.getCategoryCompetitors(targetCategoryId, businessId),
    ])

    const competitors = categorySnapshots
      .map((snapshot) => ({
        businessId: Number(snapshot.businessId),
        businessName: snapshot.businessName,
        rank: snapshot.rank,
        rankingScore: Number(snapshot.rankingScore),
        avgRating: Number(snapshot.avgRating),
        distance: Math.abs(snapshot.rank - target.rank),
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, normalizedLimit)
      .map(({ distance, ...item }) => item)

    return {
      categoryId: targetCategoryId,
      categoryName,
      businessRank: target.rank,
      competitors,
    }
  }
}
