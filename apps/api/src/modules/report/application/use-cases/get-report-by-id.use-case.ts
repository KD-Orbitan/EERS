import { Injectable, ForbiddenException } from '@nestjs/common'
import { ReportRepository } from '../../domain/repositories/report.repository'
import { ReportNotFoundException } from '../../domain/exceptions/report.exceptions'

@Injectable()
export class GetReportByIdUseCase {
  constructor(private readonly reportRepository: ReportRepository) {}

  async execute({ reportId, currentUserId, currentUserRole }: { reportId: number; currentUserId: number; currentUserRole: string }) {
    const report = await this.reportRepository.findById(reportId)
    if (!report) {
      throw new ReportNotFoundException()
    }

    if (currentUserRole !== 'ADMIN' && report.userId !== currentUserId) {
      throw new ForbiddenException('Forbidden')
    }

    const { userId: _userId, ...detail } = report
    return detail
  }
}
