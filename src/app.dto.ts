import { IsNotEmpty, IsOptional, IsPositive, IsString } from 'class-validator'
import { Transform } from 'class-transformer'

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
  owner: string

  @IsOptional()
  @IsString()
  token?: string

  @IsOptional()
  @IsString()
  tokenId?: string

  @IsOptional()
  @Transform(({ value }) => +value)
  @IsPositive()
  chain?: number
}

export class GetNftsByTokenDto extends PaginationDto {
  @IsNotEmpty()
  @IsString()
  token: string

  @IsOptional()
  @IsString()
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
}
