import { Injectable } from '@nestjs/common'
import { ReportRepository } from '../../domain/repositories/report.repository'

@Injectable()
export class ListAdminReportsUseCase {
  constructor(private readonly reportRepository: ReportRepository) {}

  async execute({ page = 1, limit = 20, status }: { page?: number; limit?: number; status?: string }) {
    return this.reportRepository.findAdminReports(page, limit, status)
  }
}
