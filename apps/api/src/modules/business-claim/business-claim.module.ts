import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { InfrastructureModule } from '../../infrastructure/infrastructure.module'
import { BusinessModule } from '../business/business.module'
import { NotificationModule } from '../notification/notification.module'
import { UserModule } from '../user/user.module'
import { BusinessClaimController } from './presentation/controllers/business-claim.controller'
import { BusinessClaimRepository } from './domain/repositories/business-claim.repository'
import { PrismaBusinessClaimRepository } from './infrastructure/repositories/prisma-business-claim.repository'
import { SubmitClaimUseCase } from './application/use-cases/submit-claim.use-case'
import { WithdrawClaimUseCase } from './application/use-cases/withdraw-claim.use-case'
import { GetMyClaimsUseCase } from './application/use-cases/get-my-claims.use-case'
import { ListAdminClaimsUseCase } from './application/use-cases/list-admin-claims.use-case'
import { ApproveClaimUseCase } from './application/use-cases/approve-claim.use-case'
import { RejectClaimUseCase } from './application/use-cases/reject-claim.use-case'

@Module({
  imports: [
    ConfigModule,
    InfrastructureModule,
    BusinessModule,
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
  controllers: [BusinessClaimController],
  providers: [
    {
      provide: BusinessClaimRepository,
      useClass: PrismaBusinessClaimRepository,
    },
    SubmitClaimUseCase,
    WithdrawClaimUseCase,
    GetMyClaimsUseCase,
    ListAdminClaimsUseCase,
    ApproveClaimUseCase,
    RejectClaimUseCase,
  ],
  // Exported for AdminModule's Business Claim Management endpoints (cross-module access
  // via public UseCase contracts, per D-021 — Admin must not touch claim data directly).
  exports: [ListAdminClaimsUseCase, ApproveClaimUseCase, RejectClaimUseCase],
})
export class BusinessClaimModule {}
