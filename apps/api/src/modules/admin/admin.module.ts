import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { InfrastructureModule } from '../../infrastructure/infrastructure.module'
import { AdminController } from './presentation/controllers/admin.controller'
import { ApproveBusinessUseCase } from './application/use-cases/approve-business.use-case'
import { RejectBusinessUseCase } from './application/use-cases/reject-business.use-case'
import { ListAdminBusinessesUseCase } from './application/use-cases/list-admin-businesses.use-case'
import { ApproveReviewUseCase } from './application/use-cases/approve-review.use-case'
import { RejectReviewUseCase } from './application/use-cases/reject-review.use-case'
import { ListAdminReviewsUseCase } from './application/use-cases/list-admin-reviews.use-case'
import { ScoringConfigUseCase } from './application/use-cases/scoring-config.use-case'
import { CriterionWeightUseCase } from './application/use-cases/criterion-weight.use-case'
import { RankingTrendConfigUseCase } from './application/use-cases/ranking-trend-config.use-case'
import { ListAdminUsersUseCase } from './application/use-cases/list-admin-users.use-case'
import { BanUserUseCase } from './application/use-cases/ban-user.use-case'
import { UnbanUserUseCase } from './application/use-cases/unban-user.use-case'
import { CreateCategoryUseCase } from './application/use-cases/create-category.use-case'
import { CreateCriterionUseCase } from './application/use-cases/create-criterion.use-case'
import { AssignCriterionUseCase } from './application/use-cases/assign-criterion.use-case'
import { RemoveCriterionUseCase } from './application/use-cases/remove-criterion.use-case'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { RolesGuard } from '../../common/guards/roles.guard'
import { RankingModule } from '../ranking/ranking.module'
import { ReportModule } from '../report/report.module'
import { NotificationModule } from '../notification/notification.module'

@Module({
  imports: [
    ConfigModule,
    InfrastructureModule,
    RankingModule,
    ReportModule,
    NotificationModule,
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
    ListAdminBusinessesUseCase,
    ApproveReviewUseCase,
    RejectReviewUseCase,
    ListAdminReviewsUseCase,
    ScoringConfigUseCase,
    CriterionWeightUseCase,
    RankingTrendConfigUseCase,
    ListAdminUsersUseCase,
    BanUserUseCase,
    UnbanUserUseCase,
    CreateCategoryUseCase,
    CreateCriterionUseCase,
    AssignCriterionUseCase,
    RemoveCriterionUseCase,
  ],
})
export class AdminModule {}
