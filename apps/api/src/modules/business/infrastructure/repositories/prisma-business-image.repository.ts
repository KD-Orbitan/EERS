import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../../infrastructure/database/prisma.service'
import {
  BusinessCoverImage,
  BusinessGalleryImage,
  BusinessImageRepository,
  BusinessLogoImage,
  CreateBusinessImageInput,
  CreateGalleryImageInput,
} from '../../domain/repositories/business-image.repository'

@Injectable()
export class PrismaBusinessImageRepository extends BusinessImageRepository {
  constructor(private readonly prisma: PrismaService) {
    super()
  }

  async findCoverByBusinessId(businessId: number): Promise<BusinessCoverImage | null> {
    const image = await this.prisma.image.findFirst({
      where: { businessId, imageType: 'BUSINESS_COVER' },
    })
    return image ? this.toCoverImage(image) : null
  }

  async createCover(input: CreateBusinessImageInput): Promise<BusinessCoverImage> {
    const created = await this.prisma.image.create({
      data: {
        businessId: input.businessId,
        imageType: 'BUSINESS_COVER',
        cloudinaryPublicId: input.cloudinaryPublicId,
        secureUrl: input.secureUrl,
        width: input.width ?? null,
        height: input.height ?? null,
        format: input.format ?? null,
      },
    })
    return this.toCoverImage(created)
  }

  async findLogoByBusinessId(businessId: number): Promise<BusinessLogoImage | null> {
    const image = await this.prisma.image.findFirst({
      where: { businessId, imageType: 'BUSINESS_LOGO' },
    })
    return image ? this.toLogoImage(image) : null
  }

  async createLogo(input: CreateBusinessImageInput): Promise<BusinessLogoImage> {
    const created = await this.prisma.image.create({
      data: {
        businessId: input.businessId,
        imageType: 'BUSINESS_LOGO',
        cloudinaryPublicId: input.cloudinaryPublicId,
        secureUrl: input.secureUrl,
        width: input.width ?? null,
        height: input.height ?? null,
        format: input.format ?? null,
      },
    })
    return this.toLogoImage(created)
  }

  async deleteById(imageId: number): Promise<void> {
    await this.prisma.image.delete({ where: { imageId } })
  }

  async countGalleryImages(businessId: number): Promise<number> {
    return this.prisma.image.count({ where: { businessId, imageType: 'BUSINESS_GALLERY' } })
  }

  async getMaxGalleryDisplayOrder(businessId: number): Promise<number> {
    const top = await this.prisma.image.findFirst({
      where: { businessId, imageType: 'BUSINESS_GALLERY' },
      orderBy: { displayOrder: 'desc' },
      select: { displayOrder: true },
    })
    return top?.displayOrder ?? 0
  }

  async createGalleryImages(inputs: CreateGalleryImageInput[]): Promise<BusinessGalleryImage[]> {
    const created = await this.prisma.$transaction(
      inputs.map((input) =>
        this.prisma.image.create({
          data: {
            businessId: input.businessId,
            imageType: 'BUSINESS_GALLERY',
            cloudinaryPublicId: input.cloudinaryPublicId,
            secureUrl: input.secureUrl,
            width: input.width ?? null,
            height: input.height ?? null,
            format: input.format ?? null,
            displayOrder: input.displayOrder,
          },
        }),
      ),
    )
    return created.map((image) => this.toGalleryImage(image))
  }

  async findGalleryImage(businessId: number, imageId: number): Promise<BusinessGalleryImage | null> {
    const image = await this.prisma.image.findFirst({
      where: { imageId, businessId, imageType: 'BUSINESS_GALLERY' },
    })
    return image ? this.toGalleryImage(image) : null
  }

  async findGalleryImagesByIds(businessId: number, imageIds: number[]): Promise<BusinessGalleryImage[]> {
    const images = await this.prisma.image.findMany({
      where: { businessId, imageType: 'BUSINESS_GALLERY', imageId: { in: imageIds } },
    })
    return images.map((image) => this.toGalleryImage(image))
  }

  async updateGalleryDisplayOrders(items: Array<{ imageId: number; displayOrder: number }>): Promise<void> {
    await this.prisma.$transaction(
      items.map((item) =>
        this.prisma.image.update({
          where: { imageId: item.imageId },
          data: { displayOrder: item.displayOrder },
        }),
      ),
    )
  }

  private toCoverImage(image: { imageId: bigint; cloudinaryPublicId: string; secureUrl: string }): BusinessCoverImage {
    return {
      imageId: Number(image.imageId),
      cloudinaryPublicId: image.cloudinaryPublicId,
      secureUrl: image.secureUrl,
    }
  }

  private toLogoImage(image: { imageId: bigint; cloudinaryPublicId: string; secureUrl: string }): BusinessLogoImage {
    return {
      imageId: Number(image.imageId),
      cloudinaryPublicId: image.cloudinaryPublicId,
      secureUrl: image.secureUrl,
    }
  }

  private toGalleryImage(image: {
    imageId: bigint
    cloudinaryPublicId: string
    secureUrl: string
    displayOrder: number | null
  }): BusinessGalleryImage {
    return {
      imageId: Number(image.imageId),
      cloudinaryPublicId: image.cloudinaryPublicId,
      secureUrl: image.secureUrl,
      displayOrder: image.displayOrder,
    }
  }
}
