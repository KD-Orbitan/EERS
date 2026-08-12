import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../../infrastructure/database/prisma.service'
import { UserNotFoundException, UserNotBannedException } from '../../../user/domain/exceptions/user.exceptions'

@Injectable()
export class UnbanUserUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute({ userId }: { userId: number }) {
    const user = await this.prisma.user.findFirst({
      where: { userId, deletedAt: null },
    })

    if (!user) {
      throw new UserNotFoundException()
    }

    if (user.status !== 'banned') {
      throw new UserNotBannedException()
    }

    await this.prisma.user.update({
      where: { userId },
      data: { status: 'active' },
    })

    return { userId, status: 'active' as const }
  }
}
