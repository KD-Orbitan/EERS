import { Injectable } from '@nestjs/common'
import { ReportRepository } from '../../domain/repositories/report.repository'
import { ReportNotFoundException } from '../../domain/exceptions/report.exceptions'

@Injectable()
export class RejectReportUseCase {
  constructor(private readonly reportRepository: ReportRepository) {}

  async execute({ reportId }: { reportId: number }) {
    const report = await this.reportRepository.findById(reportId)
    if (!report) {
      throw new ReportNotFoundException()
    }

    await this.reportRepository.updateStatus(reportId, 'rejected')
    return { reportId, status: 'rejected' as const }
  }
}
