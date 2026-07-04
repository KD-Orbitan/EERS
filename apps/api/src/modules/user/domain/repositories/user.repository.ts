import { UserEntity } from '../entities/user.entity'

export abstract class UserRepository {
  abstract findById(userId: number): Promise<UserEntity | null>
  abstract updateProfile(userId: number, name: string): Promise<{ userId: number; name: string }>
  abstract updatePassword(userId: number, passwordHash: string): Promise<{ userId: number }>
}
