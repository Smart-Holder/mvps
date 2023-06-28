import cookieParser from 'cookie-parser'
import helmet from 'helmet'
import { ConfigService } from '@nestjs/config'
import { Logger } from '@nestjs/common'
import { NestExpressApplication } from '@nestjs/platform-express'
import { NestFactory } from '@nestjs/core'

import { AppModule } from './app.module'

const logger = new Logger('Bootstrap', { timestamp: true })

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {})

  app.use(helmet())
  app.use(cookieParser())

  app.enableCors()
  app.setGlobalPrefix('api')

  const config = app.get(ConfigService)
  const port = config.get<number>('PORT')

  await app.listen(port)

  logger.log(`Application starts on port: ${port}`)
}

bootstrap()
