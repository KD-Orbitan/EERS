import { Injectable, Optional } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { OAuth2Client } from 'google-auth-library'
import * as bcrypt from 'bcrypt'
import { PrismaService } from '../../../../infrastructure/database/prisma.service'
import { InvalidGoogleTokenException, UserBannedException } from '../../domain/exceptions/auth.exceptions'
import { RefreshTokenRepository } from '../../domain/repositories/refresh-token.repository'
import { UserRepository } from '../../../user/domain/repositories/user.repository'

@Injectable()
export class GoogleAuthUseCase {
  private readonly client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

  constructor(
    private readonly userRepository: UserRepository,
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly jwtService: JwtService,
    @Optional() private readonly bcryptService: typeof bcrypt = bcrypt,
    private readonly prisma: PrismaService,
  ) {}

  async execute(dto: { idToken: string }) {
    let payload: any
    try {
      const ticket = await this.client.verifyIdToken({ idToken: dto.idToken, audience: process.env.GOOGLE_CLIENT_ID })
      payload = ticket.getPayload()
    } catch {
      throw new InvalidGoogleTokenException()
    }

    if (!payload?.email) {
      throw new InvalidGoogleTokenException()
    }

    let user = await this.userRepository.findByEmail(payload.email)

    if (user?.status === 'banned') {
      throw new UserBannedException()
    }

    if (!user) {
      const role = await this.userRepository.findRoleByName('USER')
      user = await this.userRepository.create({
        name: payload.name || payload.email.split('@')[0],
        email: payload.email,
        password: await this.bcryptService.hash(Math.random().toString(36).slice(2), 12),
        roleId: role?.roleId,
        status: 'active',
      })
    }

    const accessToken = this.jwtService.sign({ sub: user.userId, role: user.roleName || user.role?.roleName || 'USER' }, { expiresIn: '15m' })
    const refreshToken = this.jwtService.sign({ sub: user.userId }, { expiresIn: '7d' })
    const refreshTokenHash = await this.bcryptService.hash(refreshToken, 12)

    if (this.prisma?.$transaction) {
      await this.prisma.$transaction(async () => {
        await this.refreshTokenRepository.create({
          userId: Number(user.userId),
          token: refreshTokenHash,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        })
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
        email: user.email,
        role: user.roleName || user.role?.roleName || 'USER',
      },
      refreshToken,
    }
  }
}
