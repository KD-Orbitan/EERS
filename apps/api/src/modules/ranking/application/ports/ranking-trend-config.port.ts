export type RankingTrendPeriod = 'DAY' | 'WEEK' | 'MONTH'

export const RANKING_HISTORY_RETENTION_DAYS = 40

export abstract class RankingTrendConfigPort {
  abstract getPeriod(): Promise<RankingTrendPeriod>
  abstract getBaselines(businessIds: number[], period: RankingTrendPeriod): Promise<Map<number, { rank: number; rankingScore: number }>>
}
