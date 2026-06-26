import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
  HttpStatus,
} from '@nestjs/common'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        // If response is already an envelope, return as-is
        if (data && typeof data === 'object' && 'success' in data) {
          return data
        }

        // Wrap response in envelope
        return {
          success: true,
          data: data,
        }
      }),
    )
  }
}
