import { Injectable, ForbiddenException } from '@nestjs/common'
import { ReplyRepository } from '../../domain/repositories/reply.repository'
import { ReplyNotFoundException } from '../../domain/exceptions/review.exceptions'

@Injectable()
export class UpdateReplyUseCase {
  constructor(private readonly replyRepository: ReplyRepository) {}

  async execute({ replyId, currentUserId, currentUserRole, content }: { replyId: number; currentUserId: number; currentUserRole: string; content: string }) {
    const reply = await this.replyRepository.findById(replyId)
    if (!reply) {
      throw new ReplyNotFoundException()
    }

    if (currentUserRole !== 'ADMIN' && reply.userId !== currentUserId) {
      throw new ForbiddenException('Forbidden')
    }

    return this.replyRepository.updateReply(replyId, content)
  }
}
