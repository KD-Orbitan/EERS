export type BusinessClaimStatus = 'pending' | 'approved' | 'rejected';

export interface MyClaimListItem {
  claimId: number;
  businessId: number;
  businessName: string;
  status: BusinessClaimStatus;
  message: string;
  createdAt: string;
}

export interface AdminClaimListItem {
  claimId: number;
  businessId: number;
  businessName: string;
  claimantName: string;
  message: string;
  status: BusinessClaimStatus;
  createdAt: string;
}
