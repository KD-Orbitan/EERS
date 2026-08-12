export interface CriteriaScoreItem {
  criterionId: number;
  criterionName: string;
  avgRating: number;
  reviewCount: number;
}

export interface CriteriaScoresResponse {
  criteria: CriteriaScoreItem[];
}
