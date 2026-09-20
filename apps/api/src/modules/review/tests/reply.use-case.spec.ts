import { CreateReplyUseCase } from '../application/use-cases/create-reply.use-case'
import { ReplyRepository } from '../domain/repositories/reply.repository'
import { ReviewRepository } from '../domain/repositories/review.repository'
import { ReplyAlreadyExistsException } from '../domain/exceptions/review.exceptions'
import { GetBusinessSummaryUseCase } from '../../business/application/use-cases/get-business-summary.use-case'
import { CreateNotificationUseCase } from '../../notification/application/use-cases/create-notification.use-case'
import { NOTIFICATION_TYPE } from '@eers/shared-constants'

describe('CreateReplyUseCase', () => {
  let replyRepository: jest.Mocked<Pick<ReplyRepository, 'findByReviewId' | 'createReply'>>
  let reviewRepository: jest.Mocked<Pick<ReviewRepository, 'findById'>>
  let getBusinessSummaryUseCase: jest.Mocked<Pick<GetBusinessSummaryUseCase, 'execute'>>
  let createNotificationUseCase: jest.Mocked<Pick<CreateNotificationUseCase, 'execute'>>
  let useCase: CreateReplyUseCase

  beforeEach(() => {
    replyRepository = { findByReviewId: jest.fn(), createReply: jest.fn() }
    reviewRepository = { findById: jest.fn() }
    getBusinessSummaryUseCase = { execute: jest.fn() }
    createNotificationUseCase = { execute: jest.fn().mockResolvedValue(undefined) }
    useCase = new CreateReplyUseCase(
      reviewRepository as unknown as ReviewRepository,
      replyRepository as unknown as ReplyRepository,
      getBusinessSummaryUseCase as unknown as GetBusinessSummaryUseCase,
      createNotificationUseCase as unknown as CreateNotificationUseCase,
    )
  })

  it('creates reply when business owner owns the business and notifies the review author', async () => {
    reviewRepository.findById.mockResolvedValue({ reviewId: 1, businessId: 2, writerUserId: 9, deletedAt: null } as any)
    getBusinessSummaryUseCase.execute.mockResolvedValue({ businessId: 2, name: 'Acme', ownerUserId: 5 } as any)
    replyRepository.findByReviewId.mockResolvedValue(null)
    replyRepository.createReply.mockResolvedValue({ replyId: 10 })

    const result = await useCase.execute({ reviewId: 1, currentUserId: 5, currentUserRole: 'BUSINESS_OWNER', dto: { content: 'Thanks for your feedback' } })

    expect(result).toEqual({ replyId: 10 })
    expect(createNotificationUseCase.execute).toHaveBeenCalledWith(expect.objectContaining({ userId: 9, type: NOTIFICATION_TYPE.NEW_REPLY }))
  })

  it('throws REPLY_ALREADY_EXISTS for a second reply', async () => {
    reviewRepository.findById.mockResolvedValue({ reviewId: 1, businessId: 2, deletedAt: null } as any)
    getBusinessSummaryUseCase.execute.mockResolvedValue({ businessId: 2, ownerUserId: 5 } as any)
    replyRepository.findByReviewId.mockResolvedValue({ replyId: 2 } as any)

    await expect(useCase.execute({ reviewId: 1, currentUserId: 5, currentUserRole: 'BUSINESS_OWNER', dto: { content: 'Thanks for your feedback' } })).rejects.toBeInstanceOf(ReplyAlreadyExistsException)
  })
})
