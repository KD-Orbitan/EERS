export type BusinessStatus = 'pending' | 'approved' | 'rejected' | 'hidden';

export interface BusinessCategory {
  categoryId: number;
  categoryName: string;
}

export interface BusinessListItem {
  businessId: number;
  name: string;
  description: string | null;
  avgRating: number;
  reviewCount: number;
  status: 'approved';
  province: string | null;
  categories: BusinessCategory[];
}

export interface MyBusinessListItem {
  businessId: number;
  name: string;
  status: BusinessStatus;
  avgRating: number;
  createdAt: string;
}

export interface BusinessLocation {
  locationId: number;
  addressLine: string;
  ward: string;
  province: string;
}

export interface BusinessDetail {
  businessId: number;
  name: string;
  description: string | null;
  phone: string;
  email: string | null;
  avgRating: number;
  reviewCount: number;
  status: BusinessStatus;
  owner: {
    userId: number;
    name: string;
  };
  categories: BusinessCategory[];
  locations: BusinessLocation[];
  createdAt: string;
}

export interface BusinessStatistics {
  reviewCount: number;
  avgRating: number;
  rankingPosition: number | null;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
