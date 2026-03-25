import { BaseDto } from '@api/_utils/dto/base.dto';
import { ApiProperty } from '@nestjs/swagger';
import { StarBankTransaction } from '../entities/starbank-transaction.entity';

export class TransactionResponseDto extends BaseDto {
  @ApiProperty({ 
    description: 'Operation result',
    example: true
  })
  success: boolean;

  @ApiProperty({ 
    description: 'Transaction data',
    type: StarBankTransaction,
    required: false
  })
  transaction?: StarBankTransaction;

  @ApiProperty({ 
    description: 'Response message',
    example: 'Transaction completed successfully',
    required: false
  })
  message?: string;
}