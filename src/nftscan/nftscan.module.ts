import { HttpModule } from '@nestjs/axios'
import { Module } from '@nestjs/common'

import { NftscanService } from './nftscan.service'

@Module({
  imports: [HttpModule],
  providers: [NftscanService],
  exports: [NftscanService]
})
export class NftscanModule {}
