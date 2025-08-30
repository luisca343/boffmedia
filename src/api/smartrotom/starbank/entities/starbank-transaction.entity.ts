import { ApiProperty } from '@nestjs/swagger';
import { TransactionType } from '../enums/transaction-type.enum';

export class StarBankTransaction {
  @ApiProperty({ 
    example: 1, 
    description: 'Source account ID (0 for system account)' 
  })
  from: number;

  @ApiProperty({ 
    example: 2, 
    description: 'Destination account ID (0 for system account)' 
  })
  to: number;

  @ApiProperty({ 
    example: true, 
    description: 'Indicates if the user is the payer' 
  })
  isPayer: boolean;

  @ApiProperty({ 
    example: 500, 
    description: 'Transaction amount in PokéDollars' 
  })
  amount: number;

  @ApiProperty({ 
    example: 'Payment for Poké Ball', 
    description: 'Reason or description for the transaction' 
  })
  reason: string;

  @ApiProperty({ 
    example: 1000, 
    description: 'Source account balance after transaction' 
  })
  fromBalance: number;

  @ApiProperty({ 
    example: 1500, 
    description: 'Destination account balance after transaction' 
  })
  toBalance: number;

  @ApiProperty({ 
    example: TransactionType.COMPRA, 
    description: 'Type of transaction',
    enum: TransactionType
  })
  type: TransactionType;

  @ApiProperty({ 
    example: '2025-06-29T10:30:00.000Z', 
    description: 'Transaction timestamp' 
  })
  date: string;

  @ApiProperty({ 
    example: 'Main Account', 
    description: 'Source account name',
    required: false
  })
  fromName?: string;

  @ApiProperty({ 
    example: 'Shop Account', 
    description: 'Destination account name',
    required: false
  })
  toName?: string;

  @ApiProperty({ 
    example: 'MAIN', 
    description: 'Source account type',
    required: false
  })
  fromType?: string;

  @ApiProperty({ 
    example: 'SECONDARY', 
    description: 'Destination account type',
    required: false
  })
  toType?: string;

  @ApiProperty({
    example: 'Teras',
    description: 'Display name for the transaction',
    required: false
  })
  displayName?: string;
  
  @ApiProperty({
    example: 'SECONDARY',
    description: 'Display type for the transaction',
    required: false
  })
  displayAccountType?: string;
}