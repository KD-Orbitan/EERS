export type ReportStatus = 'pending' | 'reviewing' | 'resolved' | 'rejected';

export interface ReportReason {
  reasonId: number;
  name: string;
  description: string | null;
}

export interface MyReportListItem {
  reportId: number;
  status: ReportStatus;
  reason: { reasonId: number; name: string };
  review: { reviewId: number; content: string };
  createdAt: string;
}

export interface AdminReportListItem {
  reportId: number;
  status: ReportStatus;
  reason: { reasonId: number; name: string };
  reporter: { userId: number; name: string };
  review: { reviewId: number; content: string };
  createdAt: string;
}
