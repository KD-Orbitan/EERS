export class LocationEntity {
  locationId!: number
  addressLine!: string
  ward!: string
  province!: string
  latitude!: number | null
  longitude!: number | null
  createdAt!: Date
  updatedAt!: Date
}
