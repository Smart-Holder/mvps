import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus
} from '@nestjs/common'
import { Response } from 'express'

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const { message } = exception.getResponse() as { message: string[] }

    response.status(HttpStatus.OK).json({
      code: -1,
      errno: -1,
      message,
      st: Date.now()
    })
  }
}
