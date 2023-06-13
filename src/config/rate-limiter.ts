import { RateLimiterOptions } from 'nestjs-rate-limiter'
import { registerAs } from '@nestjs/config'

export default registerAs<RateLimiterOptions>('rateLimiter', () => ({
  logger: !!process.env.RATE_LIMITER_LOGGER,
  // limit each IP to 100 requests per duration
  points: +process.env.RATE_LIMITER_POINTS,
  // 10 minutes
  duration: +process.env.RATE_LIMITER_DURATION
}))
