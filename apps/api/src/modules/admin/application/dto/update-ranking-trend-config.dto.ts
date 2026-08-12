import { IsIn } from 'class-validator'

export class UpdateRankingTrendConfigDto {
  @IsIn(['DAY', 'WEEK', 'MONTH'])
  period!: 'DAY' | 'WEEK' | 'MONTH'
}
