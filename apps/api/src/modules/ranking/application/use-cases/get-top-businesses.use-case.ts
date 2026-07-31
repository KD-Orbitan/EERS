import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../../infrastructure/database/prisma.service'
import { RankingCacheService } from '../../infrastructure/services/ranking-cache.service'

@Injectable()
export class GetTopBusinessesUseCase {
  constructor(private readonly prisma: PrismaService, private readonly rankingCacheService: RankingCacheService) {}

  async execute({ limit = 10, categoryId, province }: { limit?: number; categoryId?: number; province?: string }) {
    const normalizedLimit = Math.min(Math.max(limit, 1), 20)
    const cacheItems = await this.rankingCacheService.getCachedRanking(categoryId, province)
    let items = cacheItems

    if (!items) {
      const where: any = {}
      if (categoryId) {
        where.scope = 'CATEGORY'
        where.scopeId = BigInt(categoryId)
      } else if (province) {
        where.scope = 'PROVINCE'
      } else {
        where.scope = 'GLOBAL'
      }

      const snapshots = await this.prisma.rankingSnapshot.findMany({
        where,
        orderBy: [{ rank: 'asc' }],
        include: { business: { select: { name: true } } },
        take: normalizedLimit,
      })
      items = snapshots.map((snapshot) => ({
        rank: snapshot.rank,
        businessId: Number(snapshot.businessId),
        businessName: snapshot.business.name,
        avgRating: Number(snapshot.avgRating),
        reviewCount: snapshot.reviewCount,
        rankingScore: Number(snapshot.rankingScore),
      }))
      await this.rankingCacheService.setCachedRanking(items, categoryId, province)
    }

    return items.slice(0, normalizedLimit)
  }
}
