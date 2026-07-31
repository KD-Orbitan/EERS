import { Controller, Get, Query, Param, ParseIntPipe } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { GetGlobalRankingUseCase } from '../../application/use-cases/get-global-ranking.use-case'
import type { RankingListQuery } from '../../application/use-cases/get-global-ranking.use-case'
import { GetTopBusinessesUseCase } from '../../application/use-cases/get-top-businesses.use-case'
import { GetRankingMetadataUseCase } from '../../application/use-cases/get-ranking-metadata.use-case'
import { GetBusinessRankingUseCase } from '../../application/use-cases/get-business-ranking.use-case'

@ApiTags('rankings')
@Controller('rankings')
export class RankingController {
  constructor(
    private readonly getGlobalRankingUseCase: GetGlobalRankingUseCase,
    private readonly getTopBusinessesUseCase: GetTopBusinessesUseCase,
    private readonly getRankingMetadataUseCase: GetRankingMetadataUseCase,
    private readonly getBusinessRankingUseCase: GetBusinessRankingUseCase,
  ) {}

  @Get()
  async getGlobalRanking(@Query() query: RankingListQuery) {
    return this.getGlobalRankingUseCase.execute(query)
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
}
