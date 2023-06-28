import { Controller, Get, Query } from '@nestjs/common'

import { AppService } from '@/app.service'
import { GetNftsDto } from '@/app.dto'

@Controller()
export class AppController {
  constructor(private readonly app: AppService) {}

  @Get('health')
  health() {
    return { status: 'ok', time: Date.now() }
  }

  @Get('nfts')
  async getNfts(@Query() query: GetNftsDto) {
    return this.app.getAssetsByOwner(query)
  }
}
