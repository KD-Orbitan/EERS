import { Injectable, Optional, ServiceUnavailableException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { OAuth2Client, TokenPayload } from 'google-auth-library'
import { randomBytes } from 'crypto'
import * as bcrypt from 'bcrypt'
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
  ) {}

  async execute(dto: { idToken: string }) {
    const audience = process.env.GOOGLE_CLIENT_ID?.trim()
    if (!audience) throw new ServiceUnavailableException('Google sign-in is not configured')
    let payload: TokenPayload | undefined
    try {
      const ticket = await this.client.verifyIdToken({ idToken: dto.idToken, audience })
      payload = ticket.getPayload()
    } catch {
      throw new InvalidGoogleTokenException()
    }

    if (!payload?.sub || !payload.email || payload.email_verified !== true) {
      throw new InvalidGoogleTokenException()
    }

    // Email-based account matching requires Google to be authoritative for the email.
    if (!payload.email.endsWith('@gmail.com') && !payload.hd) {
      throw new InvalidGoogleTokenException('Use a Gmail or Google Workspace account, or sign in with your password')
    }

    let user = await this.userRepository.findByEmail(payload.email)

    if (user?.status === 'banned') {
      throw new UserBannedException()
    }

    if (!user) {
      const role = await this.userRepository.findRoleByName('USER')
      if (!role) throw new ServiceUnavailableException('Default user role is not configured')
      user = await this.userRepository.create({
        name: payload.name || payload.email.split('@')[0],
        email: payload.email,
        password: await this.bcryptService.hash(randomBytes(32).toString('hex'), 12),
        roleId: role.roleId,
        status: 'active',
      })
    }

    const accessToken = this.jwtService.sign({ sub: user.userId, role: user.roleName || user.role?.roleName || 'USER' }, { expiresIn: '15m' })
    const refreshToken = this.jwtService.sign({ sub: user.userId }, { expiresIn: '7d' })
    const refreshTokenHash = await this.bcryptService.hash(refreshToken, 12)

    await this.refreshTokenRepository.createWithLoginAudit({
      userId: Number(user.userId),
      token: refreshTokenHash,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    })

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
