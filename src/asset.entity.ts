import { AssetTypeEnum, formatHex } from '@/utils'
import { EvmAsset } from '@/nftscan/nftscan.service'

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
    this.media = source.nftscan_uri || source.content_uri || ''
    this.mediaOrigin = source.content_uri || ''
    this.image = source.nftscan_uri || source.image_uri || ''
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
