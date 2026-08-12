import { ResolveReportUseCase } from '../application/use-cases/resolve-report.use-case'
import { RejectReportUseCase } from '../application/use-cases/reject-report.use-case'
import { ReportRepository } from '../domain/repositories/report.repository'
import { ReportNotFoundException } from '../domain/exceptions/report.exceptions'
import { CreateNotificationUseCase } from '../../notification/application/use-cases/create-notification.use-case'
import { NOTIFICATION_TYPE } from '@eers/shared-constants'

describe('Admin report use cases', () => {
  let reportRepository: jest.Mocked<Pick<ReportRepository, 'findById' | 'updateStatus'>>
  let createNotificationUseCase: jest.Mocked<Pick<CreateNotificationUseCase, 'execute'>>

  beforeEach(() => {
    reportRepository = { findById: jest.fn(), updateStatus: jest.fn() }
    createNotificationUseCase = { execute: jest.fn().mockResolvedValue(undefined) }
  })

  describe('ResolveReportUseCase', () => {
    it('sets status to resolved and notifies the reporter', async () => {
      reportRepository.findById.mockResolvedValue({ reportId: 1, userId: 8 } as any)
      const useCase = new ResolveReportUseCase(reportRepository as unknown as ReportRepository, createNotificationUseCase as unknown as CreateNotificationUseCase)

      const result = await useCase.execute({ reportId: 1 })

      expect(result).toEqual({ reportId: 1, status: 'resolved' })
      expect(reportRepository.updateStatus).toHaveBeenCalledWith(1, 'resolved')
      expect(createNotificationUseCase.execute).toHaveBeenCalledWith(expect.objectContaining({ userId: 8, type: NOTIFICATION_TYPE.REPORT_RESOLVED }))
    })

    it('throws REPORT_NOT_FOUND for an unknown report', async () => {
      reportRepository.findById.mockResolvedValue(null)
      const useCase = new ResolveReportUseCase(reportRepository as unknown as ReportRepository, createNotificationUseCase as unknown as CreateNotificationUseCase)

      await expect(useCase.execute({ reportId: 999 })).rejects.toBeInstanceOf(ReportNotFoundException)
    })
  })

  describe('RejectReportUseCase', () => {
    it('sets status to rejected', async () => {
      reportRepository.findById.mockResolvedValue({ reportId: 1 } as any)
      const useCase = new RejectReportUseCase(reportRepository as unknown as ReportRepository)

      const result = await useCase.execute({ reportId: 1 })

      expect(result).toEqual({ reportId: 1, status: 'rejected' })
      expect(reportRepository.updateStatus).toHaveBeenCalledWith(1, 'rejected')
    })

    it('throws REPORT_NOT_FOUND for an unknown report', async () => {
      reportRepository.findById.mockResolvedValue(null)
      const useCase = new RejectReportUseCase(reportRepository as unknown as ReportRepository)

      await expect(useCase.execute({ reportId: 999 })).rejects.toBeInstanceOf(ReportNotFoundException)
    })
  })
})
