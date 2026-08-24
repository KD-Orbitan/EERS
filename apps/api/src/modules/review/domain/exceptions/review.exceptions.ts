import { AppException } from '../../../../common/exceptions/app.exception'

export class ReviewNotFoundException extends AppException {
  constructor(message = 'Review not found') {
    super('REVIEW_NOT_FOUND', 404, message)
  }
}

export class ReviewAlreadyExistsException extends AppException {
  constructor(message = 'Review already exists') {
    super('REVIEW_ALREADY_EXISTS', 409, message)
  }
}

export class ReviewNotPendingException extends AppException {
  constructor(message = 'Review is not pending') {
    super('REVIEW_NOT_PENDING', 400, message)
  }
}

export class InvalidRatingException extends AppException {
  constructor(message = 'Invalid rating') {
    super('INVALID_RATING', 400, message)
  }
}

export class InvalidCriterionException extends AppException {
  constructor(message = 'Invalid criterion') {
    super('INVALID_CRITERION', 400, message)
  }
}

export class ReplyNotFoundException extends AppException {
  constructor(message = 'Reply not found') {
    super('REPLY_NOT_FOUND', 404, message)
  }
}

export class ReplyAlreadyExistsException extends AppException {
  constructor(message = 'Reply already exists') {
    super('REPLY_ALREADY_EXISTS', 409, message)
  }
}

export class PhotoLimitExceededException extends AppException {
  constructor(message = 'Maximum review photos (5) reached') {
    super('PHOTO_LIMIT_EXCEEDED', 400, message)
  }
}

export class SentimentAnalysisUnavailableException extends AppException {
  constructor(message = 'Sentiment analysis is temporarily unavailable') {
    super('SENTIMENT_ANALYSIS_UNAVAILABLE', 503, message)
  }
}
