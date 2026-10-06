import { Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../../../../infrastructure/database/prisma.service'
import { RankingQueryRepository, RankingSelection } from '../../application/ports/ranking-query.repository'

@Injectable()
export class PrismaRankingQueryRepository implements RankingQueryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getBusinessGlobalRanking(businessId: number) {
    const row = await this.prisma.rankingSnapshot.findFirst({
      where: { businessId: BigInt(businessId), scope: 'GLOBAL' },
      orderBy: { rank: 'asc' },
    })
    return row ? { rank: row.rank, rankingScore: Number(row.rankingScore) } : null
  }

  async getSnapshots({ categoryId, province, limit }: RankingSelection) {
    const where: Prisma.RankingSnapshotWhereInput = categoryId
      ? { scope: 'CATEGORY', scopeId: BigInt(categoryId) }
      : { scope: province ? 'PROVINCE' : 'GLOBAL' }
    const rows = await this.prisma.rankingSnapshot.findMany({
      where,
      orderBy: [{ rank: 'asc' }],
      include: { business: { select: { name: true, locations: { include: { location: true } } } } },
      ...(limit === undefined ? {} : { take: limit }),
    })
    return rows.map((row) => ({
      rank: row.rank,
      businessId: Number(row.businessId),
      businessName: row.business.name,
      avgRating: Number(row.avgRating),
      reviewCount: row.reviewCount,
      rankingScore: Number(row.rankingScore),
      province: row.business.locations[0]?.location?.province ?? null,
    }))
  }

  async getMetadata() {
    const latest = await this.prisma.rankingSnapshot.findFirst({ orderBy: { calculatedAt: 'desc' } })
    const totalRankedBusinesses = await this.prisma.rankingSnapshot.count({ where: { scope: 'GLOBAL' } })
    return { lastCalculatedAt: latest?.calculatedAt ?? null, totalRankedBusinesses }
  }

  async getBusinessCategoryRanks(businessId: number) {
    const rows = await this.prisma.rankingSnapshot.findMany({
      where: { scope: 'CATEGORY', businessId: BigInt(businessId) },
      orderBy: { rank: 'asc' },
    })
    return rows.map((row) => ({ scopeId: row.scopeId === null ? null : Number(row.scopeId), rank: row.rank }))
  }

  async getCategoryName(categoryId: number) {
    const category = await this.prisma.category.findUnique({ where: { categoryId } })
    return category?.categoryName ?? null
  }

  async getCategoryCompetitors(categoryId: number, excludeBusinessId: number) {
    const rows = await this.prisma.rankingSnapshot.findMany({
      where: { scope: 'CATEGORY', scopeId: BigInt(categoryId), businessId: { not: BigInt(excludeBusinessId) } },
      include: { business: { select: { name: true } } },
    })
    return rows.map((row) => ({
      businessId: Number(row.businessId), businessName: row.business.name,
      rank: row.rank, rankingScore: Number(row.rankingScore), avgRating: Number(row.avgRating),
    }))
  }
}
