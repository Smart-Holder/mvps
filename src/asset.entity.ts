import { ErcType } from 'nftscan-api'

import { EvmAsset } from '@/nftscan/nftscan.service'

export const AssetTypeEnum: Record<string, number> = {
  [ErcType.ERC_721]: 1,
  [ErcType.ERC_1155]: 2
}

export function formatHex(hex_str: string | number | bigint, btyes = 32) {
  let s = ''
  if (typeof hex_str == 'string') {
    s = BigInt(hex_str).toString(16)
  } else {
    s = hex_str.toString(16)
  }
  const len = btyes * 2 - s.length
  if (len > 0) {
    return '0x' + Array.from({ length: len + 1 }).join('0') + s
  } else {
    return '0x' + s
  }
}

export class AssetEntity {
  token: string
  tokenId: string
  chain: number
  count: number
  uri: string
  name?: string
  author: string
  type: number
  media?: string
  mediaOrigin?: string
  image?: string
  imageOrigin?: string
  thumbnail?: string
  externalLink?: string
  symbol?: string
  info?: string
  owner: string
  ownerBase?: string
  metadataJson: Record<string, any>

  constructor(source: EvmAsset) {
    this.token = source.contract_address
    this.chain = source.chain
    this.tokenId = formatHex(source.token_id)
    this.count = source.ownsTotal
    this.uri = source.token_uri
    this.name = source.name || source.contract_name
    this.type = AssetTypeEnum[source.erc_type]
    this.author = source.minter
    this.media = source.nftscan_uri || ''
    this.mediaOrigin = source.content_uri || ''
    this.image = source.nftscan_uri || ''
    this.imageOrigin = source.image_uri || ''
    this.thumbnail = source.small_nftscan_uri || ''
    this.externalLink = source.external_link || ''
    this.symbol = source.symbol
    this.info = source.description
    this.metadataJson = JSON.parse(source.metadata_json)
    this.owner = source.owner
    this.ownerBase = source.ownerBase
  }
}
