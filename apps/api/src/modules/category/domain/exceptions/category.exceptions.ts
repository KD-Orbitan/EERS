import { AppException } from '../../../../common/exceptions/app.exception'

export class CategoryNotFoundException extends AppException {
  constructor(message = 'Category not found') {
    super('CATEGORY_NOT_FOUND', 404, message)
  }
}

export class CategoryAlreadyExistsException extends AppException {
  constructor(message = 'Category name already taken') {
    super('CATEGORY_ALREADY_EXISTS', 409, message)
  }
}

export class AssignmentAlreadyExistsException extends AppException {
  constructor(message = 'Criterion already assigned to category') {
    super('ASSIGNMENT_ALREADY_EXISTS', 409, message)
  }
}

export class AssignmentNotFoundException extends AppException {
  constructor(message = 'Assignment does not exist') {
    super('ASSIGNMENT_NOT_FOUND', 404, message)
  }
}
