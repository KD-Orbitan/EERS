import { CreateReportUseCase } from '../application/use-cases/create-report.use-case'
import { ReportRepository } from '../domain/repositories/report.repository'
import { ReviewRepository } from '../../review/domain/repositories/review.repository'
import { UserRepository } from '../../user/domain/repositories/user.repository'
import { ReportAlreadyExistsException, ReasonNotFoundException } from '../domain/exceptions/report.exceptions'
import { ReviewNotFoundException } from '../../review/domain/exceptions/review.exceptions'
import { CreateNotificationUseCase } from '../../notification/application/use-cases/create-notification.use-case'
import { NOTIFICATION_TYPE } from '@eers/shared-constants'

describe('CreateReportUseCase', () => {
  let reportRepository: jest.Mocked<Pick<ReportRepository, 'findReasonById' | 'findByUserAndReview' | 'createReport'>>
  let reviewRepository: jest.Mocked<Pick<ReviewRepository, 'findById'>>
  let userRepository: jest.Mocked<Pick<UserRepository, 'findUserIdsByRole'>>
  let createNotificationUseCase: jest.Mocked<Pick<CreateNotificationUseCase, 'execute'>>
  let useCase: CreateReportUseCase

  beforeEach(() => {
    reportRepository = { findReasonById: jest.fn(), findByUserAndReview: jest.fn(), createReport: jest.fn() }
    reviewRepository = { findById: jest.fn() }
    userRepository = { findUserIdsByRole: jest.fn().mockResolvedValue([]) }
    createNotificationUseCase = { execute: jest.fn().mockResolvedValue(undefined) }
    useCase = new CreateReportUseCase(
      reportRepository as unknown as ReportRepository,
      reviewRepository as unknown as ReviewRepository,
      userRepository as unknown as UserRepository,
      createNotificationUseCase as unknown as CreateNotificationUseCase,
    )
  })

  it('creates a report when the review exists, the reason exists, and no prior report exists', async () => {
    reviewRepository.findById.mockResolvedValue({ reviewId: 1, deletedAt: null } as any)
    reportRepository.findReasonById.mockResolvedValue({ reasonId: 2 })
    reportRepository.findByUserAndReview.mockResolvedValue(null)
    reportRepository.createReport.mockResolvedValue({ reportId: 10, status: 'pending' })

    const result = await useCase.execute({ currentUserId: 5, dto: { reviewId: 1, reasonId: 2 } })

    expect(result).toEqual({ reportId: 10, status: 'pending' })
    expect(reportRepository.createReport).toHaveBeenCalledWith({ userId: 5, reviewId: 1, reasonId: 2, description: undefined })
  })

  it('notifies every admin user after the report is created', async () => {
    reviewRepository.findById.mockResolvedValue({ reviewId: 1, deletedAt: null } as any)
    reportRepository.findReasonById.mockResolvedValue({ reasonId: 2 })
    reportRepository.findByUserAndReview.mockResolvedValue(null)
    reportRepository.createReport.mockResolvedValue({ reportId: 10, status: 'pending' })
    userRepository.findUserIdsByRole.mockResolvedValue([100, 101])

    await useCase.execute({ currentUserId: 5, dto: { reviewId: 1, reasonId: 2 } })

    expect(userRepository.findUserIdsByRole).toHaveBeenCalledWith('ADMIN')
    expect(createNotificationUseCase.execute).toHaveBeenCalledTimes(2)
    expect(createNotificationUseCase.execute).toHaveBeenCalledWith(expect.objectContaining({ userId: 100, type: NOTIFICATION_TYPE.REPORT_CREATED }))
    expect(createNotificationUseCase.execute).toHaveBeenCalledWith(expect.objectContaining({ userId: 101, type: NOTIFICATION_TYPE.REPORT_CREATED }))
  })

  it('throws REVIEW_NOT_FOUND when the review does not exist or is soft-deleted', async () => {
    reviewRepository.findById.mockResolvedValue(null)

    await expect(useCase.execute({ currentUserId: 5, dto: { reviewId: 999, reasonId: 2 } })).rejects.toBeInstanceOf(ReviewNotFoundException)
  })

  it('throws REASON_NOT_FOUND when the reason does not exist', async () => {
    reviewRepository.findById.mockResolvedValue({ reviewId: 1, deletedAt: null } as any)
    reportRepository.findReasonById.mockResolvedValue(null)

    await expect(useCase.execute({ currentUserId: 5, dto: { reviewId: 1, reasonId: 999 } })).rejects.toBeInstanceOf(ReasonNotFoundException)
  })

  it('throws REPORT_ALREADY_EXISTS when the user already reported this review', async () => {
    reviewRepository.findById.mockResolvedValue({ reviewId: 1, deletedAt: null } as any)
    reportRepository.findReasonById.mockResolvedValue({ reasonId: 2 })
    reportRepository.findByUserAndReview.mockResolvedValue({ reportId: 3 })

    await expect(useCase.execute({ currentUserId: 5, dto: { reviewId: 1, reasonId: 2 } })).rejects.toBeInstanceOf(ReportAlreadyExistsException)
  })
})
