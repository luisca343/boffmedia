import { BaseDto } from '@api/_utils/dto/base.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, Min, Length } from 'class-validator';

export class CreateTransferDto extends BaseDto {
  @ApiProperty({
    description: 'ID of the source account',
    example: 1,
    minimum: 1,
  })
  @IsNumber({}, { message: 'Source account ID must be a number' })
  @Min(1, { message: 'Source account ID must be at least 1' })
  from: number;

  @ApiProperty({
    description: 'ID of the destination account',
    example: 2,
    minimum: 1,
  })
  @IsNumber({}, { message: 'Destination account ID must be a number' })
  @Min(1, { message: 'Destination account ID must be at least 1' })
  to: number;

  @ApiProperty({
    description: 'Amount to transfer in PokéDollars',
    example: 500,
    minimum: 1,
  })
  @IsNumber({}, { message: 'Amount must be a number' })
  @Min(1, { message: 'Amount must be at least 1 PokéDollar' })
  amount: number;

  @ApiProperty({
    description: 'Reason or description for the transfer',
    example: 'Payment for services',
    minLength: 1,
    maxLength: 255,
  })
  @IsString()
  @Length(1, 255, { message: 'Concept must be between 1 and 255 characters' })
  concept: string;
}
