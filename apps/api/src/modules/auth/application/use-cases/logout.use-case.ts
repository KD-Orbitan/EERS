import { Injectable } from '@nestjs/common'
import { RefreshTokenRepository } from '../../domain/repositories/refresh-token.repository'

@Injectable()
export class LogoutUseCase {
  constructor(private readonly refreshTokenRepository: RefreshTokenRepository) {}

  async execute(refreshToken: string | undefined) {
    if (refreshToken) {
      try {
        const tokenRecord = await this.refreshTokenRepository.findActiveByToken(refreshToken)
        if (tokenRecord && typeof tokenRecord === 'object' && 'tokenId' in tokenRecord) {
          await this.refreshTokenRepository.revoke(Number((tokenRecord as any).tokenId))
        }
      } catch {
        // best effort
      }
    }

    return { message: 'Logged out successfully' }
  }
}
