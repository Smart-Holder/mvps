import { Asset } from 'nftscan-api/dist/src/types/evm'
import { ConfigService } from '@nestjs/config'
import { EvmChain, NftscanEvm } from 'nftscan-api'
import { Injectable, Logger } from '@nestjs/common'
import { arrayContains } from 'class-validator'

export type EvmAsset = Asset & {
  chain: number
  total: number
  symbol: string
  ownsTotal: number
  description: string
}

@Injectable()
export class NftscanService {
  private logger = new Logger(NftscanService.name, { timestamp: true })

  readonly chains = {
    [EvmChain.ETH]: 1,
    [EvmChain.POLYGON]: 137
  };
  readonly [EvmChain.ETH]: NftscanEvm;
  readonly [EvmChain.POLYGON]: NftscanEvm

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('nftScan.apiKey')
    this.eth = new NftscanEvm({ apiKey, chain: EvmChain.ETH })
    this.polygon = new NftscanEvm({ apiKey, chain: EvmChain.POLYGON })
  }

  isSupportedChainId(chainId: number) {
    return arrayContains(Object.values(this.chains), [chainId])
  }

  getEthAssetsByAccountAddress(owner: string) {
    return this.eth.asset.getAllAssets(owner, null, true).then((items) => {
      const assets: EvmAsset[] = []
      items.forEach((item) => {
        assets.push(
          ...item.assets.map((asset) => ({
            chain: this.chains['eth'],
            total: item.items_total,
            ownsTotal: +asset.amount,
            symbol: item.symbol,
            description: item.description,
            ...asset
          }))
        )
      })
      return assets
    })
  }

  getPolygonAssetsByAccountAddress(owner: string) {
    return this.polygon.asset.getAllAssets(owner, null, true).then((items) => {
      const assets: EvmAsset[] = []
      items.forEach((item) => {
        assets.push(
          ...item.assets.map((asset) => ({
            chain: this.chains['polygon'],
            total: item.items_total,
            ownsTotal: +asset.amount,
            symbol: item.symbol,
            description: item.description,
            ...asset
          }))
        )
      })
      return assets
    })
  }

  getEthAssetsByContractAndTokenId(contractAddress: string, tokenId: string) {
    return Promise.all([
      this.eth.asset.getAssetsByContractAndTokenId(contractAddress, tokenId),
      this.eth.collection.getCollectionsByContract(contractAddress)
    ]).then((results) => {
      const [asset, collection] = results
      return {
        chain: this.chains['eth'],
        total: collection.items_total,
        ownsTotal: +asset.amount,
        symbol: collection.symbol,
        description: collection.description,
        ...asset
      } as EvmAsset
    })
  }

  getPolygonAssetsByContractAndTokenId(
    contractAddress: string,
    tokenId: string
  ) {
    return Promise.all([
      this.polygon.asset.getAssetsByContractAndTokenId(
        contractAddress,
        tokenId
      ),
      this.polygon.collection.getCollectionsByContract(contractAddress)
    ]).then((results) => {
      const [asset, collection] = results
      return {
        chain: this.chains['polygon'],
        total: collection.items_total,
        ownsTotal: +asset.amount,
        symbol: collection.symbol,
        description: collection.description,
        ...asset
      } as EvmAsset
    })
  }

  getEthAssetsInBatches(list: { contractAddress: string; tokenId: string }[]) {
    if (list.length === 0) return Promise.resolve([])
    return Promise.all([
      this.eth.asset.queryAssetsInBatches(
        list.map((it) => ({
          contract_address: it.contractAddress,
          token_id: it.tokenId
        }))
      ),
      this.eth.collection.queryCollectionsByFilters({
        contract_address_list: list.map((it) => it.contractAddress)
      })
    ]).then((results) => {
      const [assets, collections] = results
      const assetList: EvmAsset[] = []
      assets.forEach((item) => {
        const collection = collections.find(
          (it) => it.contract_address === item.contract_address
        )
        assetList.push({
          chain: this.chains['eth'],
          total: collection.items_total,
          ownsTotal: +item.amount,
          symbol: collection.symbol,
          description: collection.description,
          ...item
        })
      })
      return assetList
    })
  }

  getPolygonAssetsInBatches(
    list: { contractAddress: string; tokenId: string }[]
  ) {
    if (list.length === 0) return Promise.resolve([])
    return Promise.all([
      this.polygon.asset.queryAssetsInBatches(
        list.map((it) => ({
          contract_address: it.contractAddress,
          token_id: it.tokenId
        }))
      ),
      this.polygon.collection.queryCollectionsByFilters({
        contract_address_list: list.map((it) => it.contractAddress)
      })
    ]).then((results) => {
      const [assets, collections] = results
      const assetList: EvmAsset[] = []
      assets.forEach((item) => {
        const collection = collections.find(
          (it) => it.contract_address === item.contract_address
        )
        assetList.push({
          chain: this.chains['polygon'],
          total: collection.items_total,
          ownsTotal: +item.amount,
          symbol: collection.symbol,
          description: collection.description,
          ...item
        })
      })
      return assetList
    })
  }

  getEthAssetsFilters(list: { contractAddress: string }[]) {
    if (list.length === 0) return Promise.resolve([])
    return Promise.all([
      this.eth.asset.queryAssetsByFilters({
        limit: 100,
        contract_address_list: list.map((it) => it.contractAddress)
      }),
      this.eth.collection.queryCollectionsByFilters({
        contract_address_list: list.map((it) => it.contractAddress)
      })
    ]).then((results) => {
      const [assets, collections] = results
      const assetList: EvmAsset[] = []
      assets.content.forEach((item) => {
        const collection = collections.find(
          (it) => it.contract_address === item.contract_address
        )
        assetList.push({
          chain: this.chains['eth'],
          total: collection.items_total,
          ownsTotal: +item.amount,
          symbol: collection.symbol,
          description: collection.description,
          ...item
        })
      })
      return assetList
    })
  }

  getPolygonAssetsFilters(list: { contractAddress: string }[]) {
    if (list.length === 0) return Promise.resolve([])
    return Promise.all([
      this.polygon.asset.queryAssetsByFilters({
        limit: 100,
        contract_address_list: list.map((it) => it.contractAddress)
      }),
      this.polygon.collection.queryCollectionsByFilters({
        contract_address_list: list.map((it) => it.contractAddress)
      })
    ]).then((results) => {
      const [assets, collections] = results
      const assetList: EvmAsset[] = []
      assets.content.forEach((item) => {
        const collection = collections.find(
          (it) => it.contract_address === item.contract_address
        )
        assetList.push({
          chain: this.chains['polygon'],
          total: collection.items_total,
          ownsTotal: +item.amount,
          symbol: collection.symbol,
          description: collection.description,
          ...item
        })
      })
      return assetList
    })
  }
}
