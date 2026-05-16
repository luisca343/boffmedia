import { ApiProperty } from '@nestjs/swagger';
import { AccountType } from '../enums/account-type.enum';

export class StarBankAccount {
  @ApiProperty({
    example: 1,
    description: 'Unique identifier for the account',
  })
  id: number;

  @ApiProperty({
    example: 'Main Account',
    description: 'Name of the account',
  })
  name: string;

  @ApiProperty({
    example: 1500,
    description: 'Current account balance in PokéDollars',
  })
  balance: number;

  @ApiProperty({
    example: AccountType.MAIN,
    description: 'Type of account',
    enum: AccountType,
  })
  type: AccountType;

  @ApiProperty({
    example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4',
    description: 'UUID of the account owner',
    required: false,
  })
  uuid?: string;

  @ApiProperty({
    example: '/images/accounts/default.png',
    description: 'Image route/path for the account',
    required: false,
  })
  image?: string;
}
