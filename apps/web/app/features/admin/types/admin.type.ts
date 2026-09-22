// Field set mirrors the real ScoringConfig Prisma model (docs/SCHEMA.md) and
// the ranking pipeline formulas in docs/DECISIONS.md D-012 — not the 5-field
// "weights" shape the Phase 7 prompt assumed.
export interface ScoringConfig {
  configId: number;
  bayesianC: number;
  bayesianM: number;
  fraudLambda1: number;
  fraudLambda2: number;
  fraudLambda3: number;
  thetaDup: number;
  lDup: number;
  thetaSpam: number;
  spamWindowHours: number;
  thetaSus: number;
  thetaReject: number;
  trustAlpha: number;
  trustBeta: number;
  trustGamma: number;
  suspiciousDelta: number;
  timeDecayLambda: number;
  sentimentLambda: number;
  weightAlpha: number;
  weightBeta: number;
  weightGamma: number;
  lMin: number;
  updatedAt: string;
}

export interface RankingTrendConfig {
  period: 'DAY' | 'WEEK' | 'MONTH';
  updatedAt: string;
}

export interface AdminBusinessListItem {
  businessId: number;
  name: string;
  status: 'pending' | 'approved' | 'rejected' | 'hidden';
  ownerName: string;
  phone: string;
  createdAt: string;
  categories: Array<{ categoryId: number; categoryName: string }>;
}

export interface AdminReviewListItem {
  managedBy: { userId: number; name: string } | null;
  moderatedAt: string | null;
  moderationReason: string | null;
  reviewId: number;
  overallRating: number;
  content: string;
  status: 'pending' | 'approved' | 'rejected' | 'hidden';
  businessId: number;
  businessName: string;
  authorName: string;
  createdAt: string;
}

export interface AdminUserListItem {
  userId: number;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive' | 'banned';
  createdAt: string;
}

// GET /admin/criterion-weights/:categoryId returns a flat
// {categoryId, criterionId, weight}[] with no criterion name — joined
// client-side with GET /categories/:categoryId/criteria for display.
export interface CriterionWeightItem {
  categoryId: number;
  criterionId: number;
  weight: number;
}

export interface CategoryItem {
  categoryId: number;
  categoryName: string;
}
