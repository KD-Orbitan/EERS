export interface BusinessCoverImage {
  imageId: number
  cloudinaryPublicId: string
  secureUrl: string
}

export interface BusinessLogoImage {
  imageId: number
  cloudinaryPublicId: string
  secureUrl: string
}

export interface BusinessGalleryImage {
  imageId: number
  cloudinaryPublicId: string
  secureUrl: string
  displayOrder: number | null
}

export interface CreateBusinessImageInput {
  businessId: number
  cloudinaryPublicId: string
  secureUrl: string
  width?: number | null
  height?: number | null
  format?: string | null
}

export interface CreateGalleryImageInput extends CreateBusinessImageInput {
  displayOrder: number
}

export abstract class BusinessImageRepository {
  abstract findCoverByBusinessId(businessId: number): Promise<BusinessCoverImage | null>
  abstract createCover(input: CreateBusinessImageInput): Promise<BusinessCoverImage>

  abstract findLogoByBusinessId(businessId: number): Promise<BusinessLogoImage | null>
  abstract createLogo(input: CreateBusinessImageInput): Promise<BusinessLogoImage>

  abstract deleteById(imageId: number): Promise<void>

  abstract countGalleryImages(businessId: number): Promise<number>
  abstract getMaxGalleryDisplayOrder(businessId: number): Promise<number>
  abstract createGalleryImages(inputs: CreateGalleryImageInput[]): Promise<BusinessGalleryImage[]>
  abstract findGalleryImage(businessId: number, imageId: number): Promise<BusinessGalleryImage | null>
  abstract findGalleryImagesByIds(businessId: number, imageIds: number[]): Promise<BusinessGalleryImage[]>
  abstract updateGalleryDisplayOrders(items: Array<{ imageId: number; displayOrder: number }>): Promise<void>
}
