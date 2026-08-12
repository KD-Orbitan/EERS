import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../../infrastructure/database/prisma.service'
import { ReportRepository } from '../../domain/repositories/report.repository'

@Injectable()
export class PrismaReportRepository extends ReportRepository {
  constructor(private readonly prisma: PrismaService) {
    super()
  }

  async findReasons() {
    const reasons = await this.prisma.reason.findMany({ orderBy: { reasonId: 'asc' } })
    return reasons.map((reason) => ({
      reasonId: reason.reasonId,
      name: reason.name,
      description: reason.description,
    }))
  }

  async findReasonById(reasonId: number) {
    const reason = await this.prisma.reason.findUnique({ where: { reasonId } })
    return reason ? { reasonId: reason.reasonId } : null
  }

  async findByUserAndReview(userId: number, reviewId: number) {
    const report = await this.prisma.report.findUnique({
      where: { userId_reviewId: { userId: BigInt(userId), reviewId: BigInt(reviewId) } },
    })
    return report ? { reportId: Number(report.reportId) } : null
  }

  async createReport(params: { userId: number; reviewId: number; reasonId: number; description?: string }) {
    const report = await this.prisma.report.create({
      data: {
        userId: BigInt(params.userId),
        reviewId: BigInt(params.reviewId),
        reasonId: params.reasonId,
        description: params.description ?? null,
      },
    })
    return { reportId: Number(report.reportId), status: report.status }
  }

  async findMyReports(userId: number, page: number, limit: number) {
    const where = { userId: BigInt(userId) }
    const [reports, total] = await Promise.all([
      this.prisma.report.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { reason: true, review: true },
      }),
      this.prisma.report.count({ where }),
    ])

    return {
      items: reports.map((report) => ({
        reportId: Number(report.reportId),
        status: report.status,
        reason: { reasonId: report.reason.reasonId, name: report.reason.name },
        review: { reviewId: Number(report.review.reviewId), content: report.review.content },
        createdAt: report.createdAt.toISOString(),
      })),
      total,
    }
  }

  async findById(reportId: number) {
    const report = await this.prisma.report.findUnique({
      where: { reportId: BigInt(reportId) },
      include: { reason: true, review: true },
    })

    if (!report) {
      return null
    }

    return {
      reportId: Number(report.reportId),
      description: report.description,
      status: report.status,
      reason: { reasonId: report.reason.reasonId, name: report.reason.name },
      review: { reviewId: Number(report.review.reviewId), content: report.review.content },
      createdAt: report.createdAt.toISOString(),
      userId: Number(report.userId),
    }
  }

  async deleteReport(reportId: number) {
    await this.prisma.report.delete({ where: { reportId: BigInt(reportId) } })
  }

  async findAdminReports(page: number, limit: number, status?: string) {
    const where = status ? { status: status as any } : {}
    const [reports, total] = await Promise.all([
      this.prisma.report.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { reason: true, review: true, user: true },
      }),
      this.prisma.report.count({ where }),
    ])

    return {
      items: reports.map((report) => ({
        reportId: Number(report.reportId),
        status: report.status,
        reason: { reasonId: report.reason.reasonId, name: report.reason.name },
        reporter: { userId: Number(report.user.userId), name: report.user.name },
        review: { reviewId: Number(report.review.reviewId), content: report.review.content },
        createdAt: report.createdAt.toISOString(),
      })),
      total,
    }
  }

  async updateStatus(reportId: number, status: 'resolved' | 'rejected') {
    await this.prisma.report.update({ where: { reportId: BigInt(reportId) }, data: { status } })
  }
}
