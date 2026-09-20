import { Injectable } from '@nestjs/common'
import { ImageStorage } from '../../../../common/ports/image-storage.port'
import { BusinessImageRepository } from '../../domain/repositories/business-image.repository'
import { ValidateBusinessOwnershipUseCase } from './validate-business-ownership.use-case'
import { ImageNotFoundException } from '../../../../common/exceptions/file.exceptions'

@Injectable()
export class DeleteLogoUseCase {
  constructor(
    private readonly businessImageRepository: BusinessImageRepository,
    private readonly imageStorage: ImageStorage,
    private readonly validateBusinessOwnershipUseCase: ValidateBusinessOwnershipUseCase,
  ) {}

  async execute({ businessId, user }: { businessId: number; user: { userId: number; role: string } }) {
    await this.validateBusinessOwnershipUseCase.execute({ businessId, user })

    const logo = await this.businessImageRepository.findLogoByBusinessId(businessId)
    if (!logo) {
      throw new ImageNotFoundException()
    }

    await this.imageStorage.deleteImage(logo.cloudinaryPublicId)
    await this.businessImageRepository.deleteById(logo.imageId)
  }
}
