import { Injectable } from '@nestjs/common'
import { ReportRepository } from '../../domain/repositories/report.repository'

@Injectable()
export class GetMyReportsUseCase {
  constructor(private readonly reportRepository: ReportRepository) {}

  async execute({ userId, page = 1, limit = 20 }: { userId: number; page?: number; limit?: number }) {
    return this.reportRepository.findMyReports(userId, page, limit)
  }
}
