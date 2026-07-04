import { AppException } from '../../../../common/exceptions/app.exception'

export class CriterionNotFoundException extends AppException {
  constructor(message = 'Criterion not found') {
    super('CRITERION_NOT_FOUND', 404, message)
  }
}
