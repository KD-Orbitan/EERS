import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common'
import { Response } from 'express'
import { AppException } from '../exceptions/app.exception'

export class DomainException extends Error {
  constructor(
    public readonly code: string,
    public readonly statusCode: number,
    message: string,
  ) {
    super(message)
    this.name = 'DomainException'
  }
}

export const ERROR_CODE_MAP: Record<string, number> = {
  // Auth errors
  UNAUTHORIZED: HttpStatus.UNAUTHORIZED,
  INVALID_CREDENTIALS: HttpStatus.UNAUTHORIZED,
  INVALID_REFRESH_TOKEN: HttpStatus.UNAUTHORIZED,
  TOKEN_EXPIRED: HttpStatus.UNAUTHORIZED,
  INVALID_GOOGLE_TOKEN: HttpStatus.UNAUTHORIZED,
  USER_BANNED: HttpStatus.FORBIDDEN,
  FORBIDDEN: HttpStatus.FORBIDDEN,

  // User errors
  USER_NOT_FOUND: HttpStatus.NOT_FOUND,
  EMAIL_ALREADY_EXISTS: HttpStatus.CONFLICT,
  INVALID_PASSWORD: HttpStatus.BAD_REQUEST,
  CANNOT_BAN_ADMIN: HttpStatus.BAD_REQUEST,
  USER_NOT_BANNED: HttpStatus.BAD_REQUEST,

  // Business errors
  BUSINESS_NOT_FOUND: HttpStatus.NOT_FOUND,
  BUSINESS_NOT_APPROVED: HttpStatus.BAD_REQUEST,
  BUSINESS_NOT_PENDING: HttpStatus.BAD_REQUEST,
  PHONE_ALREADY_EXISTS: HttpStatus.CONFLICT,
  LAST_LOCATION_ERROR: HttpStatus.BAD_REQUEST,
  LOCATION_NOT_FOUND: HttpStatus.NOT_FOUND,
  GALLERY_LIMIT_EXCEEDED: HttpStatus.BAD_REQUEST,

  // Review errors
  REVIEW_NOT_FOUND: HttpStatus.NOT_FOUND,
  REVIEW_ALREADY_EXISTS: HttpStatus.CONFLICT,
  REVIEW_NOT_PENDING: HttpStatus.BAD_REQUEST,
  INVALID_RATING: HttpStatus.BAD_REQUEST,
  INVALID_CRITERION: HttpStatus.BAD_REQUEST,
  SENTIMENT_ANALYSIS_UNAVAILABLE: HttpStatus.SERVICE_UNAVAILABLE,

  // Reply errors
  REPLY_NOT_FOUND: HttpStatus.NOT_FOUND,
  REPLY_ALREADY_EXISTS: HttpStatus.CONFLICT,
  PHOTO_LIMIT_EXCEEDED: HttpStatus.BAD_REQUEST,

  // Report errors
  REPORT_NOT_FOUND: HttpStatus.NOT_FOUND,
  REPORT_ALREADY_EXISTS: HttpStatus.CONFLICT,
  REPORT_NOT_WITHDRAWABLE: HttpStatus.BAD_REQUEST,
  REASON_NOT_FOUND: HttpStatus.NOT_FOUND,

  // Category & Criteria errors
  CATEGORY_NOT_FOUND: HttpStatus.NOT_FOUND,
  CATEGORY_ALREADY_EXISTS: HttpStatus.CONFLICT,
  CRITERION_NOT_FOUND: HttpStatus.NOT_FOUND,
  CRITERION_ALREADY_EXISTS: HttpStatus.CONFLICT,
  ASSIGNMENT_ALREADY_EXISTS: HttpStatus.CONFLICT,
  ASSIGNMENT_NOT_FOUND: HttpStatus.NOT_FOUND,

  // Notification errors
  NOTIFICATION_NOT_FOUND: HttpStatus.NOT_FOUND,

  // File errors
  INVALID_FILE_TYPE: HttpStatus.BAD_REQUEST,
  FILE_TOO_LARGE: HttpStatus.BAD_REQUEST,
  IMAGE_NOT_FOUND: HttpStatus.NOT_FOUND,

  // General errors
  VALIDATION_ERROR: HttpStatus.BAD_REQUEST,
  RESOURCE_NOT_FOUND: HttpStatus.NOT_FOUND,
  INTERNAL_SERVER_ERROR: HttpStatus.INTERNAL_SERVER_ERROR,
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name)

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR
    let errorCode = 'INTERNAL_SERVER_ERROR'
    let message = 'Internal server error'

    if (exception instanceof AppException) {
      statusCode = exception.status
      errorCode = exception.code
      message = exception.message
    } else if (exception instanceof DomainException) {
      statusCode = exception.statusCode
      errorCode = exception.code
      message = exception.message
    } else if (exception instanceof HttpException) {
      statusCode = exception.getStatus()
      const exceptionResponse = exception.getResponse()
      if (typeof exceptionResponse === 'object') {
        const responseObj = exceptionResponse as any
        errorCode = responseObj.error || 'HTTP_ERROR'
        message = responseObj.message || exception.message
      } else {
        message = exception.message
      }
    } else if (exception instanceof Error) {
      message = exception.message
      this.logger.error(`Unhandled exception: ${exception.message}`, exception.stack)
    }

    response.status(statusCode).json({
      success: false,
      error: {
        code: errorCode,
        message: message,
      },
    })
  }
}
