import { AppException } from '../../../../common/exceptions/app.exception'

export class ReportNotFoundException extends AppException {
  constructor(message = 'Report not found') {
    super('REPORT_NOT_FOUND', 404, message)
  }
}

export class ReasonNotFoundException extends AppException {
  constructor(message = 'Reason not found') {
    super('REASON_NOT_FOUND', 404, message)
  }
}

export class ReportAlreadyExistsException extends AppException {
  constructor(message = 'You have already reported this review') {
    super('REPORT_ALREADY_EXISTS', 409, message)
  }
}

export class ReportNotWithdrawableException extends AppException {
  constructor(message = 'Only pending reports can be withdrawn') {
    super('REPORT_NOT_WITHDRAWABLE', 400, message)
  }
}
