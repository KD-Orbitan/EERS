import { BusinessEntity } from '../entities/business.entity'
import { LocationEntity } from '../entities/location.entity'

export interface CreateBusinessLocation {
  addressLine: string
  ward: string
  province: string
}

export interface BusinessListQuery {
  search?: string
  categoryId?: number
  province?: string
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface BusinessListItem {
  businessId: number
  name: string
  description: string | null
  avgRating: number
  reviewCount: number
  status: string
  province: string | null
  categories: Array<{ categoryId: number; categoryName: string }>
}

export interface MyBusinessListItem {
  businessId: number
  name: string
  status: string
  avgRating: number
  createdAt: string
}

export interface BusinessDetail {
  businessId: number
  name: string
  description: string | null
  phone: string
  email: string | null
  avgRating: number
  reviewCount: number
  status: string
  owner: { userId: number; name: string }
  categories: Array<{ categoryId: number; categoryName: string }>
  locations: Array<{
    locationId: number
    addressLine: string
    ward: string
    province: string
  }>
  createdAt: string
}

export interface BusinessStatistics {
  reviewCount: number
  avgRating: number
  rankingPosition: number | null
  ratingDistribution: Record<number, number>
}

export abstract class BusinessRepository {
  abstract findByPhone(phone: string): Promise<BusinessEntity | null>
  abstract findByEmail(email: string): Promise<BusinessEntity | null>
  abstract findById(businessId: number): Promise<BusinessEntity | null>
  abstract findCategoriesExist(categoryIds: number[]): Promise<boolean>
  abstract createBusinessWithLocationsAndCategories(params: {
    name: string
    description?: string | null
    phone: string
    email?: string | null
    ownerUserId: number
    categoryIds: number[]
    locations: CreateBusinessLocation[]
  }): Promise<{ businessId: number; status: string }>
  abstract updateBusiness(businessId: number, data: { name?: string; description?: string; phone?: string; email?: string }): Promise<{ businessId: number }>
  abstract softDeleteBusiness(businessId: number, actionUserId: number): Promise<void>
  abstract getApprovedBusinessList(query: BusinessListQuery): Promise<BusinessListItem[]>
  abstract getMyBusinesses(userId: number, page: number, limit: number): Promise<MyBusinessListItem[]>
  abstract getBusinessDetail(businessId: number): Promise<BusinessDetail | null>
  abstract getBusinessStatistics(businessId: number): Promise<BusinessStatistics>
  abstract countLocations(businessId: number): Promise<number>
  abstract findBusinessLocation(businessId: number, locationId: number): Promise<{ businessId: number; locationId: number } | null>
}
