import { AssetTypeEnum, formatHex } from '@/utils'
import { EvmTransaction } from '@/nftscan/nftscan.service'

export class AssetTransactionEntity {
  txHash: string
  blockNumber: number
  token: string
  tokenId: string
  tokenIdInt: string
  fromAddres: string
  toAddress: string
  count: number
  value: string
  price: number
  symbol: string
  symbolAddress: string
  chain: number
  type: number
  description?: string
  date: number

  constructor(source: EvmTransaction) {
    this.token = source.contract_address
    this.tokenId = formatHex(source.token_id)
    this.tokenIdInt = source.token_id
    this.txHash = source.hash
    this.blockNumber = source.block_number
    this.fromAddres = source.send
    this.toAddress = source.receive
    this.count = +source.amount
    this.value = BigInt(source.trade_value).toString()
    this.price = source.trade_price
    this.symbol = source.trade_symbol
    this.symbolAddress = source.trade_symbol_address || ''
    this.type = AssetTypeEnum[source.erc_type]
    this.chain = source.chain
    this.description = ''
    this.date = source.timestamp
  }
}
