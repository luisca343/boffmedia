import { BaseDto } from '@api/_utils/dto/base.dto';
import { ApiProperty } from '@nestjs/swagger';
import { StarBankAccount } from '../entities/starbank-account.entity';

export class AccountResponseDto extends BaseDto {
  @ApiProperty({ 
    description: 'Operation result',
    example: true
  })
  success: boolean;

  @ApiProperty({ 
    description: 'Account data',
    type: StarBankAccount,
    required: false
  })
  account?: StarBankAccount;

  @ApiProperty({ 
    description: 'Account ID for newly created accounts',
    example: 123,
    required: false
  })
  accountId?: number;

  @ApiProperty({ 
    description: 'Response message',
    example: 'Account created successfully',
    required: false
  })
  message?: string;
}