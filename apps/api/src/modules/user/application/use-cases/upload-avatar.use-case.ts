import { Injectable } from '@nestjs/common'
import { ImageStorage } from '../../../../common/ports/image-storage.port'
import { UserImageRepository } from '../../domain/repositories/user-image.repository'
import { assertValidImageFile } from '../../../../common/validators/image-file.validator'

@Injectable()
export class UploadAvatarUseCase {
  constructor(
    private readonly userImageRepository: UserImageRepository,
    private readonly imageStorage: ImageStorage,
  ) {}

  async execute({ userId, file }: { userId: number; file: Express.Multer.File }) {
    assertValidImageFile(file)

    const existingAvatar = await this.userImageRepository.findAvatarByUserId(userId)
    if (existingAvatar) {
      await this.imageStorage.deleteImage(existingAvatar.cloudinaryPublicId)
      await this.userImageRepository.deleteById(existingAvatar.imageId)
    }

    const uploadResult = await this.imageStorage.uploadImage(
      file.buffer,
      `avatar-${userId}-${Date.now()}`,
    )

    const created = await this.userImageRepository.createAvatar({
      userId,
      cloudinaryPublicId: uploadResult.publicId,
      secureUrl: uploadResult.secureUrl,
      width: uploadResult.width,
      height: uploadResult.height,
      format: uploadResult.format,
    })

    return { avatarUrl: created.secureUrl }
  }
}
