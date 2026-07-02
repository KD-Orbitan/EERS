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
  deletedAt: Date | null
  roleId: number
  createdAt: Date
  updatedAt: Date
  role: { roleName: string; roleId: number }
}

@Injectable()
export class PrismaUserRepository extends UserRepository {
  constructor(private readonly prisma: PrismaService) {
    super()
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findFirst({
      where: { email, deletedAt: null },
      include: { role: true },
    })
    return user ? this.mapToEntity(user as PrismaUserWithRole) : null
  }

  async findById(userId: number): Promise<UserEntity | null> {
    const user = await this.prisma.user.findFirst({
      where: { userId, deletedAt: null },
      include: { role: true },
    })
    return user ? this.mapToEntity(user as PrismaUserWithRole) : null
  }

  async create(user: Partial<UserEntity>): Promise<UserEntity> {
    const created = await this.prisma.user.create({
      data: {
        name: user.name!,
        email: user.email!,
        password: user.password!,
        roleId: user.roleId as number,
        status: (user.status as any) || 'active',
      },
      include: { role: true },
    })
    return this.mapToEntity(created as PrismaUserWithRole)
  }

  private mapToEntity(user: PrismaUserWithRole): UserEntity {
    return {
      userId: Number(user.userId),
      name: user.name,
      email: user.email,
      password: user.password,
      roleName: user.role?.roleName || 'USER',
      status: user.status,
      deletedAt: user.deletedAt,
      role: user.role,
      roleId: user.roleId,
    }
  }

  async findRoleByName(roleName: string): Promise<{ roleId: number; roleName: string } | null> {
    return this.prisma.role.findUnique({ where: { roleName } })
  }
}
