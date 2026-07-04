import { ReplyEntity } from '../entities/reply.entity'

export abstract class ReplyRepository {
  abstract findByReviewId(reviewId: number): Promise<ReplyEntity | null>
  abstract findById(replyId: number): Promise<ReplyEntity | null>
  abstract createReply(params: { reviewId: number; userId: number; content: string }): Promise<{ replyId: number }>
  abstract updateReply(replyId: number, content: string): Promise<{ replyId: number }>
  abstract deleteReply(replyId: number): Promise<void>
}
