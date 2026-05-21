import { BaseDto } from '@api/_utils/dto/base.dto';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsString,
  Min,
  Length,
  IsUUID,
} from 'class-validator';

export class TransferFromMainDto extends BaseDto {
  @ApiProperty({
    description: 'UUID of the user whose main account will be used as source',
    example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4',
  })
  @IsNotEmpty({ message: 'UUID is required' })
  @IsString()
  @IsUUID(4, { message: 'UUID must be a valid v4 UUID' })
  uuid: string;

  @ApiProperty({
    description: 'Account ID to transfer funds to',
    example: 123,
    minimum: 1,
  })
  @IsNotEmpty({ message: 'Destination account ID is required' })
  @IsNumber({}, { message: 'Destination account ID must be a number' })
  @Min(0, { message: 'Destination account ID must be at least 0' })
  to: number;

  @ApiProperty({
    description: 'Amount to transfer in PokéDollars',
    example: 1000,
    minimum: 1,
  })
  @IsNotEmpty({ message: 'Amount is required' })
  @IsNumber({}, { message: 'Amount must be a number' })
  @Min(1, { message: 'Amount must be at least 1 PokéDollar' })
  amount: number;

  @ApiProperty({
    description: 'Reason or description for the transfer',
    example: 'Payment for premium services',
    minLength: 1,
    maxLength: 255,
  })
  @IsNotEmpty({ message: 'Concept is required' })
  @IsString()
  @Length(1, 255, { message: 'Concept must be between 1 and 255 characters' })
  concept: string;
}
