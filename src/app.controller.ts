import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  Post,
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

  @Post('nft/getNFTByOwnerPage')
  getNftByOwnerPage(@Body() body: GetNftByOwnerPageDto) {
    return this.app.getAssetsByOwner(body)
  }
}
