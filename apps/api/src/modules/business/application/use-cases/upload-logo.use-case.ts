import { Injectable } from '@nestjs/common'
import { ImageStorage } from '../../../../common/ports/image-storage.port'
import { BusinessImageRepository } from '../../domain/repositories/business-image.repository'
import { ValidateBusinessOwnershipUseCase } from './validate-business-ownership.use-case'
import { assertValidImageFile } from '../../../../common/validators/image-file.validator'

@Injectable()
export class UploadLogoUseCase {
  constructor(
    private readonly businessImageRepository: BusinessImageRepository,
    private readonly imageStorage: ImageStorage,
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
      await this.imageStorage.deleteImage(existingLogo.cloudinaryPublicId)
      await this.businessImageRepository.deleteById(existingLogo.imageId)
    }

    const uploadResult = await this.imageStorage.uploadImage(
      file.buffer,
      `logo-${businessId}-${Date.now()}`,
    )

    const created = await this.businessImageRepository.createLogo({
      businessId,
      cloudinaryPublicId: uploadResult.publicId,
      secureUrl: uploadResult.secureUrl,
      width: uploadResult.width,
      height: uploadResult.height,
      format: uploadResult.format,
    })

    return { logoUrl: created.secureUrl }
  }
}
