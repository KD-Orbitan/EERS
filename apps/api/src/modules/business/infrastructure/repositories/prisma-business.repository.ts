import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../../infrastructure/database/prisma.service'
import { BusinessRepository, BusinessListQuery, ReviewTrendPoint } from '../../domain/repositories/business.repository'

@Injectable()
export class PrismaBusinessRepository extends BusinessRepository {
  constructor(private readonly prisma: PrismaService) {
    super()
  }

  async findByPhone(phone: string) {
    const business = await this.prisma.business.findFirst({
      where: { phone, deletedAt: null },
    })
    return business ? this.mapToEntity(business) : null
  }

  async findByEmail(email: string) {
    const business = await this.prisma.business.findFirst({
      where: { email, deletedAt: null },
    })
    return business ? this.mapToEntity(business) : null
  }

  async findById(businessId: number) {
    const business = await this.prisma.business.findFirst({
      where: { businessId, deletedAt: null },
    })
    return business ? this.mapToEntity(business) : null
  }

  async findCategoriesExist(categoryIds: number[]) {
    const count = await this.prisma.category.count({
      where: { categoryId: { in: categoryIds } },
    })
    return count === categoryIds.length
  }

  async createBusinessWithLocationsAndCategories(params: {
    name: string
    description?: string | null
    phone: string
    email?: string | null
    ownerUserId: number
    categoryIds: number[]
    locations: Array<{ addressLine: string; ward: string; province: string; latitude?: number | null; longitude?: number | null }>
  }) {
    const business = await this.prisma.$transaction(async (tx) => {
      const createdBusiness = await tx.business.create({
        data: {
          name: params.name,
          description: params.description,
          phone: params.phone,
          email: params.email,
          ownerUserId: BigInt(params.ownerUserId),
          status: 'pending',
          avgRating: 0,
        },
      })

      const locations = await Promise.all(
        params.locations.map((location) =>
          tx.location.create({
            data: {
              addressLine: location.addressLine,
              ward: location.ward,
              province: location.province,
              latitude: location.latitude ?? null,
              longitude: location.longitude ?? null,
            },
          }),
        ),
      )

      await Promise.all(
        locations.map((location) =>
          tx.businessLocation.create({
            data: {
              businessId: createdBusiness.businessId,
              locationId: location.locationId,
            },
          }),
        ),
      )

      await Promise.all(
        params.categoryIds.map((categoryId) =>
          tx.businessCategory.create({
            data: {
              businessId: createdBusiness.businessId,
              categoryId,
            },
          }),
        ),
      )

      return createdBusiness
    })

    return {
      businessId: Number(business.businessId),
      status: business.status,
    }
  }

  async createUnclaimedBusinessWithLocationsAndCategories(params: {
    name: string
    description?: string | null
    phone: string
    email?: string | null
    approvedByUserId: number
    categoryIds: number[]
    locations: Array<{ addressLine: string; ward: string; province: string; latitude?: number | null; longitude?: number | null }>
  }) {
    const business = await this.prisma.$transaction(async (tx) => {
      const createdBusiness = await tx.business.create({
        data: {
          name: params.name,
          description: params.description,
          phone: params.phone,
          email: params.email,
          ownerUserId: null,
          status: 'approved',
          approvedByUserId: BigInt(params.approvedByUserId),
          avgRating: 0,
        },
      })

      const locations = await Promise.all(
        params.locations.map((location) =>
          tx.location.create({
            data: {
              addressLine: location.addressLine,
              ward: location.ward,
              province: location.province,
              latitude: location.latitude ?? null,
              longitude: location.longitude ?? null,
            },
          }),
        ),
      )

      await Promise.all(
        locations.map((location) =>
          tx.businessLocation.create({
            data: {
              businessId: createdBusiness.businessId,
              locationId: location.locationId,
            },
          }),
        ),
      )

      await Promise.all(
        params.categoryIds.map((categoryId) =>
          tx.businessCategory.create({
            data: {
              businessId: createdBusiness.businessId,
              categoryId,
            },
          }),
        ),
      )

      return createdBusiness
    })

    return {
      businessId: Number(business.businessId),
      status: business.status,
    }
  }

  async updateBusiness(businessId: number, data: { name?: string; description?: string; phone?: string; email?: string }) {
    const updated = await this.prisma.business.updateMany({
      where: { businessId, deletedAt: null },
      data: {
        name: data.name,
        description: data.description,
        phone: data.phone,
        email: data.email,
      },
    })
    return { businessId }
  }

  async softDeleteBusiness(businessId: number, actionUserId: number) {
    await this.prisma.$transaction(async (tx) => {
      await tx.business.updateMany({
        where: { businessId, deletedAt: null },
        data: { deletedAt: new Date() },
      })
      await tx.log.create({
        data: {
          action: 'BUSINESS_DELETED',
          entityType: 'Business',
          entityId: BigInt(businessId),
          userId: BigInt(actionUserId),
        },
      })
    })
  }

