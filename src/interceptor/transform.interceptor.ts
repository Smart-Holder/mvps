import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor
} from '@nestjs/common'
import { Response } from 'express'
import { isDefined } from 'class-validator'
import { map } from 'rxjs'

@Injectable()
export class TransformInterceptor implements NestInterceptor {
  logger = new Logger(TransformInterceptor.name, { timestamp: true })

  intercept(context: ExecutionContext, next: CallHandler) {
    return next.handle().pipe(
      map((data) => {
        let resultData
        if (
          isDefined(data) &&
          isDefined(data.items) &&
          isDefined(data.total) &&
          isDefined(data.totalPage)
        ) {
          const http = context.switchToHttp()
          const response = http.getResponse() as Response
          response.set('X-Total', data.total)
          response.set('X-Total-Page', data.totalPage)
          resultData = data.items
        } else {
          resultData = data
        }

        return {
          code: 0,
          errno: 0,
          data: resultData,
          st: Date.now()
        }
      })
    )
  }
}
