import { Module } from '@nestjs/common'

import { NftscanService } from './nftscan.service'

@Module({
  imports: [],
  providers: [NftscanService],
  exports: [NftscanService]
})
export class NftscanModule {}
