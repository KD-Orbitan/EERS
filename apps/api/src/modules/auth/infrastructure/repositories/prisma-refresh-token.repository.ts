import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../../infrastructure/database/prisma.service'
import { RefreshTokenRepository } from '../../domain/repositories/refresh-token.repository'

@Injectable()
export class PrismaRefreshTokenRepository extends RefreshTokenRepository {
  constructor(private readonly prisma: PrismaService) {
    super()
  }

  async create(data: { userId: number; token: string; expiresAt: Date }): Promise<unknown> {
    return this.prisma.refreshToken.create({
      data: {
        userId: Number(data.userId),
        token: data.token,
        expiresAt: data.expiresAt,
      },
    })
  }

  async findActiveByToken(token: string): Promise<unknown> {
    return this.prisma.refreshToken.findFirst({
      where: {
        token,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
    })
  }

  async revoke(tokenId: number): Promise<void> {
    await this.prisma.refreshToken.update({
      where: { tokenId: Number(tokenId) },
      data: { revokedAt: new Date() },
    })
  }
}
