import { InvalidFileTypeException, FileTooLargeException } from '../exceptions/file.exceptions'

export const ALLOWED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
export const MAX_IMAGE_FILE_SIZE_BYTES = 10 * 1024 * 1024

export function assertValidImageFile(file: { mimetype: string; size: number } | undefined): void {
  if (!file) {
    throw new InvalidFileTypeException('No file provided')
  }
  if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.mimetype)) {
    throw new InvalidFileTypeException()
  }
  if (file.size > MAX_IMAGE_FILE_SIZE_BYTES) {
    throw new FileTooLargeException()
  }
}
