export interface UserAvatarImage {
  imageId: number
  cloudinaryPublicId: string
  secureUrl: string
}

export interface CreateAvatarInput {
  userId: number
  cloudinaryPublicId: string
  secureUrl: string
  width?: number | null
  height?: number | null
  format?: string | null
}

export abstract class UserImageRepository {
  /**
   * Find the current avatar image for a user, if any.
   */
  abstract findAvatarByUserId(userId: number): Promise<UserAvatarImage | null>

  /**
   * Create a new avatar image record for a user.
   */
  abstract createAvatar(input: CreateAvatarInput): Promise<UserAvatarImage>

  /**
   * Delete an image record by id.
   */
  abstract deleteById(imageId: number): Promise<void>
}
