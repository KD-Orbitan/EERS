import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { AuthController } from './presentation/controllers/auth.controller'
import { RegisterUseCase } from './application/use-cases/register.use-case'
import { LoginUseCase } from './application/use-cases/login.use-case'
import { GoogleAuthUseCase } from './application/use-cases/google-auth.use-case'
import { RefreshTokenUseCase } from './application/use-cases/refresh-token.use-case'
import { LogoutUseCase } from './application/use-cases/logout.use-case'
import { PrismaUserRepository } from './infrastructure/repositories/prisma-user.repository'
import { PrismaRefreshTokenRepository } from './infrastructure/repositories/prisma-refresh-token.repository'
import { UserRepository } from './domain/repositories/user.repository'
import { RefreshTokenRepository } from './domain/repositories/refresh-token.repository'
import { JwtStrategy } from '../../common/strategies/jwt.strategy'
import { JwtRefreshStrategy } from '../../common/strategies/jwt-refresh.strategy'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { InfrastructureModule } from '../../infrastructure/infrastructure.module'

@Module({
  imports: [
    ConfigModule,
    InfrastructureModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.accessSecret') || 'change-me-access-secret',
        signOptions: { expiresIn: (configService.get<string>('jwt.accessExpiresIn') || '15m') as any },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    JwtStrategy,
    JwtRefreshStrategy,
    JwtAuthGuard,
    {
      provide: UserRepository,
      useClass: PrismaUserRepository,
    },
    {
      provide: RefreshTokenRepository,
      useClass: PrismaRefreshTokenRepository,
    },
    RegisterUseCase,
    LoginUseCase,
    GoogleAuthUseCase,
    RefreshTokenUseCase,
    LogoutUseCase,
  ],
  exports: [JwtStrategy, JwtRefreshStrategy],
})
export class AuthModule {}
