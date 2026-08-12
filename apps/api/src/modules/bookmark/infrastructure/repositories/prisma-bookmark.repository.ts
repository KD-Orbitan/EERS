import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../../infrastructure/database/prisma.service'
import { BookmarkRepository, BookmarkListItem } from '../../domain/repositories/bookmark.repository'
import { BookmarkEntity } from '../../domain/entities/bookmark.entity'

@Injectable()
export class PrismaBookmarkRepository extends BookmarkRepository {
  constructor(private readonly prisma: PrismaService) {
    super()
  }

  private mapToEntity(bookmark: { bookmarkId: bigint; userId: bigint; businessId: bigint; createdAt: Date }): BookmarkEntity {
    return {
      bookmarkId: Number(bookmark.bookmarkId),
      userId: Number(bookmark.userId),
      businessId: Number(bookmark.businessId),
      createdAt: bookmark.createdAt,
    }
  }

  async findByUserAndBusiness(userId: number, businessId: number) {
    const bookmark = await this.prisma.bookmark.findUnique({
      where: { userId_businessId: { userId: BigInt(userId), businessId: BigInt(businessId) } },
    })
    return bookmark ? this.mapToEntity(bookmark) : null
  }

  async create(userId: number, businessId: number) {
    const bookmark = await this.prisma.bookmark.create({
      data: { userId: BigInt(userId), businessId: BigInt(businessId) },
    })
    return this.mapToEntity(bookmark)
  }

  async delete(bookmarkId: number) {
    await this.prisma.bookmark.delete({ where: { bookmarkId: BigInt(bookmarkId) } })
  }

  async listByUser(userId: number, page: number, limit: number): Promise<{ items: BookmarkListItem[]; total: number }> {
    const [rows, total] = await Promise.all([
      this.prisma.bookmark.findMany({
        where: { userId: BigInt(userId) },
        include: { business: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.bookmark.count({ where: { userId: BigInt(userId) } }),
    ])

    const items = rows.map((row) => ({
      bookmarkId: Number(row.bookmarkId),
      business: {
        businessId: Number(row.business.businessId),
        name: row.business.name,
        avgRating: Number(row.business.avgRating),
        status: row.business.status,
      },
      createdAt: row.createdAt.toISOString(),
    }))

    return { items, total }
  }
}
