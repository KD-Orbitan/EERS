import { ForbiddenException } from '@nestjs/common'
import { WithdrawReportUseCase } from '../application/use-cases/withdraw-report.use-case'
import { ReportRepository } from '../domain/repositories/report.repository'
import { ReportNotFoundException, ReportNotWithdrawableException } from '../domain/exceptions/report.exceptions'

describe('WithdrawReportUseCase', () => {
  let reportRepository: jest.Mocked<Pick<ReportRepository, 'findById' | 'deleteReport'>>
  let useCase: WithdrawReportUseCase

  beforeEach(() => {
    reportRepository = { findById: jest.fn(), deleteReport: jest.fn() }
    useCase = new WithdrawReportUseCase(reportRepository as unknown as ReportRepository)
  })

  it('hard deletes a pending report owned by the current user', async () => {
    reportRepository.findById.mockResolvedValue({ reportId: 1, userId: 5, status: 'pending' } as any)

    await useCase.execute({ reportId: 1, currentUserId: 5 })

    expect(reportRepository.deleteReport).toHaveBeenCalledWith(1)
  })

  it('throws REPORT_NOT_FOUND for an unknown report', async () => {
    reportRepository.findById.mockResolvedValue(null)

    await expect(useCase.execute({ reportId: 999, currentUserId: 5 })).rejects.toBeInstanceOf(ReportNotFoundException)
  })

  it('throws Forbidden when the report belongs to another user', async () => {
    reportRepository.findById.mockResolvedValue({ reportId: 1, userId: 7, status: 'pending' } as any)

    await expect(useCase.execute({ reportId: 1, currentUserId: 5 })).rejects.toBeInstanceOf(ForbiddenException)
  })

  it('throws REPORT_NOT_WITHDRAWABLE when the report is no longer pending', async () => {
    reportRepository.findById.mockResolvedValue({ reportId: 1, userId: 5, status: 'resolved' } as any)

    await expect(useCase.execute({ reportId: 1, currentUserId: 5 })).rejects.toBeInstanceOf(ReportNotWithdrawableException)
  })
})
