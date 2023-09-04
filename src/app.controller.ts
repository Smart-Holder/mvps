import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  Request
} from '@nestjs/common'

import { AppService } from '@/app.service'
import {
  GetNftsByOwnerDto,
  GetNftsByTokenDto,
  GetTransactionsDto,
  NotifyDto
} from '@/app.dto'

@Controller()
export class AppController {
  constructor(private readonly app: AppService) {}

  @Get('health')
  health() {
    return { status: 'ok', time: Date.now() }
  }

  @Get('owner/nfts')
  async getNftsByOwner(@Query() query: GetNftsByOwnerDto, @Req() req: Request) {
    return this.app.getAssetsByOwner(query, req.url)
  }

  @Get('token/nfts')
  async getNftsByToken(@Query() query: GetNftsByTokenDto) {
    return this.app.getAssetsByToken(query)
  }

  @Get('token/transactions')
  async getTransactions(@Query() query: GetTransactionsDto) {
    return this.app.getTransactions(query)
  }

  @Post('notify')
  async notify(@Body() body: NotifyDto) {
    await this.app.sendNotify(body)
    return { status: 'ok', time: Date.now() }
  }

  @Get('caches')
  async getCaches() {
    const keys = await this.app.getHardwareCacheKeys()
    return { status: 'ok', time: Date.now(), keys: keys }
  }

  @Post('clear/cache')
  async clearCache() {
    const clearKeys = await this.app.clearHardwareCache()
    return { status: 'ok', time: Date.now(), keys: clearKeys }
  }
}
