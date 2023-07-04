import { EvmChain } from 'nftscan-api'
import { Injectable, Logger } from '@nestjs/common'
import { isDefined } from 'class-validator'

import { AssetEntity } from '@/asset.entity'
import { GetNftsByOwnerDto, GetNftsByTokenDto } from '@/app.dto'
import { NftscanService } from '@/nftscan/nftscan.service'
import { SubgraphService } from '@/subgraph/subgraph.service'

@Injectable()
export class AppService {
  logger = new Logger(AppService.name, { timestamp: true })

  constructor(
    private readonly nftScan: NftscanService,
    private readonly subgraph: SubgraphService
  ) {}

  async getAssetsByOwner(params: GetNftsByOwnerDto) {
    try {
      const { owner, chain, token, tokenId, limit = 10, page = 1 } = params
      let items

      if (isDefined(chain)) {
        if (!this.nftScan.isSupportedChainId(chain)) {
          return { total: 0, totalPage: 0, items: [] }
        }
        switch (chain) {
          case this.nftScan.chains.eth:
            items = await this.nftScan.getEthAssetsByAccountAddress(owner)
            const eths = await this.getEthAssetsByOwnerWithSubgraph(owner)
            items = items.concat(eths)
            break
          case this.nftScan.chains.polygon:
            items = await this.nftScan.getPolygonAssetsByAccountAddress(owner)
            const polygons = await this.getPolygonAssetsByOwnerWithSubgraph(
              owner
            )
            items = items.concat(polygons)
            break
        }
      } else {
        items = await Promise.all([
          this.nftScan.getEthAssetsByAccountAddress(owner),
          this.nftScan.getPolygonAssetsByAccountAddress(owner)
        ]).then((items) => items.flat())

        const eths = await this.getEthAssetsByOwnerWithSubgraph(owner)
        const polygons = await this.getPolygonAssetsByOwnerWithSubgraph(owner)

        items = items.concat(eths, polygons)
      }

      if (isDefined(token)) {
        items = items.filter((item) => item.contract_address === token)
      }

      if (isDefined(tokenId)) {
        items = items.filter((item) => item.token_id === tokenId)
      }

      items.sort((a, b) => b.mint_timestamp - a.mint_timestamp)

      const skip = (page - 1) * limit
      const total = items.length
      const totalPage = Math.ceil(total / limit)
      return {
        total,
        totalPage,
        items: items
          .slice(skip, skip + limit)
          .map((item) => new AssetEntity(item))
      }
    } catch (error) {
      this.logger.error(JSON.stringify(error))
      return { total: 0, totalPage: 0, items: [] }
    }
  }

  async getAssetsByToken(params: GetNftsByTokenDto) {
    try {
      const { chain, token, tokenId, limit = 10, page = 1 } = params
      let items

      if (isDefined(chain)) {
        if (!this.nftScan.isSupportedChainId(chain)) {
          return { total: 0, totalPage: 0, items: [] }
        }
        switch (chain) {
          case this.nftScan.chains.eth:
            items = await this.nftScan.getEthAssetsFilters([
              { contractAddress: token }
            ])
            const eths = await this.getEthAssetsByTokenWithSubgraph(token)
            items = items.concat(eths)
            break
          case this.nftScan.chains.polygon:
            items = await this.nftScan.getPolygonAssetsFilters([
              { contractAddress: token }
            ])
            const polygons = await this.getPolygonAssetsByTokenWithSubgraph(
              token
            )
            items = items.concat(polygons)
            break
        }
      } else {
        items = await Promise.all([
          this.nftScan.getEthAssetsFilters([{ contractAddress: token }]),
          this.nftScan.getPolygonAssetsFilters([{ contractAddress: token }])
        ]).then((items) => items.flat())

        const eths = await this.getEthAssetsByTokenWithSubgraph(token)
        const polygons = await this.getPolygonAssetsByTokenWithSubgraph(token)

        items = items.concat(eths, polygons)
      }

      if (isDefined(tokenId)) {
        items = items.filter((item) => item.token_id === tokenId)
      }

      items.sort((a, b) => b.mint_timestamp - a.mint_timestamp)

      const skip = (page - 1) * limit
      const total = items.length
      const totalPage = Math.ceil(total / limit)
      return {
        total,
        totalPage,
        items: items
          .slice(skip, skip + limit)
          .map((item) => new AssetEntity(item))
      }
    } catch (error) {
      this.logger.error(JSON.stringify(error))
      return { total: 0, totalPage: 0, items: [] }
    }
  }

  private async getEthAssetsByOwnerWithSubgraph(owner: string) {
    const { assets } = await this.subgraph.getAssetsByOwner(EvmChain.ETH, owner)
    const batchQuery = assets.map((asset) => ({
      contractAddress: asset.token,
      tokenId: asset.tokenId
    }))
    return this.nftScan.getEthAssetsInBatches(batchQuery).then((values) =>
      values
        ? values.map((asset, i) => ({
            ...asset,
            owner: assets[i].contractAddress,
            ownerBase: owner
          }))
        : []
    )
  }

  private async getPolygonAssetsByOwnerWithSubgraph(owner: string) {
    const { assets } = await this.subgraph.getAssetsByOwner(
      EvmChain.POLYGON,
      owner
    )
    const batchQuery = assets.map((asset) => ({
      contractAddress: asset.token,
      tokenId: asset.tokenId
    }))
    return this.nftScan.getPolygonAssetsInBatches(batchQuery).then((values) =>
      values
        ? values.map((asset, i) => ({
            ...asset,
            owner: assets[i].contractAddress,
            ownerBase: owner
          }))
        : []
    )
  }

  private async getEthAssetsByTokenWithSubgraph(token: string) {
    const { assets } = await this.subgraph.getAssetsByToken(EvmChain.ETH, token)
    const batchQuery = assets.map((asset) => ({
      contractAddress: asset.token,
      tokenId: asset.tokenId
    }))
    return this.nftScan.getEthAssetsInBatches(batchQuery).then((values) =>
      values
        ? values.map((asset, i) => ({
            ...asset,
            owner: assets[i].contractAddress,
            ownerBase: assets[i].to
          }))
        : []
    )
  }

  private async getPolygonAssetsByTokenWithSubgraph(token: string) {
    const { assets } = await this.subgraph.getAssetsByToken(
      EvmChain.POLYGON,
      token
    )
    const batchQuery = assets.map((asset) => ({
      contractAddress: asset.token,
      tokenId: asset.tokenId
    }))
    return this.nftScan.getPolygonAssetsInBatches(batchQuery).then((values) =>
      values
        ? values.map((asset, i) => ({
            ...asset,
            owner: assets[i].contractAddress,
            ownerBase: assets[i].to
          }))
        : []
    )
  }
}
