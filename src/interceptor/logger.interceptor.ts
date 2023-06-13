import {
  CallHandler,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NestInterceptor
} from '@nestjs/common'
import { catchError, map } from 'rxjs'

@Injectable()
export class LoggerInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggerInterceptor.name, {
    timestamp: true
  })

  intercept(context: ExecutionContext, next: CallHandler) {
    const request = context.switchToHttp().getRequest()
    return next.handle().pipe(
      map((data) => {
        const response = context.switchToHttp().getResponse()
        if (request.method === 'POST') {
          if (response.statusCode === HttpStatus.CREATED) {
            response.status(HttpStatus.OK)
          }
        }
        this.logger.log(
          `${response.statusCode} [${request.method}] ${request.originalUrl}`
        )
        return data
      }),
      catchError((err) => {
        if (err instanceof HttpException) {
          this.logger.error(
            `${err.getStatus()} [${request.method}] ${request.originalUrl}`,
            err.getResponse()
          )
        }
        throw err
      })
    )
  }
}
