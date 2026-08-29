import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../../infrastructure/database/prisma.service'

@Injectable()
export class ListAdminBusinessesUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute({ status = 'pending', search, page = 1, limit = 20 }: { status?: string; search?: string; page?: number; limit?: number }) {
    const where = {
      deletedAt: null,
      status: status as 'pending' | 'approved' | 'rejected' | 'hidden',
      ...(search ? { name: { contains: search, mode: 'insensitive' as const } } : {}),
    }

    const [businesses, total] = await Promise.all([
      this.prisma.business.findMany({
        where,
        include: { owner: true, businessCategories: { include: { category: true } } },
        orderBy: { createdAt: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.business.count({ where }),
    ])

    const items = businesses.map((business) => ({
      businessId: Number(business.businessId),
      name: business.name,
      status: business.status,
      ownerName: business.owner?.name ?? null,
      phone: business.phone,
      createdAt: business.createdAt.toISOString(),
      categories: business.businessCategories.map((bc) => ({
        categoryId: bc.category.categoryId,
        categoryName: bc.category.categoryName,
      })),
    }))

    return { items, total }
  }
}
