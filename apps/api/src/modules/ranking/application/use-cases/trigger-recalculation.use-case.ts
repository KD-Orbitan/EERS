import { Injectable } from '@nestjs/common'
import { RankingCalculationService } from '../services/ranking-calculation.service'

@Injectable()
export class TriggerRecalculationUseCase {
  constructor(private readonly rankingCalculationService: RankingCalculationService) {}

  async execute() {
    await this.rankingCalculationService.execute()
    return { success: true }
  }
}
