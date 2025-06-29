import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { AccountType } from '../enums/account-type.enum';

export class CreateAccountDto {
  @ApiProperty({ description: 'UUID of the user' })
  @IsString()
  uuid: string;

  @ApiProperty({ description: 'Name of the account' })
  @IsString()
  name: string;

  @ApiProperty({ 
    description: 'Type of the account', 
    enum: AccountType,
    default: 'MAIN' 
  })
  @IsString()
  type: AccountType

  @ApiProperty({ 
    description: 'Initial balance of the account in PokéDollars', 
    default: 0 
  })
  initialBalance?: number = 0;
}