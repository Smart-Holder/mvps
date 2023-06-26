import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core'
import { ConfigModule } from '@nestjs/config'
import { Module, ValidationPipe } from '@nestjs/common'

import configs, { validationSchema } from '@/config'
import { AppController } from '@/app.controller'
import { AppService } from '@/app.service'
import { HttpExceptionFilter } from '@/filter/http-exception.filter'
import { LoggerInterceptor } from '@/interceptor/logger.interceptor'
import { NftscanModule } from '@/nftscan/nftscan.module'
import { SubgraphModule } from '@/subgraph/subgraph.module'
import { TransformInterceptor } from '@/interceptor/transform.interceptor'

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
    }),
    NftscanModule,
    SubgraphModule
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_PIPE, useClass: ValidationPipe },
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
    { provide: APP_INTERCEPTOR, useClass: LoggerInterceptor }
  ]
})
export class AppModule {}
