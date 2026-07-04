import { AppException } from '../../../../common/exceptions/app.exception'

export class UserNotFoundException extends AppException {
  constructor(message = 'User not found') {
    super('USER_NOT_FOUND', 404, message)
  }
}

export class InvalidPasswordException extends AppException {
  constructor(message = 'Invalid current password') {
    super('INVALID_PASSWORD', 400, message)
  }
}
