import { Injectable } from '@nestjs/common'
import { ReportRepository } from '../../domain/repositories/report.repository'
import { ReportNotFoundException } from '../../domain/exceptions/report.exceptions'
import { CreateNotificationUseCase } from '../../../notification/application/use-cases/create-notification.use-case'
import { NOTIFICATION_TYPE } from '@eers/shared-constants'

@Injectable()
export class ResolveReportUseCase {
  constructor(
    private readonly reportRepository: ReportRepository,
    private readonly createNotificationUseCase: CreateNotificationUseCase,
  ) {}

  async execute({ reportId }: { reportId: number }) {
    const report = await this.reportRepository.findById(reportId)
    if (!report) {
      throw new ReportNotFoundException()
    }

    await this.reportRepository.updateStatus(reportId, 'resolved')

    await this.createNotificationUseCase.execute({
      userId: report.userId,
      type: NOTIFICATION_TYPE.REPORT_RESOLVED,
      targetPath: '/reports/my',
      title: 'Report Resolved',
      content: 'Your report has been reviewed and resolved.',
    })

    return { reportId, status: 'resolved' as const }
  }
}
