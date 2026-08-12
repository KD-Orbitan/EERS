import { AppException } from '../../../../common/exceptions/app.exception'

export class NotificationNotFoundException extends AppException {
  constructor(message = 'Notification not found') {
    super('NOTIFICATION_NOT_FOUND', 404, message)
  }
}
