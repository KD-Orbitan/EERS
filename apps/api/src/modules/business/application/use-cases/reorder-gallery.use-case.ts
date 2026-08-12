import { Injectable } from '@nestjs/common'
import { BusinessImageRepository } from '../../domain/repositories/business-image.repository'
import { ValidateBusinessOwnershipUseCase } from './validate-business-ownership.use-case'
import { ImageNotFoundException } from '../../../../common/exceptions/file.exceptions'

@Injectable()
export class ReorderGalleryUseCase {
  constructor(
    private readonly businessImageRepository: BusinessImageRepository,
    private readonly validateBusinessOwnershipUseCase: ValidateBusinessOwnershipUseCase,
  ) {}

  async execute({
    businessId,
    user,
    imageIds,
  }: {
    businessId: number
    user: { userId: number; role: string }
    imageIds: number[]
  }) {
    await this.validateBusinessOwnershipUseCase.execute({ businessId, user })

    const images = await this.businessImageRepository.findGalleryImagesByIds(businessId, imageIds)
    if (images.length !== imageIds.length) {
      throw new ImageNotFoundException('One or more images do not belong to this business gallery')
    }

    await this.businessImageRepository.updateGalleryDisplayOrders(
      imageIds.map((imageId, index) => ({ imageId, displayOrder: index + 1 })),
    )

    return { message: 'Gallery reordered successfully' }
  }
}
