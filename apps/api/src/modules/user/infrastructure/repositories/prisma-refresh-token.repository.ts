import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../../infrastructure/database/prisma.service'
import { RefreshTokenRepository } from '../../domain/repositories/refresh-token.repository'

@Injectable()
export class PrismaRefreshTokenRepository extends RefreshTokenRepository {
  constructor(private readonly prisma: PrismaService) {
    super()
  }

  async revokeAllByUserId(userId: number): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: {
        userId: Number(userId),
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    })
  }
}
