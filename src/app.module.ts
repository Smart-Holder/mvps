import { APP_INTERCEPTOR } from '@nestjs/core'
import { ConfigModule } from '@nestjs/config'
import { Module } from '@nestjs/common'

import configs, { validationSchema } from '@/config'
import { AppController } from '@/app.controller'
import { AppService } from '@/app.service'
import { LoggerInterceptor } from '@/interceptor/logger.interceptor'

@Module({
  imports: [
    ConfigModule.forRoot({
      validationSchema,
      envFilePath: [
        `.env.${process.env.NODE_ENV}`,
        '.env.local',
        '.env.*.local'
      ],
      load: configs,
      isGlobal: true
    })
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_INTERCEPTOR, useClass: LoggerInterceptor }
  ]
})
export class AppModule {}
