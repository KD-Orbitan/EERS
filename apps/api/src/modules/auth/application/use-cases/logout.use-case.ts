import { Injectable } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcrypt'
import { RefreshTokenRepository } from '../../domain/repositories/refresh-token.repository'

@Injectable()
export class LogoutUseCase {
  constructor(
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly jwtService: JwtService,
  ) {}

  async execute(refreshToken: string | undefined) {
    if (refreshToken) {
      try {
        const payload = this.jwtService.verify(refreshToken)
        const userId = Number(payload.sub)
        const tokenRecords = await this.refreshTokenRepository.findActiveTokensByUserId(userId)
        const matchingToken = await this.findMatchingToken(refreshToken, tokenRecords as Array<{ token?: string; tokenId?: number }>)
        if (matchingToken?.tokenId) {
          await this.refreshTokenRepository.revoke(Number(matchingToken.tokenId))
        }
      } catch {
        // best effort
      }
    }

    return { message: 'Logged out successfully' }
  }

  private async findMatchingToken(
    refreshToken: string,
    tokenRecords: Array<{ token?: string; tokenId?: number }>,
  ): Promise<{ token?: string; tokenId?: number } | undefined> {
    for (const record of tokenRecords) {
      if (record.token && (await bcrypt.compare(refreshToken, record.token))) {
        return record
      }
    }

    return undefined
  }
}
