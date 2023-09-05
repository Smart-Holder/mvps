import { CacheInterceptor } from '@nestjs/cache-manager'
import { ExecutionContext, Injectable, Logger } from '@nestjs/common'

@Injectable()
export class HttpCacheInterceptor extends CacheInterceptor {
  private readonly logger = new Logger(HttpCacheInterceptor.name, {
    timestamp: true
  })

  trackBy(context: ExecutionContext): string | undefined {
    const request = context.switchToHttp().getRequest()
    const { httpAdapter } = this.httpAdapterHost

    this.logger.log(`IsRequestCacheable: ${this.isRequestCacheable(context)}`)

    const isGetRequest = httpAdapter.getRequestMethod(request) === 'GET'

    if (!isGetRequest) {
      return undefined
    }

    this.logger.log(`TrackBy: ${httpAdapter.getRequestUrl(request)}`)
    return httpAdapter.getRequestUrl(request)
  }
}
