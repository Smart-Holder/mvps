import { EvmChain } from 'nftscan-api'
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString
} from 'class-validator'
import { Transform } from 'class-transformer'

import { Transaction } from './utils'

export class PaginationDto {
  @IsOptional()
  @Transform(({ value }) => (value ? +value : 1))
  @IsPositive()
  page?: number

  @IsOptional()
  @Transform(({ value }) => (value ? +value : 10))
  @IsPositive()
  limit?: number
}
export class GetNftsByOwnerDto extends PaginationDto {
  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => value.toLowerCase())
  owner: string

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value.toLowerCase())
  token?: string

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value.toLowerCase())
  tokenId?: string

  @IsOptional()
  @Transform(({ value }) => +value)
  @IsPositive()
  chain?: number

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true
    if (value === 'false') return false
    return undefined
  })
  @IsBoolean()
  onlySubgraph?: boolean

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true
    if (value === 'false') return false
    return undefined
  })
  @IsBoolean()
  isHardware?: boolean
}

export class GetNftsByTokenDto extends PaginationDto {
  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => value.toLowerCase())
  token: string

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value.toLowerCase())
  tokenId?: string

  @IsOptional()
  @Transform(({ value }) => +value)
  @IsPositive()
  chain?: number
}

export class GetTransactionsDto {
  @IsNotEmpty()
  @IsString()
  token: string

  @IsNotEmpty()
  @IsString()
  tokenId: string

  @IsOptional()
  @Transform(({ value }) => +value)
  @IsPositive()
  chain?: number
}

export class NotifyDto {
  @IsNotEmpty()
  data: Transaction
  @IsNotEmpty()
  network: EvmChain.ETH | EvmChain.POLYGON
  @IsNotEmpty()
  type: 'ADDRESS_ACTIVITY' | 'NFT_ACTIVITY'
}
