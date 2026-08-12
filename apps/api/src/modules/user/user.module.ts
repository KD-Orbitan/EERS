import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { InfrastructureModule } from '../../infrastructure/infrastructure.module'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { GetUserProfileUseCase } from './application/use-cases/get-user-profile.use-case'
import { UpdateProfileUseCase } from './application/use-cases/update-profile.use-case'
import { ChangePasswordUseCase } from './application/use-cases/change-password.use-case'
import { UploadAvatarUseCase } from './application/use-cases/upload-avatar.use-case'
import { UserController } from './presentation/controllers/user.controller'
import { UserRepository } from './domain/repositories/user.repository'
import { PrismaUserRepository } from './infrastructure/repositories/prisma-user.repository'
import { RefreshTokenRepository } from './domain/repositories/refresh-token.repository'
import { PrismaRefreshTokenRepository } from './infrastructure/repositories/prisma-refresh-token.repository'
import { UserImageRepository } from './domain/repositories/user-image.repository'
import { PrismaUserImageRepository } from './infrastructure/repositories/prisma-user-image.repository'

@Module({
  imports: [
    ConfigModule,
    InfrastructureModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.accessSecret') || 'change-me-access-secret',
      }),
    }),
  ],
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
    {
      provide: UserImageRepository,
      useClass: PrismaUserImageRepository,
    },
    GetUserProfileUseCase,
    UpdateProfileUseCase,
    ChangePasswordUseCase,
    UploadAvatarUseCase,
  ],
  exports: [
    UserRepository,
  ],
})
export class UserModule {}
