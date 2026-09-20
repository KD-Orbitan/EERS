import { Injectable } from '@nestjs/common'
import { ImageStorage } from '../../../../common/ports/image-storage.port'
import { BusinessImageRepository } from '../../domain/repositories/business-image.repository'
import { ValidateBusinessOwnershipUseCase } from './validate-business-ownership.use-case'
import { ImageNotFoundException } from '../../../../common/exceptions/file.exceptions'

@Injectable()
export class DeleteCoverUseCase {
  constructor(
    private readonly businessImageRepository: BusinessImageRepository,
    private readonly imageStorage: ImageStorage,
    private readonly validateBusinessOwnershipUseCase: ValidateBusinessOwnershipUseCase,
  ) {}

  async execute({ businessId, user }: { businessId: number; user: { userId: number; role: string } }) {
    await this.validateBusinessOwnershipUseCase.execute({ businessId, user })

    const cover = await this.businessImageRepository.findCoverByBusinessId(businessId)
    if (!cover) {
      throw new ImageNotFoundException()
    }

    await this.imageStorage.deleteImage(cover.cloudinaryPublicId)
    await this.businessImageRepository.deleteById(cover.imageId)
  }
}
