import { Controller, Get, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { CurrentUser } from '../../../../common/decorators/current-user.decorator'
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard'
import { BusinessReviewsQueryDto } from '../../application/dto/business-reviews-query.dto'
import { GetBusinessReviewsUseCase } from '../../application/use-cases/get-business-reviews.use-case'
import { GetReviewStatisticsUseCase } from '../../application/use-cases/get-review-statistics.use-case'
import { GetSentimentSummaryUseCase } from '../../application/use-cases/get-sentiment-summary.use-case'
import { GetCriteriaScoresUseCase } from '../../application/use-cases/get-criteria-scores.use-case'

@ApiTags('business reviews')
@Controller('businesses')
export class BusinessReviewController {
  constructor(
    private readonly getBusinessReviewsUseCase: GetBusinessReviewsUseCase,
    private readonly getReviewStatisticsUseCase: GetReviewStatisticsUseCase,
    private readonly getSentimentSummaryUseCase: GetSentimentSummaryUseCase,
    private readonly getCriteriaScoresUseCase: GetCriteriaScoresUseCase,
  ) {}

  @Get(':businessId/reviews')
  async getBusinessReviews(@Param('businessId', ParseIntPipe) businessId: number, @Query() query: BusinessReviewsQueryDto, @CurrentUser() user?: { role: string }) {
    const { items, total } = await this.getBusinessReviewsUseCase.execute({ businessId, currentUser: user, query })
    const page = query.page ?? 1
    const limit = query.limit ?? 20
    return { success: true, data: items, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } }
  }

  @Get(':businessId/review-statistics')
  async getReviewStatistics(@Param('businessId', ParseIntPipe) businessId: number) {
    return this.getReviewStatisticsUseCase.execute({ businessId })
  }

  @Get(':businessId/sentiment-summary')
  async getSentimentSummary(@Param('businessId', ParseIntPipe) businessId: number) {
    return this.getSentimentSummaryUseCase.execute({ businessId })
  }

  @Get(':businessId/criteria-scores')
  async getCriteriaScores(@Param('businessId', ParseIntPipe) businessId: number) {
    return this.getCriteriaScoresUseCase.execute({ businessId })
  }
}
