import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class TransferFromMainDto {
  @ApiProperty({
    description: 'UUID of the user whose main account will be used',
    example: 'a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6'
  })
  @IsNotEmpty()
  @IsString()
  uuid: string;

  @ApiProperty({
    description: 'Account ID to transfer to',
    example: 123
  })
  @IsNotEmpty()
  @IsNumber()
  to: number;

  @ApiProperty({
    description: 'Amount to transfer',
    example: 1000
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiProperty({
    description: 'Concept/reason for the transfer',
    example: 'Payment for services'
  })
  @IsNotEmpty()
  @IsString()
  concept: string;
}