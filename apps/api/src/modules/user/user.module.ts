import { Module } from '@nestjs/common'
import { InfrastructureModule } from '../../infrastructure/infrastructure.module'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { GetUserProfileUseCase } from './application/use-cases/get-user-profile.use-case'
import { UpdateProfileUseCase } from './application/use-cases/update-profile.use-case'
import { ChangePasswordUseCase } from './application/use-cases/change-password.use-case'
import { UserController } from './presentation/controllers/user.controller'
import { UserRepository } from './domain/repositories/user.repository'
import { PrismaUserRepository } from './infrastructure/repositories/prisma-user.repository'
import { RefreshTokenRepository } from './domain/repositories/refresh-token.repository'
import { PrismaRefreshTokenRepository } from './infrastructure/repositories/prisma-refresh-token.repository'

@Module({
  imports: [InfrastructureModule],
  controllers: [UserController],
  providers: [
    JwtAuthGuard,
    {
      provide: UserRepository,
      useClass: PrismaUserRepository,
    },
    {
      provide: RefreshTokenRepository,
      useClass: PrismaRefreshTokenRepository,
    },
    GetUserProfileUseCase,
    UpdateProfileUseCase,
    ChangePasswordUseCase,
  ],
})
export class UserModule {}
