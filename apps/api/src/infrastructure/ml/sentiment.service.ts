import { Injectable, Logger, OnModuleInit } from '@nestjs/common'

import { SentimentAnalyzer, type SentimentLabel, type SentimentAnalysisResult } from '../../common/ports/sentiment-analyzer.port'
export type { SentimentLabel, SentimentAnalysisResult } from '../../common/ports/sentiment-analyzer.port'

const MODEL_NAME = 'Xenova/mDeBERTa-v3-base-xnli-multilingual-nli-2mil7'
const LABELS: SentimentLabel[] = ['positive', 'negative', 'neutral']
const HYPOTHESIS_TEMPLATE = 'This review is {}'
const SLOW_INFERENCE_THRESHOLD_MS = 5000

@Injectable()
export class SentimentService extends SentimentAnalyzer implements OnModuleInit {
  private readonly logger = new Logger(SentimentService.name)
  private classifier: ((text: string, labels: string[], options: { hypothesis_template: string }) => Promise<{ labels: string[]; scores: number[] }>) | null = null
  private loadFailed = false
  // Toggle for hosts too memory-constrained to load the model (e.g. Render
  // free tier's 512MB cap) — set SENTIMENT_MODEL_ENABLED=false there.
  private readonly modelDisabled = process.env.SENTIMENT_MODEL_ENABLED === 'false'

  async onModuleInit() {
    if (this.modelDisabled) {
      this.logger.warn('Sentiment model disabled via SENTIMENT_MODEL_ENABLED=false — sentiment analysis will be skipped')
      return
    }
    await this.init()
  }

  async init(): Promise<void> {
    if (this.classifier || this.loadFailed || this.modelDisabled) {
      return
    }
    try {
      this.logger.log(`Loading sentiment model "${MODEL_NAME}"...`)
      const startedAt = Date.now()
      const { pipeline } = await import('@xenova/transformers')
      this.classifier = (await pipeline('zero-shot-classification', MODEL_NAME)) as unknown as typeof this.classifier
      this.logger.log(`Sentiment model loaded in ${Date.now() - startedAt}ms`)
    } catch (error) {
      this.loadFailed = true
      this.logger.error('Failed to load sentiment model — sentiment analysis will be skipped', error instanceof Error ? error.stack : String(error))
    }
  }

  async analyze(text: string): Promise<SentimentAnalysisResult | null> {
    if (!this.classifier && !this.loadFailed) {
      await this.init()
    }
    if (!this.classifier) {
      return null
    }

    const startedAt = Date.now()
    try {
      const result = await this.classifier(text, LABELS, { hypothesis_template: HYPOTHESIS_TEMPLATE })
      const elapsedMs = Date.now() - startedAt
      if (elapsedMs > SLOW_INFERENCE_THRESHOLD_MS) {
        this.logger.warn(`Sentiment inference took ${elapsedMs}ms (>${SLOW_INFERENCE_THRESHOLD_MS}ms threshold)`)
      }
      return { type: result.labels[0] as SentimentLabel, score: result.scores[0] }
    } catch (error) {
      this.logger.error('Sentiment inference failed', error instanceof Error ? error.stack : String(error))
      return null
    }
  }
}
