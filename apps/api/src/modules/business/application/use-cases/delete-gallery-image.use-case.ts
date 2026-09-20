import { Injectable } from '@nestjs/common'
import { ImageStorage } from '../../../../common/ports/image-storage.port'
import { BusinessImageRepository } from '../../domain/repositories/business-image.repository'
import { ValidateBusinessOwnershipUseCase } from './validate-business-ownership.use-case'
import { ImageNotFoundException } from '../../../../common/exceptions/file.exceptions'

@Injectable()
export class DeleteGalleryImageUseCase {
  constructor(
    private readonly businessImageRepository: BusinessImageRepository,
    private readonly imageStorage: ImageStorage,
    private readonly validateBusinessOwnershipUseCase: ValidateBusinessOwnershipUseCase,
  ) {}

  async execute({
    businessId,
    user,
    imageId,
  }: {
    businessId: number
    user: { userId: number; role: string }
    imageId: number
  }) {
    await this.validateBusinessOwnershipUseCase.execute({ businessId, user })

    const image = await this.businessImageRepository.findGalleryImage(businessId, imageId)
    if (!image) {
      throw new ImageNotFoundException()
    }

    await this.imageStorage.deleteImage(image.cloudinaryPublicId)
    await this.businessImageRepository.deleteById(image.imageId)
  }
}
