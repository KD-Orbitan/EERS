import type { Prisma } from '@prisma/client'
import type { UserEntity } from '../../domain/entities/user.entity'

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

export class UserMapper {
  static toEntity(user: PrismaUserWithRole): UserEntity {
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
      role: user.role,
    }
  }

  static toCreateData(user: Partial<UserEntity>) {
    return {
      name: user.name!,
      email: user.email!,
      password: user.password!,
      roleId: user.roleId as number,
      status: (user.status as any) || 'active',
    }
  }
}
