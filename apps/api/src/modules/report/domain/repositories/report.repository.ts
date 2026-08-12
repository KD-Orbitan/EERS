export interface ReasonListItem {
  reasonId: number
  name: string
  description: string | null
}

export interface MyReportListItem {
  reportId: number
  status: string
  reason: { reasonId: number; name: string }
  review: { reviewId: number; content: string }
  createdAt: string
}

export interface ReportDetail {
  reportId: number
  description: string | null
  status: string
  reason: { reasonId: number; name: string }
  review: { reviewId: number; content: string }
  createdAt: string
  userId: number
}

export interface AdminReportListItem {
  reportId: number
  status: string
  reason: { reasonId: number; name: string }
  reporter: { userId: number; name: string }
  review: { reviewId: number; content: string }
  createdAt: string
}

export abstract class ReportRepository {
  abstract findReasons(): Promise<ReasonListItem[]>
  abstract findReasonById(reasonId: number): Promise<{ reasonId: number } | null>
  abstract findByUserAndReview(userId: number, reviewId: number): Promise<{ reportId: number } | null>
  abstract createReport(params: { userId: number; reviewId: number; reasonId: number; description?: string }): Promise<{ reportId: number; status: string }>
  abstract findMyReports(userId: number, page: number, limit: number): Promise<{ items: MyReportListItem[]; total: number }>
  abstract findById(reportId: number): Promise<ReportDetail | null>
  abstract deleteReport(reportId: number): Promise<void>
  abstract findAdminReports(page: number, limit: number, status?: string): Promise<{ items: AdminReportListItem[]; total: number }>
  abstract updateStatus(reportId: number, status: 'resolved' | 'rejected'): Promise<void>
}
