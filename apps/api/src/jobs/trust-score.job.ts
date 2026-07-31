import { Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { TrustScoreService } from '../modules/ranking/application/services/trust-score.service'

@Injectable()
export class TrustScoreJob {
  private readonly logger = new Logger(TrustScoreJob.name)

  constructor(private readonly trustScoreService: TrustScoreService) {}

  @Cron('0 2 * * *')
  async handleCron() {
    this.logger.log('Starting trust score cron job')
    await this.trustScoreService.computeAll()
    this.logger.log('Trust score cron job completed')
  }
}
