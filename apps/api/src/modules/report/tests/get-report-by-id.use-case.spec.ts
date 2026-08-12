import { ForbiddenException } from '@nestjs/common'
import { GetReportByIdUseCase } from '../application/use-cases/get-report-by-id.use-case'
import { ReportRepository } from '../domain/repositories/report.repository'
import { ReportNotFoundException } from '../domain/exceptions/report.exceptions'

describe('GetReportByIdUseCase', () => {
  let reportRepository: jest.Mocked<Pick<ReportRepository, 'findById'>>
  let useCase: GetReportByIdUseCase

  const report = {
    reportId: 1,
    description: null,
    status: 'pending',
    reason: { reasonId: 1, name: 'Spam' },
    review: { reviewId: 2, content: 'Great place' },
    createdAt: '2026-01-01T00:00:00.000Z',
    userId: 5,
  }

  beforeEach(() => {
    reportRepository = { findById: jest.fn() }
    useCase = new GetReportByIdUseCase(reportRepository as unknown as ReportRepository)
  })

  it('returns the report detail (without userId) for its owner', async () => {
    reportRepository.findById.mockResolvedValue(report as any)

    const result = await useCase.execute({ reportId: 1, currentUserId: 5, currentUserRole: 'USER' })

    expect(result).not.toHaveProperty('userId')
    expect(result.reportId).toBe(1)
  })

  it('allows an admin to view a report they do not own', async () => {
    reportRepository.findById.mockResolvedValue(report as any)

    await expect(useCase.execute({ reportId: 1, currentUserId: 999, currentUserRole: 'ADMIN' })).resolves.toBeDefined()
  })

  it('throws Forbidden for a non-owner, non-admin user', async () => {
    reportRepository.findById.mockResolvedValue(report as any)

    await expect(useCase.execute({ reportId: 1, currentUserId: 999, currentUserRole: 'USER' })).rejects.toBeInstanceOf(ForbiddenException)
  })

  it('throws REPORT_NOT_FOUND for an unknown report', async () => {
    reportRepository.findById.mockResolvedValue(null)

    await expect(useCase.execute({ reportId: 999, currentUserId: 5, currentUserRole: 'USER' })).rejects.toBeInstanceOf(ReportNotFoundException)
  })
})
