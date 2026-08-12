import { AppException } from './app.exception'

export class InvalidFileTypeException extends AppException {
  constructor(message = 'File type not allowed') {
    super('INVALID_FILE_TYPE', 400, message)
  }
}

export class FileTooLargeException extends AppException {
  constructor(message = 'File exceeds 10MB limit') {
    super('FILE_TOO_LARGE', 400, message)
  }
}

export class ImageNotFoundException extends AppException {
  constructor(message = 'Image not found') {
    super('IMAGE_NOT_FOUND', 404, message)
  }
}
