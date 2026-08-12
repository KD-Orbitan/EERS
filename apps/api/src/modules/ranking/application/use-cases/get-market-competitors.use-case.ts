import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../../infrastructure/database/prisma.service'

@Injectable()
export class GetMarketCompetitorsUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute({ businessId, categoryId, limit = 5 }: { businessId: number; categoryId?: number; limit?: number }) {
    const normalizedLimit = Math.min(Math.max(limit, 1), 20)

    const ownCategorySnapshots = await this.prisma.rankingSnapshot.findMany({
      where: { scope: 'CATEGORY', businessId: BigInt(businessId) },
      orderBy: { rank: 'asc' },
    })

    const emptyResult = { categoryId: null, categoryName: null, businessRank: null, competitors: [] as Array<{ businessId: number; businessName: string; rank: number; rankingScore: number; avgRating: number }> }

    if (ownCategorySnapshots.length === 0) {
      return emptyResult
    }

    const target = categoryId
      ? ownCategorySnapshots.find((snapshot) => Number(snapshot.scopeId) === categoryId)
      : ownCategorySnapshots[0]

    if (!target || target.scopeId === null) {
      return emptyResult
    }

    const targetCategoryId = Number(target.scopeId)

    const [category, categorySnapshots] = await Promise.all([
      this.prisma.category.findUnique({ where: { categoryId: targetCategoryId } }),
      this.prisma.rankingSnapshot.findMany({
        where: { scope: 'CATEGORY', scopeId: BigInt(targetCategoryId), businessId: { not: BigInt(businessId) } },
        include: { business: { select: { name: true } } },
      }),
    ])

    const competitors = categorySnapshots
      .map((snapshot) => ({
        businessId: Number(snapshot.businessId),
        businessName: snapshot.business.name,
        rank: snapshot.rank,
        rankingScore: Number(snapshot.rankingScore),
        avgRating: Number(snapshot.avgRating),
        distance: Math.abs(snapshot.rank - target.rank),
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, normalizedLimit)
      .map(({ distance, ...item }) => item)

    return {
      categoryId: targetCategoryId,
      categoryName: category?.categoryName ?? null,
      businessRank: target.rank,
      competitors,
    }
  }
}
