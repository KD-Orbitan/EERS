import { Injectable } from '@nestjs/common'
import type { UploadApiResponse } from 'cloudinary'
import { CloudinaryService } from '../../../../infrastructure/storage/cloudinary.service'
import { BusinessImageRepository } from '../../domain/repositories/business-image.repository'
import { ValidateBusinessOwnershipUseCase } from './validate-business-ownership.use-case'
import { assertValidImageFile } from '../../../../common/validators/image-file.validator'

@Injectable()
export class UploadCoverUseCase {
  constructor(
    private readonly businessImageRepository: BusinessImageRepository,
    private readonly cloudinaryService: CloudinaryService,
    private readonly validateBusinessOwnershipUseCase: ValidateBusinessOwnershipUseCase,
  ) {}

  async execute({
    businessId,
    user,
    file,
  }: {
    businessId: number
    user: { userId: number; role: string }
    file: Express.Multer.File
  }) {
    await this.validateBusinessOwnershipUseCase.execute({ businessId, user })
    assertValidImageFile(file)

    const existingCover = await this.businessImageRepository.findCoverByBusinessId(businessId)
    if (existingCover) {
      await this.cloudinaryService.deleteImage(existingCover.cloudinaryPublicId)
      await this.businessImageRepository.deleteById(existingCover.imageId)
    }

    const uploadResult = (await this.cloudinaryService.uploadImage(
      file.buffer,
      `cover-${businessId}-${Date.now()}`,
    )) as UploadApiResponse

    const created = await this.businessImageRepository.createCover({
      businessId,
      cloudinaryPublicId: uploadResult.public_id,
      secureUrl: uploadResult.secure_url,
      width: uploadResult.width,
      height: uploadResult.height,
      format: uploadResult.format,
    })

    return { coverUrl: created.secureUrl }
  }
}
