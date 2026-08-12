import { LocationEntity } from '../entities/location.entity'

export interface LocationCoordinates {
  latitude: number | null
  longitude: number | null
}

export abstract class LocationRepository {
  abstract findById(locationId: number): Promise<LocationEntity | null>
  abstract create(location: {
    addressLine: string
    ward: string
    province: string
  } & Partial<LocationCoordinates>): Promise<LocationEntity>
  abstract update(
    locationId: number,
    data: { addressLine?: string; ward?: string; province?: string } & Partial<LocationCoordinates>,
  ): Promise<{ locationId: number }>
  abstract delete(locationId: number): Promise<void>
  abstract createBusinessLocation(businessId: number, locationId: number): Promise<void>
  abstract deleteBusinessLocation(businessId: number, locationId: number): Promise<void>
  abstract createLocationWithBusinessJoin(businessId: number, location: {
    addressLine: string
    ward: string
    province: string
  }): Promise<{ locationId: number }>
  abstract deleteLocationWithBusinessJoin(businessId: number, locationId: number): Promise<void>
}
