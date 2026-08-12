import { Injectable, ForbiddenException } from '@nestjs/common'
import { ReportRepository } from '../../domain/repositories/report.repository'
import { ReportNotFoundException, ReportNotWithdrawableException } from '../../domain/exceptions/report.exceptions'

@Injectable()
export class WithdrawReportUseCase {
  constructor(private readonly reportRepository: ReportRepository) {}

  async execute({ reportId, currentUserId }: { reportId: number; currentUserId: number }) {
    const report = await this.reportRepository.findById(reportId)
    if (!report) {
      throw new ReportNotFoundException()
    }

    if (report.userId !== currentUserId) {
      throw new ForbiddenException('Forbidden')
    }

    if (report.status !== 'pending') {
      throw new ReportNotWithdrawableException()
    }

    await this.reportRepository.deleteReport(reportId)
  }
}
