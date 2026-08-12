import { Injectable } from '@nestjs/common'
import { ReportRepository } from '../../domain/repositories/report.repository'

@Injectable()
export class GetReasonsUseCase {
  constructor(private readonly reportRepository: ReportRepository) {}

  async execute() {
    return this.reportRepository.findReasons()
  }
}
