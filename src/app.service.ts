import { CACHE_MANAGER } from '@nestjs/cache-manager'
import { Cache } from 'cache-manager'
import { ConfigService } from '@nestjs/config'
import { EvmChain } from 'nftscan-api'
import { HttpService } from '@nestjs/axios'
import { Inject, Injectable, Logger } from '@nestjs/common'
import { SchedulerRegistry } from '@nestjs/schedule'
import { isDefined } from 'class-validator'
import { lastValueFrom } from 'rxjs'

import { AssetEntity } from '@/asset.entity'
import { AssetTransactionEntity } from '@/asset.transaction.entity'
import { EvmAsset, NftscanService } from '@/nftscan/nftscan.service'
import {
  GetNftsByOwnerDto,
  GetNftsByTokenDto,
  GetTransactionsDto,
  NotifyDto
} from '@/app.dto'
import { SubgraphService } from '@/subgraph/subgraph.service'

type CacheValue = {
  total: number
  totalPage: number
  items: AssetEntity[]
}
@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name, { timestamp: true })
  private readonly httpLogger = new Logger(HttpService.name, {
    timestamp: true
  })

  private notifyAddress: string[] = []

  constructor(
    private readonly nftScan: NftscanService,
    private readonly subgraph: SubgraphService,
    private readonly config: ConfigService,
    private readonly http: HttpService,
    private readonly scheduler: SchedulerRegistry,
    @Inject(CACHE_MANAGER) private cache: Cache
  ) {}

  async getAssetsByOwner(params: GetNftsByOwnerDto, url: string) {
    try {
      const {
        owner,
        chain,
        token,
        tokenId,
        onlySubgraph,
        isHardware,
        limit,
        page = 1
      } = params
      let items: EvmAsset[] = []

      let cached: CacheValue = {
        total: -1,
        totalPage: -1,
        items: []
      }
      try {
        cached = await this.getHardwareCacheByOwner(url)
      } catch (error) {
        this.logger.error(error)
        cached = undefined
      }

      if (isDefined(cached) && cached.total > -1) {
        this.logger.log(
          `Get assets by owner (hardware) from cache: ${cached.items.length}`,
          url
        )
        return cached
      }

      this.logger.log(`Get assets by owner (hardware) from api`, url)

      if (isDefined(chain)) {
        if (!this.nftScan.isSupportedChainId(chain)) {
          return { total: 0, totalPage: 0, items: [] }
        }
        switch (chain) {
          case this.nftScan.chains.eth:
            if (!onlySubgraph) {
              items = await this.nftScan.getEthAssetsByAccountAddress(owner)
            }
            const eths = await this.getEthAssetsByOwnerWithSubgraph(owner)
            items = items.concat(eths)
            break
          case this.nftScan.chains.polygon:
            if (!onlySubgraph) {
              items = await this.nftScan.getPolygonAssetsByAccountAddress(owner)
            }
            const polygons = await this.getPolygonAssetsByOwnerWithSubgraph(
              owner
            )
            items = items.concat(polygons)
            break
        }
      } else {
        if (!onlySubgraph) {
          items = await Promise.all([
            this.nftScan.getEthAssetsByAccountAddress(owner),
            this.nftScan.getPolygonAssetsByAccountAddress(owner)
          ]).then((items) => items.flat())
        }

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

      items
        .sort((a, b) => b.mint_timestamp - a.mint_timestamp)
        .sort((_, b) => (b.isSubgraph ? 1 : -1))

      const total = items.length

      if (total > 0) {
        const ethItems = items.filter((item) => item.chain === 1)
        const polygonItems = items.filter((item) => item.chain === 137)

        ethItems.forEach((item) => {
          if (item.isSubgraph) {
            if (!this.notifyAddress.includes(item.owner.toLowerCase())) {
              this.ownerNotify(item.owner, 1)
            }
          }
          if (!this.notifyAddress.includes(owner.toLowerCase())) {
            this.ownerNotify(owner, 1)
          }
        })

        polygonItems.forEach((item) => {
          if (item.isSubgraph) {
            if (!this.notifyAddress.includes(item.owner.toLowerCase())) {
              this.ownerNotify(item.owner, 137)
            }
          }
          if (!this.notifyAddress.includes(owner.toLowerCase())) {
            this.ownerNotify(owner, 137)
          }
        })
      }

      const cache = {} as CacheValue
      if (isDefined(limit)) {
        const skip = (page - 1) * limit
        const totalPage = Math.ceil(total / limit)
        cache.total = total
        cache.totalPage = totalPage
        cache.items = items
          .slice(skip, skip + limit)
          .map((item) => new AssetEntity(item))
        if (isHardware) {
          await this.setHardwareCacheByOwner(url, cache)
        }
        return cache
      } else {
        cache.total = total
        cache.totalPage = 1
        cache.items = items.map((item) => new AssetEntity(item))
        if (isHardware) {
          this.setHardwareCacheByOwner(url, cache)
        }
        return cache
      }
    } catch (error) {
      this.logger.error(error)
      return { total: 0, totalPage: 0, items: [] }
    }
  }

  async getAssetsByToken(params: GetNftsByTokenDto) {
    try {
      const { chain, token, tokenId, limit, page = 1 } = params
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

      items
        .sort((a, b) => b.mint_timestamp - a.mint_timestamp)
        .sort((_, b) => (b.isSubgraph ? 1 : -1))

      const total = items.length

      if (total > 0) {
        const ethItems = items.filter((item) => item.chain === 1)
        const polygonItems = items.filter((item) => item.chain === 137)

        ethItems.forEach((item) => {
          if (!this.notifyAddress.includes(item.owner.toLowerCase())) {
            this.ownerNotify(item.owner, 1)
          }
        })

        polygonItems.forEach((item) => {
          if (!this.notifyAddress.includes(item.owner.toLowerCase())) {
            this.ownerNotify(item.owner, 137)
          }
        })
      }

      if (isDefined(limit)) {
        const skip = (page - 1) * limit
        const totalPage = Math.ceil(total / limit)
        return {
          total,
          totalPage,
          items: items
            .slice(skip, skip + limit)
            .map((item) => new AssetEntity(item))
        }
      } else {
        return {
          total,
          totalPage: 1,
          items: items.map((item) => new AssetEntity(item))
        }
      }
    } catch (error) {
      this.logger.error(JSON.stringify(error))
      return { total: 0, totalPage: 0, items: [] }
    }
  }

  async getTransactions(params: GetTransactionsDto) {
    try {
      const { chain, token, tokenId } = params
      let items

      if (isDefined(chain)) {
        if (!this.nftScan.isSupportedChainId(chain)) {
          return []
        }
        switch (chain) {
          case this.nftScan.chains.eth:
            items = await this.nftScan.getEthTokenTransactions(token, tokenId)
            break
          case this.nftScan.chains.polygon:
            items = await this.nftScan.getPolygonTokenTransactions(
              token,
              tokenId
            )
            break
        }
      } else {
        items = await Promise.all([
          this.nftScan.getEthTokenTransactions(token, tokenId),
          this.nftScan.getPolygonTokenTransactions(token, tokenId)
        ]).then((items) => items.flat())
      }

      items.sort((a, b) => b.timestamp - a.timestamp)

      return items.map((item) => new AssetTransactionEntity(item))
    } catch (error) {
      this.logger.error(JSON.stringify(error))
      return []
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
            ownsTotal: assets[i].toCount,
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
            ownsTotal: assets[i].toCount,
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
    const batchQuerys = []
    for (let i = 0; i < batchQuery.length; i += 50) {
      batchQuerys.push(batchQuery.slice(i, i + 50))
    }
    const values = await Promise.all(
      batchQuerys.map((batch) => this.nftScan.getEthAssetsInBatches(batch))
    )
    return values
      ? values.flat().map((asset) => {
          const subgraphItem = assets.find(
            (it) => it.tokenId === asset.token_id
          )
          return {
            ...asset,
            isSubgraph: true,
            subgraphBlcokTimestamp: +subgraphItem.lastUpdateBlcokTimestamp,
            owner: subgraphItem.contractAddress,
            ownerBase: subgraphItem.to
          }
        })
      : []
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
    const batchQuerys = []
    for (let i = 0; i < batchQuery.length; i += 50) {
      batchQuerys.push(batchQuery.slice(i, i + 50))
    }
    const values = await Promise.all(
      batchQuerys.map((batch) => this.nftScan.getPolygonAssetsInBatches(batch))
    )
    return values
      ? values.flat().map((asset) => {
          const subgraphItem = assets.find(
            (it) => it.tokenId === asset.token_id
          )
          return {
            ...asset,
            isSubgraph: true,
            subgraphBlcokTimestamp: +subgraphItem.lastUpdateBlcokTimestamp,
            owner: subgraphItem.contractAddress,
            ownerBase: subgraphItem.to
          }
        })
      : []
  }

  async ownerNotify(owner: string, chain: number) {
    try {
      const type = 'ADDRESS_ACTIVITY'
      const allNotifiys = await this.nftScan.loadAllNotifys({
        chain,
        notify_type: type
      })
      const current = allNotifiys.find(
        (notify) => notify.notify_params.length < 10000
      )
      const isExist = isDefined(current)
        ? current.notify_params.includes(owner.toLowerCase())
        : false
      if (!isExist) {
        await this.nftScan.updateNotify({
          id: isDefined(current) ? current.id : undefined,
          chain,
          notify_type: type,
          notify_params: isDefined(current)
            ? [owner, ...current.notify_params]
            : [owner]
        })
      }
      this.notifyAddress = [
        ...new Set([
          owner.toLowerCase(),
          ...this.notifyAddress,
          ...current.notify_params
        ])
      ]
    } catch (error) {
      this.logger.error(error)
    }
  }

  async sendNotify(body: NotifyDto) {
    try {
      const { data, network: chain } = body
      const { send, receive } = data
      let devices: string[] = []
      const blockNumber = data.block_number.toString()
      this.logger.log('Notify', {
        chain,
        blockNumber,
        hash: data.hash,
        send,
        receive,
        token: data.contract_address,
        tokenId: data.contract_token_id
      })

      const isWaitting = this.scheduler.doesExist(
        'interval',
        `wait_for_${chain}_${data.hash}`
      )

      if (isWaitting) return

      await this.waitForBlockNumber(chain, blockNumber, data.hash)

      const [{ assets: sends }, { assets: receives }] = await Promise.all([
        this.subgraph.getOneAssetsByContractAddress(chain, send, blockNumber),
        this.subgraph.getOneAssetsByContractAddress(chain, receive, blockNumber)
      ])

      this.logger.log('Query Sends', sends)
      this.logger.log('Query Receives', receives)

      if (sends.length > 0) {
        if (sends[0].from !== '0x0000000000000000000000000000000000000000') {
          devices.push(sends[0].from)
        }
        if (sends[0].to !== '0x0000000000000000000000000000000000000000') {
          devices.push(sends[0].to)
        }
      }

      if (receives.length > 0) {
        if (receives[0].from !== '0x0000000000000000000000000000000000000000') {
          devices.push(receives[0].from)
        }
        if (receives[0].to !== '0x0000000000000000000000000000000000000000') {
          devices.push(receives[0].to)
        }
      }

      devices = [...new Set(devices)]

      this.logger.log('Clear Hardware Cache', devices)
      await this.clearHardwareCache(devices)

      this.logger.log(`Send Notify to ${devices.length} devices`, devices)
      this.sendNotifyToDevices(devices)
    } catch (error) {
      this.logger.error(error)
    }
  }

  async getHardwareCacheByOwner(url: string): Promise<CacheValue> {
    this.logger.log('Get Hardware Cache', url)
    return this.cache.get(`HARD:${url.toLowerCase()}`)
  }

  async setHardwareCacheByOwner(url: string, value: CacheValue) {
    this.logger.log('Set Hardware Cache', url)
    await this.cache.set(
      `HARD:${url.toLowerCase()}`,
      value,
      1000 * 60 * 60 * 24
    )
  }

  async clearHardwareCache(owners?: string[]) {
    try {
      const keys = await this.cache.store.keys()
      const filterKeys = keys
        .filter((key) => key.includes('HARD:'))
        .filter((key) => {
          if (isDefined(owners)) {
            return owners.some((owner) => key.includes(owner.toLowerCase()))
          }
          return false
        })
      this.logger.log('Clear Hardware Cache', filterKeys)
      await Promise.all(filterKeys.map((key) => this.cache.del(key)))
      return filterKeys
    } catch (error) {
      this.logger.error(error)
      return []
    }
  }

  async getHardwareCacheKeys() {
    try {
      const keys = await this.cache.store.keys()
      return keys.filter((key) => key.includes('HARD:'))
    } catch (error) {
      this.logger.error(error)
      return []
    }
  }

  async getCacheKeys() {
    try {
      return await this.cache.store.keys()
    } catch (error) {
      this.logger.error(error)
      return []
    }
  }

  sendNotifyToDevices(devices: string[]) {
    const notifyServerUrl = this.config.get<string>('app.notifyServerUrl')
    devices.forEach(async (addr) => {
      try {
        const uri = `${notifyServerUrl}/nft/sendNFTMessage?address=${addr}`
        this.logger.log(`Send Notify to device: ${addr}`, uri)
        const res = await lastValueFrom(this.http.post(uri))
        this.httpLogger.log(`${res.status} [POST] ${uri}`)
      } catch (error) {
        this.logger.error(error)
      }
    })
  }

  waitForBlockNumber(
    chain: NotifyDto['network'],
    blockNumber: string,
    txhash: string
  ) {
    const jobName = `wait_for_${chain}_${txhash}`
    return new Promise<void>((resolve) => {
      const interval = setInterval(async () => {
        try {
          const { _meta: meta } = await this.subgraph.getSubgraphMeta(chain)
          this.logger.log(
            `Wait for block number: ${blockNumber}`,
            `Current block number: ${meta.block.number}`
          )
          if (meta.block.number >= +blockNumber) {
            resolve()
            this.scheduler.deleteInterval(jobName)
          }
        } catch (error) {
          this.logger.error(error)
        }
      }, 1000 * 5)
      this.scheduler.addInterval(jobName, interval)
    })
  }
}
