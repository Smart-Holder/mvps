import { ConfigService } from '@nestjs/config'
import { EvmChain } from 'nftscan-api'
import { Injectable, Logger } from '@nestjs/common'
import { gql, request } from 'graphql-request'

interface SubgraphAsset {
  type: 'ERC_721' | 'ERC_1155'
  token: string
  tokenId: string
  from: string
  to: string
}

@Injectable()
export class SubgraphService {
  private logger = new Logger(SubgraphService.name, { timestamp: true })

  private readonly getAssetsDocument = gql`
    query getAssets($first: Int, $owner: String, $token: String) {
      assets(
        first: $first
        orderBy: lastUpdateBlockNumber
        orderDirection: desc
        where: { to: $owner, token: $token }
      ) {
        type
        token
        tokenId
        from
        to
      }
    }
  `

  private endpoints = {} as {
    [EvmChain.ETH]: string
    [EvmChain.POLYGON]: string
  }

  constructor(private readonly config: ConfigService) {
    this.endpoints.eth = this.config.get<string>('subgraph.endpoints.eth')
    this.endpoints.polygon = this.config.get<string>(
      'subgraph.endpoints.polygon'
    )
  }

  getAssetsByOwner(
    chain: keyof typeof this.endpoints,
    owner: string,
    first = 100
  ) {
    return request<{ assets: SubgraphAsset[] }>(
      this.endpoints[chain],
      this.getAssetsDocument,
      { owner, first }
    )
  }

  getAssetsByToken(
    chain: keyof typeof this.endpoints,
    token: string,
    first = 100
  ) {
    return request<{ assets: SubgraphAsset[] }>(
      this.endpoints[chain],
      this.getAssetsDocument,
      { token, first }
    )
  }
}
