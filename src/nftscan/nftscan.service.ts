import { Asset, Transaction } from 'nftscan-api/dist/src/types/evm'
import { AxiosHeaders } from 'axios'
import { ConfigService } from '@nestjs/config'
import { EvmChain, NftscanEvm } from 'nftscan-api'
import { HttpService } from '@nestjs/axios'
import { Injectable, Logger } from '@nestjs/common'
import { arrayContains } from 'class-validator'
import { lastValueFrom, map } from 'rxjs'

export type EvmAsset = Asset & {
  chain: number
  total: number
  symbol: string
  ownsTotal: number
  description: string
  owner?: string
  ownerBase?: string
  isSubgraph?: boolean
  subgraphBlcokTimestamp?: number
  index: number
}

export type EvmTransaction = Transaction & {
  chain: number
}

export type { Transaction }

export type Notify = {
  id: string
  app_name: string
  chain: number
  notify_type: 'ADDRESS_ACTIVITY' | 'NFT_ACTIVITY'
  active: boolean
  notify_params: string[]
  notify_url: string
  create_time: number
}

export type NotifysResponse = {
  code: number
  data: {
    next: string
    total: number
    content: Notify[]
  }
  msg: string | null
}

export type UpdateNotifyResponse = {
  code: number
  data: {
    reason: string
    status: string
  }
  msg: string | null
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
          ...item.assets.map((asset, index) => ({
            index,
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
          ...item.assets.map((asset, index) => ({
            index,
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
    list: { index: number; contractAddress: string; tokenId: string }[]
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
          index: list.findIndex(
            (it) =>
              it.contractAddress === item.contract_address &&
              it.tokenId === item.token_id
          ),
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
      assetList.sort((a, b) => a.index - b.index)
      return assetList
    })
  }

  getPolygonAssetsInBatches(
    list: { index: number; contractAddress: string; tokenId: string }[]
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
          index: list.findIndex(
            (it) =>
              it.contractAddress === item.contract_address &&
              it.tokenId === item.token_id
          ),
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
      assetList.sort((a, b) => a.index - b.index)
      return assetList
    })
  }

  getEthAssetsFilters(
    list: { index: number; contractAddress: string }[]
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
          index: list.findIndex(
            (it) => it.contractAddress === item.contract_address
          ),
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
      assetList.sort((a, b) => a.index - b.index)
      return assetList
    })
  }

  getPolygonAssetsFilters(
    list: { index: number; contractAddress: string }[]
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
          index: list.findIndex(
            (it) => it.contractAddress === item.contract_address
          ),
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
      assetList.sort((a, b) => a.index - b.index)
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
      Pick<Notify, 'notify_type'> & {
        chain: string
        cursor: string
        limit: number
      }
    >
  ) {
    const appName = this.config.get<string>('app.name')
    const headers = AxiosHeaders.from({ 'X-API-KEY': this.apiKey })
    const data = { ...params, active: true, app_name: appName }
    const uri = `${this.apiBaseUrl}/v2/notify/filters`
    const req = this.http
      .post<NotifysResponse>(uri, data, {
        headers
      })
      .pipe(
        map((res) => {
          this.httpLogger.log(`${res.status} [POST] ${uri}`, data)
          const { data: responseData, code } = res.data
          if (code !== 200) {
            this.httpLogger.error(responseData)
          }
          return responseData
        })
      )
    return lastValueFrom(req)
  }

  loadAllNotifys(
    params: Partial<Pick<Notify, 'chain' | 'notify_type'>>,
    limit = 50
  ) {
    const chain = Object.entries(this.chains).find(
      (v) => v[1] === params.chain
    )?.[0]
    delete params.chain
    const fetch = async (cursor?: string) => {
      const items: Notify[] = []
      const { total, next, content } = await this.getNotifys({
        ...params,
        chain,
        limit,
        cursor
      })
      if (total > 0) {
        if (next) {
          const itr = await fetch(next)
          items.push(...content, ...itr)
        } else {
          items.push(...content)
        }
      }
      return items
    }
    return fetch()
  }

  updateNotify(
    params: Pick<Notify, 'chain' | 'notify_params' | 'notify_type'> &
      Partial<Pick<Notify, 'id'>>
  ) {
    const appName = this.config.get<string>('app.name')
    const notifyUrl = this.config.get<string>('nftScan.notifyUrl')
    const headers = AxiosHeaders.from({ 'X-API-KEY': this.apiKey })
    const chain = Object.entries(this.chains).find(
      (v) => v[1] === params.chain
    )?.[0]
    delete params.chain
    const data = {
      ...params,
      active: true,
      app_name: appName,
      notify_url: notifyUrl,
      chain
    }
    const isCreate = !data.id
    const uri = `${this.apiBaseUrl}/v2/notify/${isCreate ? 'create' : 'update'}`
    const req = this.http
      .post<UpdateNotifyResponse>(uri, data, { headers })
      .pipe(
        map((res) => {
          const owner = params.notify_params[0]
          this.logger.log(
            `${isCreate ? 'Create' : 'update'} [${
              params.notify_type
            }] Chain: ${chain.toUpperCase()} Notify: ${
              isCreate ? owner : data.id
            }`
          )
          this.httpLogger.log(`${res.status} [POST] ${uri}`, data)
          const { code } = res.data
          if (code !== 200) {
            this.httpLogger.error(res.data)
            return false
          }
          return true
        })
      )
    return lastValueFrom(req)
  }
}
