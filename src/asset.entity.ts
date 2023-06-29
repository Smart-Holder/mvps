import { ErcType } from 'nftscan-api'

import { EvmAsset } from '@/nftscan/nftscan.service'

export const AssetTypeEnum: Record<string, number> = {
  [ErcType.ERC_721]: 1,
  [ErcType.ERC_1155]: 2
}

export class AssetEntity {
  token: string
  tokenId: string
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
  metadataJson: Record<string, any>

  constructor(source: EvmAsset) {
    this.token = source.contract_address
    this.tokenId = source.token_id
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
  }
}
