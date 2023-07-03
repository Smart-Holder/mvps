import { Controller, Get, Query } from '@nestjs/common'

import { AppService } from '@/app.service'
import { GetNftsByOwnerDto, GetNftsByTokenDto } from '@/app.dto'

@Controller()
export class AppController {
  constructor(private readonly app: AppService) {}

  @Get('health')
  health() {
    return { status: 'ok', time: Date.now() }
  }

  @Get('owner/nfts')
  async getNftsByOwner(@Query() query: GetNftsByOwnerDto) {
    return this.app.getAssetsByOwner(query)
  }

  @Get('token/nfts')
  async getNftsByToken(@Query() query: GetNftsByTokenDto) {
    return this.app.getAssetsByToken(query)
  }
}
