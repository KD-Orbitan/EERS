import { Injectable } from '@nestjs/common'
import { RankingQueryRepository } from '../ports/ranking-query.repository'

@Injectable()
export class GetRankingMetadataUseCase {
  constructor(private readonly repository: RankingQueryRepository) {}

  async execute() {
    const { lastCalculatedAt, totalRankedBusinesses } = await this.repository.getMetadata()

    return {
      lastCalculatedAt: lastCalculatedAt?.toISOString() ?? null,
      totalRankedBusinesses,
    }
  }
}
