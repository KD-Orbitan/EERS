export interface ReviewPhoto {
  imageId: number
  cloudinaryPublicId: string
  secureUrl: string
}

export interface CreateReviewPhotoInput {
  reviewId: number
  cloudinaryPublicId: string
  secureUrl: string
  width?: number | null
  height?: number | null
  format?: string | null
}

export abstract class ReviewImageRepository {
  abstract countByReviewId(reviewId: number): Promise<number>
  abstract createMany(inputs: CreateReviewPhotoInput[]): Promise<ReviewPhoto[]>
  abstract findById(reviewId: number, imageId: number): Promise<ReviewPhoto | null>
  abstract deleteById(imageId: number): Promise<void>
}
