import { Injectable } from '@nestjs/common'
import type { UploadApiResponse } from 'cloudinary'
import { CloudinaryService } from '../../../../infrastructure/storage/cloudinary.service'
import { BusinessImageRepository } from '../../domain/repositories/business-image.repository'
import { ValidateBusinessOwnershipUseCase } from './validate-business-ownership.use-case'
import { assertValidImageFile } from '../../../../common/validators/image-file.validator'
import { GalleryLimitExceededException } from '../../domain/exceptions/business.exceptions'

const MAX_GALLERY_IMAGES = 20

@Injectable()
export class UploadGalleryUseCase {
  constructor(
    private readonly businessImageRepository: BusinessImageRepository,
    private readonly cloudinaryService: CloudinaryService,
    private readonly validateBusinessOwnershipUseCase: ValidateBusinessOwnershipUseCase,
  ) {}

  async execute({
    businessId,
    user,
    files,
  }: {
    businessId: number
    user: { userId: number; role: string }
    files: Express.Multer.File[]
  }) {
    await this.validateBusinessOwnershipUseCase.execute({ businessId, user })
    files.forEach(assertValidImageFile)

    const existingCount = await this.businessImageRepository.countGalleryImages(businessId)
    if (existingCount + files.length > MAX_GALLERY_IMAGES) {
      throw new GalleryLimitExceededException()
    }

    const maxDisplayOrder = await this.businessImageRepository.getMaxGalleryDisplayOrder(businessId)

    const uploadResults = (await Promise.all(
      files.map((file, index) => this.cloudinaryService.uploadImage(file.buffer, `gallery-${businessId}-${Date.now()}-${index}`)),
    )) as UploadApiResponse[]

    const created = await this.businessImageRepository.createGalleryImages(
      uploadResults.map((result, index) => ({
        businessId,
        cloudinaryPublicId: result.public_id,
        secureUrl: result.secure_url,
        width: result.width,
        height: result.height,
        format: result.format,
        displayOrder: maxDisplayOrder + index + 1,
      })),
    )

    return {
      images: created.map((image) => ({
        imageId: image.imageId,
        url: image.secureUrl,
        displayOrder: image.displayOrder,
      })),
    }
  }
}
