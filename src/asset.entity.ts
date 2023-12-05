import { AssetTypeEnum, formatHex } from '@/utils'
import { EvmAsset } from '@/nftscan/nftscan.service'

export class AssetEntity {
  token: string
  tokenId: string
  tokenIdInt: string
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
    let metadataJson = {} as { image?: string }
    try {
      metadataJson = JSON.parse(source.metadata_json)
    } catch (error) {}
    this.token = source.contract_address
    this.chain = source.chain
    this.tokenId = formatHex(source.token_id)
    this.tokenIdInt = source.token_id
    this.count = source.ownsTotal
    this.uri = source.token_uri
    this.name = source.name || source.contract_name
    this.type = AssetTypeEnum[source.erc_type]
    this.author = source.minter
    let mediaUri = ''
    if (
      source.nftscan_uri &&
      source.nftscan_uri.startsWith('http') &&
      !source.nftscan_uri.startsWith('ipfs')
    ) {
      mediaUri = source.nftscan_uri
    } else if (
      source.content_uri &&
      source.content_uri.startsWith('http') &&
      !source.content_uri.startsWith('ipfs')
    ) {
      mediaUri = source.content_uri
    }
    if (!mediaUri.startsWith('http') && !mediaUri.startsWith('/') && mediaUri) {
      mediaUri = `https://ipfs.io/ipfs/${mediaUri}`
    }
    if (
      source.content_uri &&
      !source.content_uri.startsWith('http') &&
      !source.content_uri.startsWith('ipfs') &&
      !source.content_uri.startsWith('/')
    ) {
      mediaUri = `https://ipfs.io/ipfs/${source.content_uri}`
    }
    this.media = mediaUri || source.content_uri || ''
    this.mediaOrigin = source.content_uri || ''
    let imgUri = ''
    if (
      source.nftscan_uri &&
      source.nftscan_uri.startsWith('http') &&
      !source.nftscan_uri.startsWith('ipfs')
    ) {
      imgUri = source.image_uri
    } else if (
      source.image_uri &&
      source.image_uri.startsWith('http') &&
      !source.image_uri.startsWith('ipfs')
    ) {
      imgUri = source.image_uri
    } else if (
      metadataJson.image &&
      metadataJson.image.startsWith('http') &&
      !metadataJson.image.startsWith('ipfs')
    ) {
      imgUri = metadataJson.image
    }
    if (!imgUri.startsWith('http') && !imgUri.startsWith('/') && imgUri) {
      imgUri = `https://ipfs.io/ipfs/${imgUri}`
    }
    this.image = imgUri || source.image_uri || ''
    this.imageOrigin = source.image_uri || ''
    this.thumbnail = source.small_nftscan_uri || ''
    this.externalLink = source.external_link || ''
    this.symbol = source.symbol
    this.info = source.description
    this.metadataJson = metadataJson
    this.owner = source.owner
    this.ownerBase = source.ownerBase
  }
}
