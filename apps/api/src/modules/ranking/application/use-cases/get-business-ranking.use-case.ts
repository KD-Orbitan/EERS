import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../../infrastructure/database/prisma.service'

@Injectable()
export class GetBusinessRankingUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(businessId: number) {
    const ranking = await this.prisma.rankingSnapshot.findFirst({
      where: { businessId: BigInt(businessId), scope: 'GLOBAL' },
      orderBy: { rank: 'asc' },
    })
    return ranking ? { rank: ranking.rank, rankingScore: Number(ranking.rankingScore) } : null
  }
}
