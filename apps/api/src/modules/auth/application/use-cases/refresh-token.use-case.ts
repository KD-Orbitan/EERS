import { Injectable } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import {
  InvalidRefreshTokenException,
  TokenExpiredException,
  UserBannedException,
} from '../../domain/exceptions/auth.exceptions'
import { RefreshTokenRepository } from '../../domain/repositories/refresh-token.repository'
import { UserRepository } from '../../domain/repositories/user.repository'

@Injectable()
export class RefreshTokenUseCase {
  constructor(
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
  ) {}

  async execute(refreshToken: string) {
    if (!refreshToken) {
      throw new InvalidRefreshTokenException('Refresh token is invalid or missing')
    }

    let payload: any
    try {
      payload = this.jwtService.verify(refreshToken)
    } catch (error: any) {
      if (error?.name === 'TokenExpiredError') {
        throw new TokenExpiredException()
      }
      throw new InvalidRefreshTokenException('Refresh token is invalid or missing')
    }

    const tokenRecord = await this.refreshTokenRepository.findActiveByToken(refreshToken)
    if (!tokenRecord) {
      throw new InvalidRefreshTokenException('Refresh token is invalid or missing')
    }

    const user = await this.userRepository.findById(Number(payload.sub))
    if (!user) {
      throw new InvalidRefreshTokenException()
    }

    if (user.status === 'banned') {
      throw new UserBannedException()
    }

    const accessToken = this.jwtService.sign({ sub: user.userId, role: user.roleName || user.role?.roleName || 'USER' }, { expiresIn: '15m' })

    return {
      accessToken,
      expiresIn: 900,
    }
  }
}
