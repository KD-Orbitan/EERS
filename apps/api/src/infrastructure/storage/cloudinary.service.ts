import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { v2 as cloudinary } from 'cloudinary'
import { ImageStorage, type StoredImage } from '../../common/ports/image-storage.port'

@Injectable()
export class CloudinaryService extends ImageStorage {
  constructor(private configService: ConfigService) {
    super()
    cloudinary.config({
      cloud_name: this.configService.get('cloudinary.cloudName'),
      api_key: this.configService.get('cloudinary.apiKey'),
      api_secret: this.configService.get('cloudinary.apiSecret'),
    })
  }

  async uploadImage(fileBuffer: Buffer, fileName: string) {
    return new Promise<StoredImage>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'auto',
          folder: 'eers',
          public_id: fileName,
        },
        (error, result) => {
          if (error) reject(error)
          else if (result) resolve({ publicId: result.public_id, secureUrl: result.secure_url, width: result.width, height: result.height, format: result.format })
          else reject(new Error('Image upload returned no result'))
        },
      )

      uploadStream.end(fileBuffer)
    })
  }

  async deleteImage(publicId: string) {
    return cloudinary.uploader.destroy(publicId)
  }
}
