import { IsUUID, IsNumber, IsOptional } from 'class-validator';

export class GetBalanceDto {
  @IsUUID()
  uuid: string;

  @IsNumber()
  @IsOptional()
  amount?: number;
}
