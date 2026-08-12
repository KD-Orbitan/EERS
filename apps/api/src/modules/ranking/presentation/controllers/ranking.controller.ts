import { Controller, Get, Query, Param, ParseIntPipe } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { GetGlobalRankingUseCase } from '../../application/use-cases/get-global-ranking.use-case'
import type { RankingListQuery } from '../../application/use-cases/get-global-ranking.use-case'
import { GetTopBusinessesUseCase } from '../../application/use-cases/get-top-businesses.use-case'
import { GetRankingMetadataUseCase } from '../../application/use-cases/get-ranking-metadata.use-case'
import { GetBusinessRankingUseCase } from '../../application/use-cases/get-business-ranking.use-case'
import { GetMarketCompetitorsUseCase } from '../../application/use-cases/get-market-competitors.use-case'

@ApiTags('rankings')
@Controller('rankings')
export class RankingController {
  constructor(
    private readonly getGlobalRankingUseCase: GetGlobalRankingUseCase,
    private readonly getTopBusinessesUseCase: GetTopBusinessesUseCase,
    private readonly getRankingMetadataUseCase: GetRankingMetadataUseCase,
    private readonly getBusinessRankingUseCase: GetBusinessRankingUseCase,
    private readonly getMarketCompetitorsUseCase: GetMarketCompetitorsUseCase,
  ) {}

  @Get()
  async getGlobalRanking(@Query() query: RankingListQuery) {
    const { items, total } = await this.getGlobalRankingUseCase.execute(query)
    const page = query.page && query.page > 0 ? Number(query.page) : 1
    const limit = query.limit && query.limit > 0 ? Math.min(Number(query.limit), 100) : 20
    return { success: true, data: items, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } }
  }

  @Get('top')
  async getTopBusinesses(@Query('limit') limit = '10', @Query('categoryId') categoryId?: string, @Query('province') province?: string) {
    return this.getTopBusinessesUseCase.execute({
      limit: Number(limit),
      categoryId: categoryId ? Number(categoryId) : undefined,
      province,
    })
  }

  @Get('metadata')
  async getRankingMetadata() {
    return this.getRankingMetadataUseCase.execute()
  }

  @Get('businesses/:businessId')
  async getBusinessRanking(@Param('businessId', ParseIntPipe) businessId: number) {
    return this.getBusinessRankingUseCase.execute(businessId)
  }

  @Get('businesses/:businessId/competitors')
  async getMarketCompetitors(
    @Param('businessId', ParseIntPipe) businessId: number,
    @Query('categoryId') categoryId?: string,
    @Query('limit') limit?: string,
  ) {
    return this.getMarketCompetitorsUseCase.execute({
      businessId,
      categoryId: categoryId ? Number(categoryId) : undefined,
      limit: limit ? Number(limit) : undefined,
    })
  }
}
