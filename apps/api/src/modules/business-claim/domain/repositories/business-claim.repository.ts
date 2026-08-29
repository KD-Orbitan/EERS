export interface MyClaimListItem {
  claimId: number
  businessId: number
  businessName: string
  status: string
  message: string
  createdAt: string
}

export interface ClaimDetail {
  claimId: number
  businessId: number
  businessName: string
  userId: number
  status: string
  message: string
  createdAt: string
}

export interface AdminClaimListItem {
  claimId: number
  businessId: number
  businessName: string
  claimantName: string
  message: string
  status: string
  createdAt: string
}

export interface ApproveClaimResult {
  businessId: number
  businessName: string
  claimantUserId: number
  rejectedRivalClaimantUserIds: number[]
}

export abstract class BusinessClaimRepository {
  abstract findPendingByUserAndBusiness(userId: number, businessId: number): Promise<{ claimId: number } | null>
  abstract createClaim(params: { userId: number; businessId: number; message: string }): Promise<{ claimId: number; status: string }>
  abstract findMyClaims(userId: number, page: number, limit: number): Promise<{ items: MyClaimListItem[]; total: number }>
  abstract findById(claimId: number): Promise<ClaimDetail | null>
  abstract findAdminClaims(page: number, limit: number, status?: string): Promise<{ items: AdminClaimListItem[]; total: number }>
  abstract withdrawClaim(claimId: number): Promise<void>
  abstract rejectClaim(claimId: number, reviewerUserId: number): Promise<void>
  abstract approveClaimAndTransferOwnership(claimId: number, reviewerUserId: number): Promise<ApproveClaimResult>
}
