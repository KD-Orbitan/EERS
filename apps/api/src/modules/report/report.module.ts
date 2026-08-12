import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { InfrastructureModule } from '../../infrastructure/infrastructure.module'
import { ReviewModule } from '../review/review.module'
import { NotificationModule } from '../notification/notification.module'
import { UserModule } from '../user/user.module'
import { ReportController } from './presentation/controllers/report.controller'
import { ReportRepository } from './domain/repositories/report.repository'
import { PrismaReportRepository } from './infrastructure/repositories/prisma-report.repository'
import { GetReasonsUseCase } from './application/use-cases/get-reasons.use-case'
import { CreateReportUseCase } from './application/use-cases/create-report.use-case'
import { GetMyReportsUseCase } from './application/use-cases/get-my-reports.use-case'
import { GetReportByIdUseCase } from './application/use-cases/get-report-by-id.use-case'
import { WithdrawReportUseCase } from './application/use-cases/withdraw-report.use-case'
import { ListAdminReportsUseCase } from './application/use-cases/list-admin-reports.use-case'
import { ResolveReportUseCase } from './application/use-cases/resolve-report.use-case'
import { RejectReportUseCase } from './application/use-cases/reject-report.use-case'

@Module({
  imports: [
    ConfigModule,
    InfrastructureModule,
    ReviewModule,
    NotificationModule,
    UserModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.accessSecret') || 'change-me-access-secret',
      }),
    }),
  ],
  controllers: [ReportController],
  providers: [
    {
      provide: ReportRepository,
      useClass: PrismaReportRepository,
    },
    GetReasonsUseCase,
    CreateReportUseCase,
    GetMyReportsUseCase,
    GetReportByIdUseCase,
    WithdrawReportUseCase,
    ListAdminReportsUseCase,
    ResolveReportUseCase,
    RejectReportUseCase,
  ],
  // Exported for AdminModule's Report Management endpoints (cross-module access
  // via public UseCase contracts, per D-021 — Admin must not touch report data directly).
  exports: [ListAdminReportsUseCase, ResolveReportUseCase, RejectReportUseCase],
})
export class ReportModule {}
