import { Injectable } from '@nestjs/common'
import { ReportRepository } from '../../domain/repositories/report.repository'
import { ReportAlreadyExistsException, ReasonNotFoundException } from '../../domain/exceptions/report.exceptions'
import { ReviewRepository } from '../../../review/domain/repositories/review.repository'
import { ReviewNotFoundException } from '../../../review/domain/exceptions/review.exceptions'
import { UserRepository } from '../../../user/domain/repositories/user.repository'
import { CreateNotificationUseCase } from '../../../notification/application/use-cases/create-notification.use-case'
import { NOTIFICATION_TYPE } from '@eers/shared-constants'

@Injectable()
export class CreateReportUseCase {
  constructor(
    private readonly reportRepository: ReportRepository,
    private readonly reviewRepository: ReviewRepository,
    private readonly userRepository: UserRepository,
    private readonly createNotificationUseCase: CreateNotificationUseCase,
  ) {}

  async execute({ currentUserId, dto }: { currentUserId: number; dto: { reviewId: number; reasonId: number; description?: string } }) {
    const review = await this.reviewRepository.findById(dto.reviewId)
    if (!review || review.deletedAt) {
      throw new ReviewNotFoundException()
    }

    const reason = await this.reportRepository.findReasonById(dto.reasonId)
    if (!reason) {
      throw new ReasonNotFoundException()
    }

    const existingReport = await this.reportRepository.findByUserAndReview(currentUserId, dto.reviewId)
    if (existingReport) {
      throw new ReportAlreadyExistsException()
    }

    const report = await this.reportRepository.createReport({
      userId: currentUserId,
      reviewId: dto.reviewId,
      reasonId: dto.reasonId,
      description: dto.description,
    })

    const adminUserIds = await this.userRepository.findUserIdsByRole('ADMIN')
    await Promise.all(
      adminUserIds.map((adminUserId) =>
        this.createNotificationUseCase.execute({
          userId: adminUserId,
          type: NOTIFICATION_TYPE.REPORT_CREATED,
          targetPath: '/admin/reports',
          title: 'New Report',
          content: `A new report was submitted for review #${dto.reviewId}.`,
        }),
      ),
    )

    return report
  }
}
