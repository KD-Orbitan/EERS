import { AppException } from '../../../../common/exceptions/app.exception'

export class CategoryNotFoundException extends AppException {
  constructor(message = 'Category not found') {
    super('CATEGORY_NOT_FOUND', 404, message)
  }
}
