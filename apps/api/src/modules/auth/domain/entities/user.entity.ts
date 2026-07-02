export class UserEntity {
  userId!: number
  name!: string
  email!: string
  password!: string
  roleName!: string
  status!: string
  deletedAt?: Date | null
  role?: { roleName?: string }
  roleId?: number
}
