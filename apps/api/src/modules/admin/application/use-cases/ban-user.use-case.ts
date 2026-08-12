import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../../infrastructure/database/prisma.service'
import { UserNotFoundException, CannotBanAdminException } from '../../../user/domain/exceptions/user.exceptions'

@Injectable()
export class BanUserUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute({ userId, currentUserId, reason }: { userId: number; currentUserId: number; reason: string }) {
    const user = await this.prisma.user.findFirst({
      where: { userId, deletedAt: null },
      include: { role: true },
    })

    if (!user) {
      throw new UserNotFoundException()
    }

    if (user.role.roleName === 'ADMIN') {
      throw new CannotBanAdminException()
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { userId },
        data: { status: 'banned' },
      })

      await tx.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      })

      await tx.log.create({
        data: {
          action: 'USER_BANNED',
          entityType: 'User',
          entityId: userId,
          userId: currentUserId,
          newData: { reason },
        },
      })
    })

    return { userId, status: 'banned' as const }
  }
}
