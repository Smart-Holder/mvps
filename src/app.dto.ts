import { IsNotEmpty, IsOptional, IsPositive, IsString } from 'class-validator'
import { Transform } from 'class-transformer'

export class PaginationDto {
  @IsOptional()
  @IsPositive()
  @Transform(({ value }) => (value ? +value : 1))
  page?: number

  @IsOptional()
  @IsPositive()
  @Transform(({ value }) => (value ? +value : 10))
  limit?: number
}
export class GetNftsDto extends PaginationDto {
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
  @IsPositive()
  @Transform(({ value }) => +value)
  chain?: number
}