  async getApprovedBusinessList(query: BusinessListQuery) {
    const searchTerm = query.search?.trim()
    const categoryId = query.categoryId
    const province = query.province?.trim()
    const sortBy = query.sortBy || 'avgRating'
    const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc'
    const page = query.page && query.page > 0 ? query.page : 1
    const limit = Math.min(query.limit ?? 20, 100)
    const offset = (page - 1) * limit

    const whereClauses: string[] = ['b.deleted_at IS NULL', "b.status = 'approved'"]
    const params: any[] = []

    if (searchTerm) {
      params.push(searchTerm)
      whereClauses.push(
        "to_tsvector('simple', b.name || ' ' || coalesce(b.description, '')) @@ plainto_tsquery('simple', $" + params.length + ")",
      )
    }
    if (categoryId) {
      params.push(categoryId)
      whereClauses.push(
        "EXISTS(SELECT 1 FROM business_categories bc WHERE bc.business_id = b.business_id AND bc.category_id = $" + params.length + ")",
      )
    }
    if (province) {
      params.push(province.replace(/^(tỉnh|thành phố|tp\.?)\s*/iu, '').trim().toLocaleLowerCase('vi'))
      whereClauses.push(
        "EXISTS(SELECT 1 FROM business_locations bl JOIN locations l ON l.location_id = bl.location_id WHERE bl.business_id = b.business_id AND regexp_replace(lower(trim(l.province)), '^(tỉnh|thành phố|tp[.]?)[[:space:]]*', '') = $" + params.length + ")",
      )
    }

    const sortColumn =
      sortBy === 'createdAt'
        ? 'b.created_at'
        : sortBy === 'reviewCount'
        ? 'review_count'
        : 'b.avg_rating'

    const [raw, countRows] = await Promise.all([
      this.prisma.$queryRawUnsafe(
        `SELECT
        b.business_id as "businessId",
        b.name,
        b.description,
        b.avg_rating as "avgRating",
        COALESCE(COUNT(DISTINCT r.review_id) FILTER (WHERE r.status = 'approved' AND r.deleted_at IS NULL), 0) AS "reviewCount",
        (
          SELECT l.province
          FROM business_locations bl
          JOIN locations l ON l.location_id = bl.location_id
          WHERE bl.business_id = b.business_id
          LIMIT 1
        ) AS province,
        (
          SELECT l.latitude
          FROM business_locations bl
          JOIN locations l ON l.location_id = bl.location_id
          WHERE bl.business_id = b.business_id AND l.latitude IS NOT NULL
          LIMIT 1
        ) AS latitude,
        (
          SELECT l.longitude
          FROM business_locations bl
          JOIN locations l ON l.location_id = bl.location_id
          WHERE bl.business_id = b.business_id AND l.longitude IS NOT NULL
          LIMIT 1
        ) AS longitude,
        (
          SELECT i.secure_url
          FROM images i
          WHERE i.business_id = b.business_id AND i.image_type = 'BUSINESS_LOGO'
          LIMIT 1
        ) AS "logoUrl",
        COALESCE(JSON_AGG(DISTINCT JSONB_BUILD_OBJECT('categoryId', c.category_id, 'categoryName', c.category_name)) FILTER (WHERE c.category_id IS NOT NULL), '[]') AS categories
      FROM businesses b
      LEFT JOIN reviews r ON r.business_id = b.business_id AND r.status = 'approved' AND r.deleted_at IS NULL
      LEFT JOIN business_categories bc ON bc.business_id = b.business_id
      LEFT JOIN categories c ON c.category_id = bc.category_id
      WHERE ${whereClauses.join(' AND ')}
      GROUP BY b.business_id
      ORDER BY ${sortColumn} ${sortOrder}
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        ...params,
        limit,
        offset,
      ),
      this.prisma.$queryRawUnsafe(
        `SELECT COUNT(*) as total FROM businesses b WHERE ${whereClauses.join(' AND ')}`,
        ...params,
      ),
    ])

    return {
      items: (raw as any[]).map((row) => ({
        businessId: Number(row.businessId),
        name: row.name,
        description: row.description,
        avgRating: Number(row.avgRating),
        reviewCount: Number(row.reviewCount),
        status: 'approved',
        province: row.province,
        latitude: row.latitude !== null && row.latitude !== undefined ? Number(row.latitude) : null,
        longitude: row.longitude !== null && row.longitude !== undefined ? Number(row.longitude) : null,
        categories: row.categories || [],
        logoUrl: row.logoUrl ?? null,
      })),
      total: Number((countRows as any[])[0]?.total ?? 0),
    }
  }

  async getMyBusinesses(userId: number, page: number, limit: number) {
    const offset = (page - 1) * limit
    const where = { ownerUserId: BigInt(userId), deletedAt: null }
    const [businesses, total] = await Promise.all([
      this.prisma.business.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      this.prisma.business.count({ where }),
    ])
    return {
      items: businesses.map((business) => ({
        businessId: Number(business.businessId),
        name: business.name,
        status: business.status,
        avgRating: Number(business.avgRating),
        createdAt: business.createdAt.toISOString(),
      })),
      total,
    }
  }

  async getBusinessDetail(businessId: number) {
    const business = await this.prisma.business.findFirst({
      where: { businessId, deletedAt: null },
      include: {
        owner: true,
        businessCategories: { include: { category: true } },
        locations: { include: { location: true } },
        images: {
          where: { imageType: { in: ['BUSINESS_COVER', 'BUSINESS_LOGO', 'BUSINESS_GALLERY'] } },
          orderBy: { displayOrder: 'asc' },
        },
      },
    })
    if (!business) {
      return null
    }

    const reviewCount = await this.prisma.review.count({
      where: { businessId: business.businessId, status: 'approved', deletedAt: null },
    })

    const cover = business.images.find((image) => image.imageType === 'BUSINESS_COVER')
    const logo = business.images.find((image) => image.imageType === 'BUSINESS_LOGO')
    const gallery = business.images.filter((image) => image.imageType === 'BUSINESS_GALLERY')

    return {
      businessId: Number(business.businessId),
      name: business.name,
      description: business.description,
      phone: business.phone,
      email: business.email,
      avgRating: Number(business.avgRating),
      reviewCount,
      status: business.status,
      owner: business.owner
        ? {
            userId: Number(business.owner.userId),
            name: business.owner.name,
          }
        : null,
      categories: business.businessCategories.map((bc) => ({
        categoryId: bc.category.categoryId,
        categoryName: bc.category.categoryName,
      })),
      locations: business.locations.map((bl) => ({
        locationId: Number(bl.location.locationId),
        addressLine: bl.location.addressLine,
        ward: bl.location.ward,
        province: bl.location.province,
        latitude: bl.location.latitude ? Number(bl.location.latitude) : null,
        longitude: bl.location.longitude ? Number(bl.location.longitude) : null,
      })),
      coverUrl: cover?.secureUrl ?? null,
      logoUrl: logo?.secureUrl ?? null,
      gallery: gallery.map((image) => ({
        imageId: Number(image.imageId),
        url: image.secureUrl,
        displayOrder: image.displayOrder,
      })),
      createdAt: business.createdAt.toISOString(),
    }
  }

  async getBusinessStatistics(businessId: number) {
    const business = await this.prisma.business.findFirst({
      where: { businessId, deletedAt: null },
      select: { avgRating: true },
    })
    const reviewCount = await this.prisma.review.count({
      where: { businessId, status: 'approved', deletedAt: null },
    })
    const grouped = await this.prisma.review.groupBy({
      by: ['overallRating'],
      where: { businessId, status: 'approved', deletedAt: null },
      _count: { overallRating: true },
    })
    const ranking = await this.prisma.rankingSnapshot.findFirst({
      where: { businessId: BigInt(businessId), scope: 'business' },
    })

    const ratingDistribution = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    }
    grouped.forEach((item) => {
      ratingDistribution[item.overallRating] = item._count.overallRating
    })

    return {
      reviewCount,
      avgRating: business ? Number(business.avgRating) : 0,
      rankingPosition: ranking ? ranking.rank : null,
      ratingDistribution,
    }
  }

  async getReviewTrend(businessId: number): Promise<ReviewTrendPoint[]> {
    const now = new Date()
    const startMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 11, 1))

    const rows = await this.prisma.$queryRaw<Array<{ month: string; reviewCount: bigint }>>`
      SELECT to_char(date_trunc('month', created_at), 'YYYY-MM') as month,
             COUNT(*)::bigint as "reviewCount"
      FROM reviews
      WHERE business_id = ${businessId}
        AND status = 'approved'
        AND deleted_at IS NULL
        AND created_at >= ${startMonth}
      GROUP BY 1
      ORDER BY 1
    `
    const countByMonth = new Map(rows.map((row) => [row.month, Number(row.reviewCount)]))

    const trend: ReviewTrendPoint[] = []
    for (let i = 0; i < 12; i++) {
      const date = new Date(Date.UTC(startMonth.getUTCFullYear(), startMonth.getUTCMonth() + i, 1))
      const month = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`
      trend.push({ month, reviewCount: countByMonth.get(month) ?? 0 })
    }
    return trend
  }

  async countLocations(businessId: number) {
    return this.prisma.businessLocation.count({
      where: { businessId: BigInt(businessId) },
    })
  }

  async findBusinessLocation(businessId: number, locationId: number) {
    const relation = await this.prisma.businessLocation.findUnique({
      where: {
        businessId_locationId: {
          businessId: BigInt(businessId),
          locationId: BigInt(locationId),
        },
      },
    })
    if (!relation) {
      return null
    }
    return {
      businessId: Number(relation.businessId),
      locationId: Number(relation.locationId),
    }
  }

  private mapToEntity(business: any) {
    return {
      businessId: Number(business.businessId),
      name: business.name,
      description: business.description,
      phone: business.phone,
      email: business.email,
      status: business.status,
      avgRating: Number(business.avgRating),
      ownerUserId: business.ownerUserId !== null ? Number(business.ownerUserId) : null,
      createdAt: business.createdAt,
      updatedAt: business.updatedAt,
      deletedAt: business.deletedAt,
    }
  }
}
