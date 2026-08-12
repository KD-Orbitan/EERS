import type { Prisma } from '@prisma/client'
import type { UserEntity } from '../../domain/entities/user.entity'

interface PrismaUserWithRole {
  userId: bigint
  name: string
  email: string
  password: string
  status: string
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
  roleId: number
  role: { roleName: string; roleId: number }
  images?: Array<{ secureUrl: string }>
}

export class UserMapper {
  static toEntity(user: PrismaUserWithRole): UserEntity {
    return {
      userId: Number(user.userId),
      name: user.name,
      email: user.email,
      password: user.password,
      status: user.status,
      avatarUrl: user.images?.[0]?.secureUrl ?? null,
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
