import { IsUUID, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GetBalanceDto {
  @ApiProperty()
  @IsUUID()
  uuid: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  amount?: number;
}
