import { AppException } from '../../../../common/exceptions/app.exception'

export class InvalidCredentialsException extends AppException {
  constructor(message = 'Invalid credentials') {
    super('INVALID_CREDENTIALS', 401, message)
  }
}

export class InvalidRefreshTokenException extends AppException {
  constructor(message = 'Invalid refresh token') {
    super('INVALID_REFRESH_TOKEN', 401, message)
  }
}

export class TokenExpiredException extends AppException {
  constructor(message = 'Token expired') {
    super('TOKEN_EXPIRED', 401, message)
  }
}

export class InvalidGoogleTokenException extends AppException {
  constructor(message = 'Invalid Google token') {
    super('INVALID_GOOGLE_TOKEN', 401, message)
  }
}

export class UserBannedException extends AppException {
  constructor(message = 'User is banned') {
    super('USER_BANNED', 403, message)
  }
}

export class EmailAlreadyExistsException extends AppException {
  constructor(message = 'Email already exists') {
    super('EMAIL_ALREADY_EXISTS', 409, message)
  }
}
