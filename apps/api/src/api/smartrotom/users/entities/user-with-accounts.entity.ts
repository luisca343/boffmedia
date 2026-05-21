import { ApiProperty } from '@nestjs/swagger';
import { SmartRotomUser } from './user.entity';

export class UserWithAccounts {
  @ApiProperty({
    description: 'The user data',
    type: SmartRotomUser,
  })
  user: SmartRotomUser;

  @ApiProperty({
    description: 'User accounts data',
    type: 'array',
    items: { type: 'object' },
  })
  accounts: any[];
}
