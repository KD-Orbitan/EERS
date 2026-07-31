import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../../infrastructure/database/prisma.service'

@Injectable()
export class GetRankingMetadataUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute() {
    const lastSnapshot = await this.prisma.rankingSnapshot.findFirst({
      orderBy: { calculatedAt: 'desc' },
    })
    const totalRankedBusinesses = await this.prisma.rankingSnapshot.count({ where: { scope: 'GLOBAL' } })

    return {
      lastCalculatedAt: lastSnapshot?.calculatedAt.toISOString() ?? null,
      totalRankedBusinesses,
    }
  }
}
