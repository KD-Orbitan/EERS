import { Controller, Get, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { CurrentUser } from '../../../../common/decorators/current-user.decorator'
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard'
import { BusinessReviewsQueryDto } from '../../application/dto/business-reviews-query.dto'
import { GetBusinessReviewsUseCase } from '../../application/use-cases/get-business-reviews.use-case'
import { GetReviewStatisticsUseCase } from '../../application/use-cases/get-review-statistics.use-case'

@ApiTags('business reviews')
@Controller('businesses')
export class BusinessReviewController {
  constructor(
    private readonly getBusinessReviewsUseCase: GetBusinessReviewsUseCase,
    private readonly getReviewStatisticsUseCase: GetReviewStatisticsUseCase,
  ) {}

  @Get(':businessId/reviews')
  async getBusinessReviews(@Param('businessId', ParseIntPipe) businessId: number, @Query() query: BusinessReviewsQueryDto, @CurrentUser() user?: { role: string }) {
    return this.getBusinessReviewsUseCase.execute({ businessId, currentUser: user, query })
  }

  @Get(':businessId/review-statistics')
  async getReviewStatistics(@Param('businessId', ParseIntPipe) businessId: number) {
    return this.getReviewStatisticsUseCase.execute({ businessId })
  }
}
