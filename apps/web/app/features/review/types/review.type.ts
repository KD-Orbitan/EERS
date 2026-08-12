export type ReviewStatus = 'pending' | 'approved' | 'rejected' | 'hidden';
export type Sentiment = 'positive' | 'neutral' | 'negative' | null;

export interface ReviewCriteriaRating {
  criterionId: number;
  criterionName: string;
  ratingValue: number;
}

export interface ReviewReply {
  replyId: number;
  content: string;
  createdAt: string;
}

export interface ReviewPhoto {
  imageId: number;
  url: string;
}

export interface ReviewListItem {
  reviewId: number;
  overallRating: number;
  content: string;
  status: ReviewStatus;
  sentiment: Sentiment;
  author: {
    userId: number;
    name: string;
  };
  criteriaRatings: ReviewCriteriaRating[];
  photos: ReviewPhoto[];
  reply: ReviewReply | null;
  createdAt: string;
}

export interface MyReviewListItem {
  reviewId: number;
  overallRating: number;
  status: ReviewStatus;
  business: {
    businessId: number;
    name: string;
  };
  createdAt: string;
}

export interface RecentReviewItem {
  reviewId: number;
  overallRating: number;
  content: string;
  author: {
    name: string;
  };
  business: {
    businessId: number;
    name: string;
  };
  createdAt: string;
}

export interface ReviewDetail {
  reviewId: number;
  overallRating: number;
  content: string;
  status: ReviewStatus;
  sentiment: Sentiment;
  author: {
    userId: number;
    name: string;
  };
  business: {
    businessId: number;
    name: string;
  };
  criteriaRatings: ReviewCriteriaRating[];
  photos: ReviewPhoto[];
  reply: ReviewReply | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewStatistics {
  reviewCount: number;
  avgRating: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

export interface CriterionItem {
  criterionId: number;
  name: string;
  description: string | null;
}
