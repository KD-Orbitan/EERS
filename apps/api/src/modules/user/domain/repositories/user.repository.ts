import { UserEntity } from '../entities/user.entity'

export abstract class UserRepository {
  /**
   * Find a user by email address.
   * Returns null if no active user exists for the email.
   */
  abstract findByEmail(email: string): Promise<UserEntity | null>

  /**
   * Find a user by primary key.
   * Returns null if the user is deleted or missing.
   */
  abstract findById(userId: number): Promise<UserEntity | null>

  /**
   * Create a new user record.
   */
  abstract create(user: Partial<UserEntity>): Promise<UserEntity>

  /**
   * Find a role by its name.
   * Used during user registration and auth flows.
   */
  abstract findRoleByName(roleName: string): Promise<{ roleId: number; roleName: string } | null>

  /**
   * Update a user's profile fields.
   */
  abstract updateProfile(userId: number, name: string): Promise<{ userId: number; name: string }>

  /**
   * Update a user's password hash.
   */
  abstract updatePassword(userId: number, passwordHash: string): Promise<{ userId: number }>
}
