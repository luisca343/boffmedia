import { ApiProperty } from '@nestjs/swagger';
import { RotomUser } from './user.entity';

export class UserWithAccounts {
  @ApiProperty({
    description: 'The user data',
    type: RotomUser,
  })
  user: RotomUser;

  @ApiProperty({
    description: 'User accounts data',
    type: 'array',
    items: { type: 'object' },
  })
  accounts: any[];
}
