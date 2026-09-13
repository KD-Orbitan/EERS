import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { PrismaService } from '../../../infrastructure/database/prisma.service'
import { ListAdminReviewsUseCase } from '../application/use-cases/list-admin-reviews.use-case'
import { PrismaBusinessClaimRepository } from '../../business-claim/infrastructure/repositories/prisma-business-claim.repository'
import { PrismaReportRepository } from '../../report/infrastructure/repositories/prisma-report.repository'
import { PrismaNotificationRepository } from '../../notification/infrastructure/repositories/prisma-notification.repository'
import { AdminReviewListQueryDto } from '../application/dto/admin-review-list-query.dto'
import { AdminClaimQueryDto } from '../../business-claim/application/dto/admin-claim-query.dto'
import { AdminReportQueryDto } from '../../report/application/dto/admin-report-query.dto'
import { NotificationListQueryDto } from '../../notification/application/dto/notification-list-query.dto'

describe('Admin list search and pagination', () => {
  const cases = [
    { name: 'reviews', model: 'review', id: 'reviewId', direction: 'asc',
      scope: { status: 'pending', deletedAt: null },
      field: { business: { name: { contains: 'Sen', mode: 'insensitive' } } },
      run: (prisma: PrismaService, search?: string) => new ListAdminReviewsUseCase(prisma).execute({ status: 'pending', search, page: 3, limit: 10 }) },
    { name: 'claims', model: 'businessClaim', id: 'claimId', direction: 'asc',
      scope: { status: 'pending' },
      field: { user: { name: { contains: 'Sen', mode: 'insensitive' } } },
      run: (prisma: PrismaService, search?: string) => new PrismaBusinessClaimRepository(prisma).findAdminClaims(3, 10, 'pending', search) },
    { name: 'reports', model: 'report', id: 'reportId', direction: 'desc',
      scope: { status: 'pending' },
      field: { review: { business: { name: { contains: 'Sen', mode: 'insensitive' } } } },
      run: (prisma: PrismaService, search?: string) => new PrismaReportRepository(prisma).findAdminReports(3, 10, 'pending', search) },
    { name: 'notifications', model: 'notification', id: 'notificationId', direction: 'desc',
      scope: { userId: 7n, isRead: false },
      field: { title: { contains: 'Sen', mode: 'insensitive' } },
      run: (prisma: PrismaService, search?: string) => new PrismaNotificationRepository(prisma).findByUser(7, 3, 10, false, search) },
  ]

  it.each(cases)('$name applies search before pagination and counts the same filtered scope', async ({ model, id, direction, scope, field, run }) => {
    const delegate = { findMany: jest.fn().mockResolvedValue([]), count: jest.fn().mockResolvedValue(25) }
    const prisma = { [model]: delegate } as unknown as PrismaService
    const result = await run(prisma, '  Sen  ')
    const args = delegate.findMany.mock.calls[0][0]
    expect(args).toMatchObject({ skip: 20, take: 10, where: scope })
    expect(args.where.OR).toEqual(expect.arrayContaining([field]))
    expect(args.orderBy).toEqual([{ createdAt: direction }, { [id]: direction }])
    expect(delegate.count).toHaveBeenCalledWith({ where: args.where })
    expect(result).toEqual({ items: [], total: 25 })
  })

  it.each(cases)('$name preserves status/ownership filters for blank search', async ({ model, scope, run }) => {
    const delegate = { findMany: jest.fn().mockResolvedValue([]), count: jest.fn().mockResolvedValue(0) }
    await run({ [model]: delegate } as unknown as PrismaService, '   ')
    expect(delegate.findMany.mock.calls[0][0].where).toEqual(scope)
  })

  const queryDtos: Array<new () => { page?: number; limit?: number; search?: string }> = [
    AdminReviewListQueryDto, AdminClaimQueryDto, AdminReportQueryDto, NotificationListQueryDto,
  ]
  it.each(queryDtos)('%p validates search and pagination input', async (Dto) => {
    const valid = plainToInstance(Dto, { search: 'Sen Việt', page: '2', limit: '10' })
    expect(await validate(valid)).toHaveLength(0)
    expect(valid.page).toBe(2)
    for (const input of [{ search: ['invalid'] }, { search: 'x'.repeat(201) }, { page: 0 }, { limit: 101 }]) {
      expect((await validate(plainToInstance(Dto, input))).length).toBeGreaterThan(0)
    }
  })
})
