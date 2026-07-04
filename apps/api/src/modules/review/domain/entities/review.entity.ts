export class ReviewEntity {
  reviewId!: number
  content!: string
  overallRating!: number
  sentiment?: string | null
  status!: string
  createdAt!: Date
  updatedAt!: Date
  deletedAt?: Date | null
  writerUserId!: number
  businessId!: number
  managedByUserId?: number | null
}
