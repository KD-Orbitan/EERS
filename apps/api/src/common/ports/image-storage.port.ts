export interface StoredImage {
  publicId: string
  secureUrl: string
  width: number
  height: number
  format: string
}

export abstract class ImageStorage {
  abstract uploadImage(buffer: Buffer, fileName: string): Promise<StoredImage>
  abstract deleteImage(publicId: string): Promise<unknown>
}
