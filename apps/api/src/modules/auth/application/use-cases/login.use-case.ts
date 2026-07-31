import { Injectable, Optional } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcrypt'
import { PrismaService } from '../../../../infrastructure/database/prisma.service'
import { InvalidCredentialsException, UserBannedException } from '../../domain/exceptions/auth.exceptions'
import { RefreshTokenRepository } from '../../domain/repositories/refresh-token.repository'
import { UserRepository } from '../../../user/domain/repositories/user.repository'

@Injectable()
export class LoginUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly jwtService: JwtService,
    @Optional() private readonly configService?: ConfigService,
    @Optional() private readonly bcryptService: { compare: (...args: any[]) => Promise<boolean>; hash: (...args: any[]) => Promise<string> } | typeof bcrypt = bcrypt,
    @Optional() private readonly prisma?: PrismaService,
  ) {}

  async execute(dto: { email: string; password: string }) {
    const user = await this.userRepository.findByEmail(dto.email)

    if (!user) {
      throw new InvalidCredentialsException()
    }

    const passwordMatches = await this.bcryptService.compare(dto.password, user.password)
    if (!passwordMatches) {
      throw new InvalidCredentialsException()
    }

    if (user.status === 'banned') {
      throw new UserBannedException()
    }

    const accessSecret = this.configService?.get<string>('jwt.accessSecret') || 'change-me-access-secret'
    const accessToken = this.jwtService.sign({ sub: user.userId, role: user.roleName || user.role?.roleName || 'USER' }, { expiresIn: '15m', secret: accessSecret })
    const refreshToken = this.jwtService.sign({ sub: user.userId }, { expiresIn: '7d', secret: accessSecret })

    const refreshTokenHash = await this.bcryptService.hash(refreshToken, 12)

    if (this.prisma?.$transaction) {
      await this.prisma.$transaction(async (tx: any) => {
        await this.refreshTokenRepository.create({
          userId: Number(user.userId),
          token: refreshTokenHash,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        })
        if (tx?.log?.create) {
          await tx.log.create({
            data: {
              action: 'LOGIN_SUCCESS',
              entityType: 'User',
              entityId: Number(user.userId),
              userId: Number(user.userId),
            },
          })
        }
      })
    } else {
      await this.refreshTokenRepository.create({
        userId: Number(user.userId),
        token: refreshTokenHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      })
    }

    return {
      accessToken,
      expiresIn: 900,
      user: {
        userId: Number(user.userId),
        name: user.name,
        role: user.roleName || user.role?.roleName || 'USER',
      },
      refreshToken,
    }
  }
}
