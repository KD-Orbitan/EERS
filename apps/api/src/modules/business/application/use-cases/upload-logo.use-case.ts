import { Injectable } from '@nestjs/common'
import type { UploadApiResponse } from 'cloudinary'
import { CloudinaryService } from '../../../../infrastructure/storage/cloudinary.service'
import { BusinessImageRepository } from '../../domain/repositories/business-image.repository'
import { ValidateBusinessOwnershipUseCase } from './validate-business-ownership.use-case'
import { assertValidImageFile } from '../../../../common/validators/image-file.validator'

@Injectable()
export class UploadLogoUseCase {
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

    const existingLogo = await this.businessImageRepository.findLogoByBusinessId(businessId)
    if (existingLogo) {
      await this.cloudinaryService.deleteImage(existingLogo.cloudinaryPublicId)
      await this.businessImageRepository.deleteById(existingLogo.imageId)
    }

    const uploadResult = (await this.cloudinaryService.uploadImage(
      file.buffer,
      `logo-${businessId}-${Date.now()}`,
    )) as UploadApiResponse

    const created = await this.businessImageRepository.createLogo({
      businessId,
      cloudinaryPublicId: uploadResult.public_id,
      secureUrl: uploadResult.secure_url,
      width: uploadResult.width,
      height: uploadResult.height,
      format: uploadResult.format,
    })

    return { logoUrl: created.secureUrl }
  }
}
