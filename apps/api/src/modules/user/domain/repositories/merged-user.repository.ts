import { UserEntity } from '../entities/user.entity'

export abstract class UserRepository {
  abstract findByEmail(email: string): Promise<UserEntity | null>
  abstract findById(userId: number): Promise<UserEntity | null>
  abstract create(user: Partial<UserEntity>): Promise<UserEntity>
  abstract findRoleByName(roleName: string): Promise<{ roleId: number; roleName: string } | null>
  abstract updateProfile(userId: number, name: string): Promise<{ userId: number; name: string }>
  abstract updatePassword(userId: number, passwordHash: string): Promise<{ userId: number }>
}
