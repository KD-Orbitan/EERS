import { BusinessStatus } from '@/features/business/types/business.type';

export interface BookmarkStatus {
  isBookmarked: boolean;
}

export interface BookmarkListItem {
  bookmarkId: number;
  business: {
    businessId: number;
    name: string;
    avgRating: number;
    status: BusinessStatus;
  };
  createdAt: string;
}
