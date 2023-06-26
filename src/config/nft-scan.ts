import { registerAs } from '@nestjs/config'

export default registerAs('nftScan', () => ({
  apiKey: process.env.NFT_SCAN_API_KEY
}))
