import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { InfrastructureModule } from '../../infrastructure/infrastructure.module'
import { ReviewModule } from '../review/review.module'
import { BusinessModule } from '../business/business.module'
import { RankingController } from './presentation/controllers/ranking.controller'
import { RankingCalculationService } from './application/services/ranking-calculation.service'
import { ScoringConfigService } from './infrastructure/services/scoring-config.service'
import { TrustScoreService } from './application/services/trust-score.service'
import { FraudDetectionService } from './application/services/fraud-detection.service'
import { MultiCriteriaScoringService } from './application/services/multi-criteria-scoring.service'
import { ReviewWeightingService } from './application/services/review-weighting.service'
import { GetGlobalRankingUseCase } from './application/use-cases/get-global-ranking.use-case'
import { GetTopBusinessesUseCase } from './application/use-cases/get-top-businesses.use-case'
import { GetRankingMetadataUseCase } from './application/use-cases/get-ranking-metadata.use-case'
import { GetBusinessRankingUseCase } from './application/use-cases/get-business-ranking.use-case'
import { GetMarketCompetitorsUseCase } from './application/use-cases/get-market-competitors.use-case'
import { TriggerRecalculationUseCase } from './application/use-cases/trigger-recalculation.use-case'
import { SimilarityService } from './infrastructure/services/similarity.service'
import { PgTrgmSimilarityService } from './infrastructure/services/pg-trgm-similarity.service'
import { RankingDbService } from './infrastructure/services/ranking-db.service'
import { RankingCacheService } from './infrastructure/services/ranking-cache.service'
import { RankingTrendConfigService } from './infrastructure/services/ranking-trend-config.service'
import { RankingRecalculationJob } from '../../jobs/ranking-recalculation.job'
import { TrustScoreJob } from '../../jobs/trust-score.job'
import { JwtModule } from '@nestjs/jwt'

@Module({
  imports: [ConfigModule, InfrastructureModule, ReviewModule, BusinessModule, JwtModule.registerAsync({
    imports: [ConfigModule],
    inject: [ConfigService],
    useFactory: (configService: ConfigService) => ({
      secret: configService.get<string>('jwt.accessSecret') || 'change-me-access-secret',
    }),
  })],
  controllers: [RankingController],
  providers: [
    {
      provide: SimilarityService,
      useClass: PgTrgmSimilarityService,
    },
    ScoringConfigService,
    RankingTrendConfigService,
    RankingDbService,
    RankingCacheService,
    TrustScoreService,
    FraudDetectionService,
    MultiCriteriaScoringService,
    ReviewWeightingService,
    RankingCalculationService,
    GetGlobalRankingUseCase,
    GetTopBusinessesUseCase,
    GetRankingMetadataUseCase,
    GetBusinessRankingUseCase,
    GetMarketCompetitorsUseCase,
    TriggerRecalculationUseCase,
    RankingRecalculationJob,
    TrustScoreJob,
  ],
  exports: [RankingCalculationService, TriggerRecalculationUseCase],
})
export class RankingModule {}
