import { Injectable, Optional } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcrypt'
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
    @Optional() private readonly configService?: ConfigService,
  ) {}

  async execute(refreshToken: string) {
    if (!refreshToken) {
      throw new InvalidRefreshTokenException('Refresh token is invalid or missing')
    }

    const accessSecret = this.configService?.get<string>('jwt.accessSecret') || 'change-me-access-secret'
    console.log('refreshToken input:', refreshToken.slice(0, 20))

    let payload: any
    try {
      payload = this.jwtService.verify(refreshToken, { secret: accessSecret })
      console.log('refresh payload:', payload)
    } catch (error: any) {
      if (error?.name === 'TokenExpiredError') {
        throw new TokenExpiredException()
      }
      throw new InvalidRefreshTokenException('Refresh token is invalid or missing')
    }

    const user = await this.userRepository.findById(Number(payload.sub))
    if (!user) {
      throw new InvalidRefreshTokenException()
    }

    const tokenRecords = (await this.refreshTokenRepository.findActiveTokensByUserId(Number(user.userId))) as Array<{ token?: string }>
    console.log('tokenRecords count:', tokenRecords.length)
    const matchingToken = await this.findMatchingToken(refreshToken, tokenRecords)
    if (!matchingToken) {
      throw new InvalidRefreshTokenException('Refresh token is invalid or missing')
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

  private async findMatchingToken(refreshToken: string, tokenRecords: Array<{ token?: string }>): Promise<{ token?: string } | undefined> {
    for (const record of tokenRecords) {
      if (record.token && (await bcrypt.compare(refreshToken, record.token))) {
        return record
      }
    }

    return undefined
  }
}
