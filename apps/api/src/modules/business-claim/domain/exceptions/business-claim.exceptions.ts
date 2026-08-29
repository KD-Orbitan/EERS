import { AppException } from '../../../../common/exceptions/app.exception'

export class BusinessClaimNotFoundException extends AppException {
  constructor(message = 'Business claim not found') {
    super('BUSINESS_CLAIM_NOT_FOUND', 404, message)
  }
}

export class BusinessAlreadyClaimedException extends AppException {
  constructor(message = 'Business already has an owner') {
    super('BUSINESS_ALREADY_CLAIMED', 409, message)
  }
}

export class ClaimAlreadyPendingException extends AppException {
  constructor(message = 'You already have a pending claim on this business') {
    super('CLAIM_ALREADY_PENDING', 409, message)
  }
}

export class ClaimNotPendingException extends AppException {
  constructor(message = 'Claim status is not pending') {
    super('CLAIM_NOT_PENDING', 400, message)
  }
}
