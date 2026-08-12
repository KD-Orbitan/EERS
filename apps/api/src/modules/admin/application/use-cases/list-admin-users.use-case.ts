import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../../infrastructure/database/prisma.service'

@Injectable()
export class ListAdminUsersUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute({ status, search, page = 1, limit = 20 }: { status?: string; search?: string; page?: number; limit?: number }) {
    const where = {
      deletedAt: null,
      ...(status ? { status: status as 'active' | 'inactive' | 'banned' } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' as const } },
              { email: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: { role: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ])

    const items = users.map((user) => ({
      userId: Number(user.userId),
      name: user.name,
      email: user.email,
      role: user.role.roleName,
      status: user.status,
      createdAt: user.createdAt.toISOString(),
    }))

    return { items, total }
  }
}
