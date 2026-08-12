import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../../infrastructure/database/prisma.service'
import { UserRepository } from '../../domain/repositories/user.repository'
import { UserMapper } from './user.mapper'
import { UserEntity } from '../../domain/entities/user.entity'

@Injectable()
export class PrismaUserRepository extends UserRepository {
  constructor(private readonly prisma: PrismaService) {
    super()
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findFirst({
      where: { email, deletedAt: null },
      include: { role: true, images: { where: { imageType: 'AVATAR' }, take: 1 } },
    })

    return user ? UserMapper.toEntity(user as any) : null
  }

  async findById(userId: number): Promise<UserEntity | null> {
    const user = await this.prisma.user.findFirst({
      where: { userId: Number(userId), deletedAt: null },
      include: { role: true, images: { where: { imageType: 'AVATAR' }, take: 1 } },
    })

    return user ? UserMapper.toEntity(user as any) : null
  }

  async create(user: Partial<UserEntity>): Promise<UserEntity> {
    const created = await this.prisma.user.create({
      data: UserMapper.toCreateData(user),
      include: { role: true },
    })

    return UserMapper.toEntity(created as any)
  }

  async findRoleByName(roleName: string): Promise<{ roleId: number; roleName: string } | null> {
    return this.prisma.role.findUnique({ where: { roleName } })
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

  async findUserIdsByRole(roleName: string): Promise<number[]> {
    const users = await this.prisma.user.findMany({
      where: { deletedAt: null, role: { roleName } },
      select: { userId: true },
    })

    return users.map((user) => Number(user.userId))
  }
}
