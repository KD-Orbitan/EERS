import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../../infrastructure/database/prisma.service'

@Injectable()
export class RankingTrendConfigUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async getConfig() {
    const config = await this.prisma.rankingTrendConfig.findFirst()
    return config ? { period: config.period, updatedAt: config.updatedAt.toISOString() } : null
  }

  async updateConfig(period: 'DAY' | 'WEEK' | 'MONTH') {
    await this.prisma.rankingTrendConfig.updateMany({ where: {}, data: { period } })
    return this.getConfig()
  }
}
