import { ReorderGalleryUseCase } from '../application/use-cases/reorder-gallery.use-case'
import { BusinessImageRepository } from '../domain/repositories/business-image.repository'
import { ValidateBusinessOwnershipUseCase } from '../application/use-cases/validate-business-ownership.use-case'
import { ImageNotFoundException } from '../../../common/exceptions/file.exceptions'

describe('ReorderGalleryUseCase', () => {
  let useCase: ReorderGalleryUseCase
  let businessImageRepository: jest.Mocked<Pick<BusinessImageRepository, 'findGalleryImagesByIds' | 'updateGalleryDisplayOrders'>>
  let validateBusinessOwnershipUseCase: jest.Mocked<Pick<ValidateBusinessOwnershipUseCase, 'execute'>>

  beforeEach(() => {
    businessImageRepository = { findGalleryImagesByIds: jest.fn(), updateGalleryDisplayOrders: jest.fn() }
    validateBusinessOwnershipUseCase = { execute: jest.fn().mockResolvedValue({ businessId: 1, ownerUserId: 5 }) }

    useCase = new ReorderGalleryUseCase(
      businessImageRepository as unknown as BusinessImageRepository,
      validateBusinessOwnershipUseCase as unknown as ValidateBusinessOwnershipUseCase,
    )
  })

  it('updates displayOrder for all specified images', async () => {
    businessImageRepository.findGalleryImagesByIds.mockResolvedValue([
      { imageId: 10, cloudinaryPublicId: 'a', secureUrl: 'https://cdn/a.png', displayOrder: 1 },
      { imageId: 11, cloudinaryPublicId: 'b', secureUrl: 'https://cdn/b.png', displayOrder: 2 },
    ])

    const result = await useCase.execute({ businessId: 1, user: { userId: 5, role: 'BUSINESS_OWNER' }, imageIds: [11, 10] })

    expect(businessImageRepository.updateGalleryDisplayOrders).toHaveBeenCalledWith([
      { imageId: 11, displayOrder: 1 },
      { imageId: 10, displayOrder: 2 },
    ])
    expect(result).toEqual({ message: 'Gallery reordered successfully' })
  })

  it('throws IMAGE_NOT_FOUND if imageIds do not all belong to business', async () => {
    businessImageRepository.findGalleryImagesByIds.mockResolvedValue([
      { imageId: 10, cloudinaryPublicId: 'a', secureUrl: 'https://cdn/a.png', displayOrder: 1 },
    ])

    await expect(
      useCase.execute({ businessId: 1, user: { userId: 5, role: 'BUSINESS_OWNER' }, imageIds: [10, 999] }),
    ).rejects.toBeInstanceOf(ImageNotFoundException)
    expect(businessImageRepository.updateGalleryDisplayOrders).not.toHaveBeenCalled()
  })
})
