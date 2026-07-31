export class UserEntity {
  /** Auto-generated primary key for the user */
  userId!: number

  /** Display name of the user */
  name!: string

  /** Unique email address */
  email!: string

  /** Bcrypt hashed password */
  password!: string

  /** Current user status */
  status!: string

  /** Optional publicly exposed avatar URL */
  avatarUrl?: string | null

  /** Role name derived from the user's role relation */
  roleName?: string

  /** Foreign key to the role record */
  roleId?: number

  /** Creation timestamp */
  createdAt?: Date

  /** Last update timestamp */
  updatedAt?: Date

  /** Soft delete timestamp */
  deletedAt?: Date | null

  /** Optional role relation payload */
  role?: { roleName?: string }
}
