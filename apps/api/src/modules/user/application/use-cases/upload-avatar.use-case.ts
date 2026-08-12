import { Injectable } from '@nestjs/common'
import type { UploadApiResponse } from 'cloudinary'
import { CloudinaryService } from '../../../../infrastructure/storage/cloudinary.service'
import { UserImageRepository } from '../../domain/repositories/user-image.repository'
import { assertValidImageFile } from '../../../../common/validators/image-file.validator'

@Injectable()
export class UploadAvatarUseCase {
  constructor(
    private readonly userImageRepository: UserImageRepository,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async execute({ userId, file }: { userId: number; file: Express.Multer.File }) {
    assertValidImageFile(file)

    const existingAvatar = await this.userImageRepository.findAvatarByUserId(userId)
    if (existingAvatar) {
      await this.cloudinaryService.deleteImage(existingAvatar.cloudinaryPublicId)
      await this.userImageRepository.deleteById(existingAvatar.imageId)
    }

    const uploadResult = (await this.cloudinaryService.uploadImage(
      file.buffer,
      `avatar-${userId}-${Date.now()}`,
    )) as UploadApiResponse

    const created = await this.userImageRepository.createAvatar({
      userId,
      cloudinaryPublicId: uploadResult.public_id,
      secureUrl: uploadResult.secure_url,
      width: uploadResult.width,
      height: uploadResult.height,
      format: uploadResult.format,
    })

    return { avatarUrl: created.secureUrl }
  }
}
