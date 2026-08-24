import { Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { ReviewRepository } from '../modules/review/domain/repositories/review.repository'
import { SentimentService } from '../infrastructure/ml/sentiment.service'

const BATCH_SIZE = 10

@Injectable()
export class SentimentAnalysisJob {
  private readonly logger = new Logger(SentimentAnalysisJob.name)

  constructor(
    private readonly reviewRepository: ReviewRepository,
    private readonly sentimentService: SentimentService,
  ) {}

  @Cron('0 3 * * *')
  async handleCron() {
    this.logger.log('Starting sentiment analysis cron job')
    let analyzed = 0
    let failed = 0

    while (true) {
      const batch = await this.reviewRepository.findUnanalyzed(BATCH_SIZE)
      if (batch.length === 0) {
        break
      }

      let batchFailed = 0
      for (const review of batch) {
        const result = await this.sentimentService.analyze(review.content)
        if (!result) {
          batchFailed++
          failed++
          continue
        }
        await this.reviewRepository.updateSentiment(review.reviewId, {
          sentiment: result.type,
          sentimentScore: result.score,
          sentimentAnalyzedAt: new Date(),
        })
        analyzed++
      }

      if (batchFailed > 0) {
        this.logger.warn(`Stopping: ${batchFailed} review(s) failed sentiment analysis this batch (will retry next run)`)
        break
      }
      if (batch.length < BATCH_SIZE) {
        break
      }
    }

    this.logger.log(`Sentiment analysis cron job completed: ${analyzed} analyzed, ${failed} failed`)
  }
}
