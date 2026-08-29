export class BusinessEntity {
  businessId!: number
  name!: string
  description?: string | null
  phone!: string
  email?: string | null
  status!: string
  avgRating!: number
  ownerUserId!: number | null
  createdAt!: Date
  updatedAt!: Date
  deletedAt?: Date | null
}
