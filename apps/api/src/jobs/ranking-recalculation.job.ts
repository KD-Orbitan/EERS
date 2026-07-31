import { Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { PrismaService } from '../infrastructure/database/prisma.service'
import { RankingCalculationService } from '../modules/ranking/application/services/ranking-calculation.service'

@Injectable()
export class RankingRecalculationJob {
  private readonly logger = new Logger(RankingRecalculationJob.name)

  constructor(private readonly rankingCalculationService: RankingCalculationService, private readonly prisma: PrismaService) {}

  @Cron('0 * * * *')
  async handleCron() {
    this.logger.log('Starting ranking recalculation cron job')
    await this.rankingCalculationService.execute()
    await this.prisma.log.create({
      data: {
        action: 'RANKING_RECALCULATED',
        entityType: 'System',
      },
    })
    this.logger.log('Ranking recalculation cron job completed')
  }
}
