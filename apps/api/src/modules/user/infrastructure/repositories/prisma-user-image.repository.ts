import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../../infrastructure/database/prisma.service'
import { CreateAvatarInput, UserAvatarImage, UserImageRepository } from '../../domain/repositories/user-image.repository'

@Injectable()
export class PrismaUserImageRepository extends UserImageRepository {
  constructor(private readonly prisma: PrismaService) {
    super()
  }

  async findAvatarByUserId(userId: number): Promise<UserAvatarImage | null> {
    const image = await this.prisma.image.findFirst({
      where: { userId, imageType: 'AVATAR' },
    })

    if (!image) return null

    return {
      imageId: Number(image.imageId),
      cloudinaryPublicId: image.cloudinaryPublicId,
      secureUrl: image.secureUrl,
    }
  }

  async createAvatar(input: CreateAvatarInput): Promise<UserAvatarImage> {
    const created = await this.prisma.image.create({
      data: {
        userId: input.userId,
        imageType: 'AVATAR',
        cloudinaryPublicId: input.cloudinaryPublicId,
        secureUrl: input.secureUrl,
        width: input.width ?? null,
        height: input.height ?? null,
        format: input.format ?? null,
      },
    })

    return {
      imageId: Number(created.imageId),
      cloudinaryPublicId: created.cloudinaryPublicId,
      secureUrl: created.secureUrl,
    }
  }

  async deleteById(imageId: number): Promise<void> {
    await this.prisma.image.delete({ where: { imageId } })
  }
}
