import { Injectable, ForbiddenException } from '@nestjs/common'
import { ReplyRepository } from '../../domain/repositories/reply.repository'
import { ReplyNotFoundException } from '../../domain/exceptions/review.exceptions'

@Injectable()
export class DeleteReplyUseCase {
  constructor(private readonly replyRepository: ReplyRepository) {}

  async execute({ replyId, currentUserId, currentUserRole }: { replyId: number; currentUserId: number; currentUserRole: string }) {
    const reply = await this.replyRepository.findById(replyId)
    if (!reply) {
      throw new ReplyNotFoundException()
    }

    if (currentUserRole !== 'ADMIN' && reply.userId !== currentUserId) {
      throw new ForbiddenException('Forbidden')
    }

    await this.replyRepository.deleteReply(replyId)
  }
}
