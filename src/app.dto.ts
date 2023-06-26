import { IsNotEmpty, IsOptional, IsPositive, IsString } from 'class-validator'

export class GetNftByOwnerPageDto {
  @IsNotEmpty()
  @IsString()
  owner: string

  @IsOptional()
  @IsPositive()
  chain?: number

  @IsOptional()
  @IsPositive()
  curPage?: number

  @IsOptional()
  @IsPositive()
  pageSize?: number
}
