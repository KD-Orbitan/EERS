import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../../infrastructure/database/prisma.service'
import { BusinessNotFoundException, BusinessNotPendingException } from '../../../business/domain/exceptions/business.exceptions'

@Injectable()
export class RejectBusinessUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute({ businessId, currentUserId, reason }: { businessId: number; currentUserId: number; reason: string }) {
    const business = await this.prisma.business.findFirst({
      where: { businessId, deletedAt: null },
      select: { businessId: true, status: true },
    })

    if (!business) {
      throw new BusinessNotFoundException()
    }

    if (business.status !== 'pending') {
      throw new BusinessNotPendingException()
    }

    await this.prisma.business.update({
      where: { businessId },
      data: { status: 'rejected' },
    })

    return { businessId, status: 'rejected' as const }
  }
}
