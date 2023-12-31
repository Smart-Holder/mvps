import { ConfigService } from '@nestjs/config'
import { EvmChain } from 'nftscan-api'
import { Injectable, Logger } from '@nestjs/common'
import { gql, request } from 'graphql-request'
import { isDefined } from 'class-validator'

interface SubgraphAsset {
  type: 'ERC_721' | 'ERC_1155'
  token: string
  tokenId: string
  from: string
  to: string
  fromCount: number
  toCount: number
  contractAddress: string
  lastUpdateBlcokTimestamp: string
}

@Injectable()
export class SubgraphService {
  private logger = new Logger(SubgraphService.name, { timestamp: true })

  private readonly getAssetsDocument = gql`
    query getAssets($first: Int, $where: Asset_filter) {
      assets(
        first: $first
        where: $where
        orderBy: lastUpdateBlockNumber
        orderDirection: desc
      ) {
        type
        token
        tokenId
        from
        to
        fromCount
        toCount
        contractAddress
        lastUpdateBlockNumber
        lastUpdateBlcokTimestamp
      }
    }
  `

  private readonly getMetaDocument = gql`
    query getMeta {
      _meta {
        deployment
        hasIndexingErrors
        block {
          hash
          timestamp
          number
        }
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

  private fillterAssets(
    req: Promise<{ assets: SubgraphAsset[] }>,
    filterZero = true
  ) {
    return req.then((v) => {
      if (filterZero) {
        v.assets = v.assets.filter(
          (v) => v.to !== '0x0000000000000000000000000000000000000000'
        )
      }
      v.assets.sort(
        (a, b) => +b.lastUpdateBlcokTimestamp - +a.lastUpdateBlcokTimestamp
      )
      return v
    })
  }

  getSubgraphMeta(chain: keyof typeof this.endpoints) {
    return request<{
      _meta: {
        deployment: string
        hasIndexingErrors: boolean
        block: { hash: string; timestamp: number; number: number }
      }
    }>(this.endpoints[chain], this.getMetaDocument)
  }

  getAssetsByOwner(
    chain: keyof typeof this.endpoints,
    owner: string,
    first = 100
  ) {
    return this.fillterAssets(
      request<{ assets: SubgraphAsset[] }>(
        this.endpoints[chain],
        this.getAssetsDocument,
        { where: { to: owner }, first }
      )
    )
  }

  getAssetsByToken(
    chain: keyof typeof this.endpoints,
    token: string,
    first = 100,
    blockNumber?: string
  ) {
    const variables: {
      where: {
        token: string
        lastUpdateBlockNumber?: string
      }
    } = { where: { token } }
    if (isDefined(blockNumber)) {
      variables.where.lastUpdateBlockNumber = blockNumber
    }
    return this.fillterAssets(
      request<{ assets: SubgraphAsset[] }>(
        this.endpoints[chain],
        this.getAssetsDocument,
        { ...variables, first }
      )
    )
  }

  getOneAssetsByContractAddress(
    chain: keyof typeof this.endpoints,
    contractAddress: string,
    blockNumber?: string
  ) {
    const variables: {
      where: {
        contractAddress: string
        lastUpdateBlockNumber?: string
      }
    } = { where: { contractAddress } }
    if (isDefined(blockNumber)) {
      variables.where.lastUpdateBlockNumber = blockNumber
    }
    return this.fillterAssets(
      request<{ assets: SubgraphAsset[] }>(
        this.endpoints[chain],
        this.getAssetsDocument,
        { ...variables, first: 1 }
      ),
      false
    )
  }
}
