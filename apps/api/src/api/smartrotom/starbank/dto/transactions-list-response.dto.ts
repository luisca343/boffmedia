import { BaseDto } from '@api/_utils/dto/base.dto';
import { ApiProperty } from '@nestjs/swagger';
import { StarBankTransaction } from '../entities/starbank-transaction.entity';

export class TransactionsListResponseDto extends BaseDto {
  @ApiProperty({
    description: 'List of transactions',
    type: [StarBankTransaction],
  })
  transactions: StarBankTransaction[];

  @ApiProperty({
    description: 'Total number of transactions',
    example: 25,
  })
  total: number;

  @ApiProperty({
    description: 'Number of transactions returned',
    example: 10,
  })
  limit: number;
}
