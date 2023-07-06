import { Asset, Transaction } from 'nftscan-api/dist/src/types/evm'
import { AxiosHeaders } from 'axios'
import { ConfigService } from '@nestjs/config'
import { EvmChain, NftscanEvm } from 'nftscan-api'
import { HttpService } from '@nestjs/axios'
import { Injectable, Logger } from '@nestjs/common'
import { arrayContains } from 'class-validator'
import { map } from 'rxjs'

export type EvmAsset = Asset & {
  chain: number
  total: number
  symbol: string
  ownsTotal: number
  description: string
  owner?: string
  ownerBase?: string
}

export type EvmTransaction = Transaction & {
  chain: number
}

export type EvmNotify = {
  id: string
  app_name: string
  chain: number
  notify_type: 'ADDRESS_ACTIVITY' | 'NFT_ACTIVITY'
  active: boolean
  notify_params: string[]
  notify_url: string
  create_time: number
}

@Injectable()
export class NftscanService {
  private logger = new Logger(NftscanService.name, { timestamp: true })
  private readonly httpLogger = new Logger(HttpService.name, {
    timestamp: true
  })

  readonly chains = {
    [EvmChain.ETH]: 1,
    [EvmChain.POLYGON]: 137
  };
  readonly [EvmChain.ETH]: NftscanEvm;
  readonly [EvmChain.POLYGON]: NftscanEvm
  readonly apiBaseUrl: string
  readonly apiKey: string

  constructor(
    private readonly config: ConfigService,
    private readonly http: HttpService
  ) {
    this.apiBaseUrl = this.config.get<string>('nftScan.apiBaseUrl')
    this.apiKey = this.config.get<string>('nftScan.apiKey')
    this.eth = new NftscanEvm({ apiKey: this.apiKey, chain: EvmChain.ETH })
    this.polygon = new NftscanEvm({
      apiKey: this.apiKey,
      chain: EvmChain.POLYGON
    })
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
            ownerBase: '',
            owner,
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
            ownerBase: '',
            owner,
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
        ownerBase: '',
        owner: asset.owner,
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
        ownerBase: '',
        owner: asset.owner,
        ...asset
      } as EvmAsset
    })
  }

  getEthAssetsInBatches(
    list: { contractAddress: string; tokenId: string }[]
  ): Promise<EvmAsset[]> {
    if (list.length === 0) return Promise.resolve([])
    const contractAddressList = [
      ...new Set(list.map((it) => it.contractAddress))
    ]
    return Promise.all([
      this.eth.asset.queryAssetsInBatches(
        list.map((it) => ({
          contract_address: it.contractAddress,
          token_id: it.tokenId
        }))
      ),
      this.eth.collection.queryCollectionsByFilters({
        contract_address_list: contractAddressList
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
          ownerBase: '',
          owner: item.owner,
          ...item
        })
      })
      return assetList
    })
  }

  getPolygonAssetsInBatches(
    list: { contractAddress: string; tokenId: string }[]
  ): Promise<EvmAsset[]> {
    if (list.length === 0) return Promise.resolve([])
    const contractAddressList = [
      ...new Set(list.map((it) => it.contractAddress))
    ]
    return Promise.all([
      this.polygon.asset.queryAssetsInBatches(
        list.map((it) => ({
          contract_address: it.contractAddress,
          token_id: it.tokenId
        }))
      ),
      this.polygon.collection.queryCollectionsByFilters({
        contract_address_list: contractAddressList
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
          ownerBase: '',
          owner: item.owner,
          ...item
        })
      })
      return assetList
    })
  }

  getEthAssetsFilters(
    list: { contractAddress: string }[]
  ): Promise<EvmAsset[]> {
    if (list.length === 0) return Promise.resolve([])
    const contractAddressList = list.map((it) => it.contractAddress)
    return Promise.all([
      this.eth.asset.queryAssetsByFilters({
        limit: 100,
        contract_address_list: contractAddressList
      }),
      this.eth.collection.queryCollectionsByFilters({
        contract_address_list: contractAddressList
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
          ownerBase: '',
          owner: item.owner,
          ...item
        })
      })
      return assetList
    })
  }

  getPolygonAssetsFilters(
    list: { contractAddress: string }[]
  ): Promise<EvmAsset[]> {
    if (list.length === 0) return Promise.resolve([])
    const contractAddressList = list.map((it) => it.contractAddress)
    return Promise.all([
      this.polygon.asset.queryAssetsByFilters({
        limit: 100,
        contract_address_list: contractAddressList
      }),
      this.polygon.collection.queryCollectionsByFilters({
        contract_address_list: contractAddressList
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
          ownerBase: '',
          owner: item.owner,
          ...item
        })
      })
      return assetList
    })
  }

  getEthTokenTransactions(
    token: string,
    tokenId: string
  ): Promise<EvmTransaction[]> {
    return this.eth.transaction
      .getTransactionsByContractAndTokenId(token, tokenId, { limit: 100 })
      .then((res) =>
        res
          ? [
              ...res.content.map((item) => ({
                ...item,
                chain: this.chains['eth']
              }))
            ]
          : []
      )
  }

  getPolygonTokenTransactions(
    token: string,
    tokenId: string
  ): Promise<EvmTransaction[]> {
    return this.polygon.transaction
      .getTransactionsByContractAndTokenId(token, tokenId, { limit: 100 })
      .then((res) =>
        res
          ? [
              ...res.content.map((item) => ({
                ...item,
                chain: this.chains['polygon']
              }))
            ]
          : []
      )
  }

  getNotifys(
    params: Partial<
      Pick<EvmNotify, 'app_name' | 'chain' | 'notify_type'> & {
        cursor: number
        limit: number
      }
    >
  ) {
    const headers = AxiosHeaders.from({ 'X-API-KEY': this.apiKey })
    this.http.post(this.apiBaseUrl, params, { headers }).pipe(
      map((res) => {
        const { data: responseData, code } = res.data
        if (code !== 200) {
          this.httpLogger.error(JSON.stringify(res.data))
          return {}
        }
        return responseData
      })
    )
  }
}
