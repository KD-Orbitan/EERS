import { AppException } from '../../../../common/exceptions/app.exception'

export class BusinessNotFoundException extends AppException {
  constructor(message = 'Business not found') {
    super('BUSINESS_NOT_FOUND', 404, message)
  }
}

export class BusinessNotApprovedException extends AppException {
  constructor(message = 'Business is not approved') {
    super('BUSINESS_NOT_APPROVED', 400, message)
  }
}

export class BusinessNotPendingException extends AppException {
  constructor(message = 'Business is not pending') {
    super('BUSINESS_NOT_PENDING', 400, message)
  }
}

export class PhoneAlreadyExistsException extends AppException {
  constructor(message = 'Phone already exists') {
    super('PHONE_ALREADY_EXISTS', 409, message)
  }
}

export class EmailAlreadyExistsException extends AppException {
  constructor(message = 'Email already exists') {
    super('EMAIL_ALREADY_EXISTS', 409, message)
  }
}

export class LastLocationErrorException extends AppException {
  constructor(message = 'Cannot remove last location') {
    super('LAST_LOCATION_ERROR', 400, message)
  }
}

export class LocationNotFoundException extends AppException {
  constructor(message = 'Location not found') {
    super('LOCATION_NOT_FOUND', 404, message)
  }
}

export class CategoryNotFoundException extends AppException {
  constructor(message = 'Category not found') {
    super('CATEGORY_NOT_FOUND', 404, message)
  }
}
