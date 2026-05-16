import { BaseDto } from '@api/_utils/dto/base.dto';
import { ApiProperty } from '@nestjs/swagger';
import { StarBankAccount } from '../entities/starbank-account.entity';

export class AccountsListResponseDto extends BaseDto {
  @ApiProperty({
    description: 'List of accounts',
    type: [StarBankAccount],
  })
  accounts: StarBankAccount[];

  @ApiProperty({
    description: 'Total number of accounts',
    example: 5,
  })
  total: number;
}
