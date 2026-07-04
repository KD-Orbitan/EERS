import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../../infrastructure/database/prisma.service'
import { UserRepository } from '../../domain/repositories/user.repository'
import { UserEntity } from '../../domain/entities/user.entity'

interface PrismaUserWithRole {
  userId: bigint
  name: string
  email: string
  password: string
  status: string
  avatarUrl: string | null
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
  roleId: number
  role: { roleName: string; roleId: number }
}

@Injectable()
export class PrismaUserRepository extends UserRepository {
  constructor(private readonly prisma: PrismaService) {
    super()
  }

  async findById(userId: number): Promise<UserEntity | null> {
    const user = await this.prisma.user.findFirst({
      where: { userId: Number(userId), deletedAt: null },
      include: { role: true },
    })

    return user ? this.mapToEntity(user as PrismaUserWithRole) : null
  }

  async updateProfile(userId: number, name: string): Promise<{ userId: number; name: string }> {
    const updated = await this.prisma.user.update({
      where: { userId: Number(userId) },
      data: { name },
      select: { userId: true, name: true },
    })

    return { userId: Number(updated.userId), name: updated.name }
  }

  async updatePassword(userId: number, passwordHash: string): Promise<{ userId: number }> {
    const updated = await this.prisma.user.update({
      where: { userId: Number(userId) },
      data: { password: passwordHash },
      select: { userId: true },
    })

    return { userId: Number(updated.userId) }
  }

  private mapToEntity(user: PrismaUserWithRole): UserEntity {
    return {
      userId: Number(user.userId),
      name: user.name,
      email: user.email,
      password: user.password,
      status: user.status,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      deletedAt: user.deletedAt,
      roleName: user.role?.roleName,
      roleId: user.roleId,
    }
  }
}
