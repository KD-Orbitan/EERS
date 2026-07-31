import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { InfrastructureModule } from '../../infrastructure/infrastructure.module'
import { AdminController } from './presentation/controllers/admin.controller'
import { ApproveBusinessUseCase } from './application/use-cases/approve-business.use-case'
import { RejectBusinessUseCase } from './application/use-cases/reject-business.use-case'
import { ApproveReviewUseCase } from './application/use-cases/approve-review.use-case'
import { RejectReviewUseCase } from './application/use-cases/reject-review.use-case'
import { ScoringConfigUseCase } from './application/use-cases/scoring-config.use-case'
import { CriterionWeightUseCase } from './application/use-cases/criterion-weight.use-case'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { RolesGuard } from '../../common/guards/roles.guard'
import { RankingModule } from '../ranking/ranking.module'

@Module({
  imports: [
    ConfigModule,
    InfrastructureModule,
    RankingModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.accessSecret') || 'change-me-access-secret',
      }),
    }),
  ],
  controllers: [AdminController],
  providers: [
    JwtAuthGuard,
    RolesGuard,
    ApproveBusinessUseCase,
    RejectBusinessUseCase,
    ApproveReviewUseCase,
    RejectReviewUseCase,
    ScoringConfigUseCase,
    CriterionWeightUseCase,
  ],
})
export class AdminModule {}
