export class UserEntity {
  userId!: number
  name!: string
  email!: string
  password!: string
  status!: string
  avatarUrl?: string | null
  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Date | null
  roleName?: string
  roleId?: number
}
