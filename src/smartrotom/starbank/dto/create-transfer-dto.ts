import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

export class CreateTransferDto {
  @ApiProperty({ description: 'ID of the source account' })
  @IsNumber()
  from: number;

  @ApiProperty({ description: 'ID of the destination account' })
  @IsNumber()
  to: number;

  @ApiProperty({ description: 'Amount to transfer' })
  @IsNumber()
  amount: number;

  @ApiProperty({ description: 'Concept of the transfer' })
  @IsString()
  concept: string;
}