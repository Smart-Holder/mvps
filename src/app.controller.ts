import {
  ClassSerializerInterceptor,
  Controller,
  Get,
  Query,
  UseInterceptors
} from '@nestjs/common'

import { AppService } from '@/app.service'
import { GetNftsDto } from '@/app.dto'

@Controller()
@UseInterceptors(ClassSerializerInterceptor)
export class AppController {
  constructor(private readonly app: AppService) {}

  @Get('health')
  health() {
    return { status: 'ok', time: Date.now() }
  }

  @Get('nfts')
  getNfts(@Query() query: GetNftsDto) {
    return this.app.getAssetsByOwner(query)
  }
}
