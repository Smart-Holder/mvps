import {
  ClassSerializerInterceptor,
  Controller,
  Get,
  Query,
  UseInterceptors
} from '@nestjs/common'

import { AppService } from '@/app.service'
import { GetNftByOwnerPageDto } from '@/app.dto'

@Controller()
@UseInterceptors(ClassSerializerInterceptor)
export class AppController {
  constructor(private readonly app: AppService) {}

  @Get('health')
  health() {
    return { status: 'ok', time: Date.now() }
  }

  @Get('nfts')
  getNfts(@Query() query: GetNftByOwnerPageDto) {
    return this.app.getAssetsByOwner(query)
  }
}
