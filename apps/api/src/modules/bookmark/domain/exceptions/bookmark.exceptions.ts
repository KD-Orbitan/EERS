import { AppException } from '../../../../common/exceptions/app.exception'

export class BookmarkNotFoundException extends AppException {
  constructor(message = 'Bookmark not found') {
    super('BOOKMARK_NOT_FOUND', 404, message)
  }
}

export class BookmarkAlreadyExistsException extends AppException {
  constructor(message = 'Business already bookmarked') {
    super('BOOKMARK_ALREADY_EXISTS', 409, message)
  }
}
