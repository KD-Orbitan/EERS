import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../../infrastructure/database/prisma.service'
import {
  CreateReviewPhotoInput,
  ReviewImageRepository,
  ReviewPhoto,
} from '../../domain/repositories/review-image.repository'

@Injectable()
export class PrismaReviewImageRepository extends ReviewImageRepository {
  constructor(private readonly prisma: PrismaService) {
    super()
  }

  async countByReviewId(reviewId: number): Promise<number> {
    return this.prisma.image.count({ where: { reviewId, imageType: 'REVIEW_PHOTO' } })
  }

  async createMany(inputs: CreateReviewPhotoInput[]): Promise<ReviewPhoto[]> {
    const created = await this.prisma.$transaction(
      inputs.map((input) =>
        this.prisma.image.create({
          data: {
            reviewId: input.reviewId,
            imageType: 'REVIEW_PHOTO',
            cloudinaryPublicId: input.cloudinaryPublicId,
            secureUrl: input.secureUrl,
            width: input.width ?? null,
            height: input.height ?? null,
            format: input.format ?? null,
          },
        }),
      ),
    )
    return created.map((image) => this.toPhoto(image))
  }

  async findById(reviewId: number, imageId: number): Promise<ReviewPhoto | null> {
    const image = await this.prisma.image.findFirst({
      where: { imageId, reviewId, imageType: 'REVIEW_PHOTO' },
    })
    return image ? this.toPhoto(image) : null
  }

  async deleteById(imageId: number): Promise<void> {
    await this.prisma.image.delete({ where: { imageId } })
  }

  private toPhoto(image: { imageId: bigint; cloudinaryPublicId: string; secureUrl: string }): ReviewPhoto {
    return {
      imageId: Number(image.imageId),
      cloudinaryPublicId: image.cloudinaryPublicId,
      secureUrl: image.secureUrl,
    }
  }
}
