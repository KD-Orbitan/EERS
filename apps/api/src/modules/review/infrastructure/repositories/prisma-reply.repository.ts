import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../../infrastructure/database/prisma.service'
import { ReplyRepository } from '../../domain/repositories/reply.repository'

@Injectable()
export class PrismaReplyRepository extends ReplyRepository {
  constructor(private readonly prisma: PrismaService) {
    super()
  }

  async findByReviewId(reviewId: number) {
    const reply = await this.prisma.reply.findFirst({ where: { reviewId: BigInt(reviewId) } })
    return reply ? { replyId: Number(reply.replyId), content: reply.content, createdAt: reply.createdAt, updatedAt: reply.updatedAt, userId: Number(reply.userId), reviewId: Number(reply.reviewId) } : null
  }

  async findById(replyId: number) {
    const reply = await this.prisma.reply.findUnique({ where: { replyId: BigInt(replyId) } })
    return reply ? { replyId: Number(reply.replyId), content: reply.content, createdAt: reply.createdAt, updatedAt: reply.updatedAt, userId: Number(reply.userId), reviewId: Number(reply.reviewId) } : null
  }

  async createReply(params) {
    const reply = await this.prisma.reply.create({
      data: {
        reviewId: BigInt(params.reviewId),
        userId: BigInt(params.userId),
        content: params.content,
      },
    })
    return { replyId: Number(reply.replyId) }
  }

  async updateReply(replyId: number, content: string) {
    const reply = await this.prisma.reply.update({
      where: { replyId: BigInt(replyId) },
      data: { content },
    })
    return { replyId: Number(reply.replyId) }
  }

  async deleteReply(replyId: number) {
    await this.prisma.reply.delete({ where: { replyId: BigInt(replyId) } })
  }
}
