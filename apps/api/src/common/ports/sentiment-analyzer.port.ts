export type SentimentLabel = 'positive' | 'negative' | 'neutral'

export interface SentimentAnalysisResult {
  type: SentimentLabel
  score: number
}

export abstract class SentimentAnalyzer {
  abstract analyze(text: string): Promise<SentimentAnalysisResult | null>
}
