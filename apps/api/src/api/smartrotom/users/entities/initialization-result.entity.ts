import { ApiProperty } from '@nestjs/swagger';
import { SmartRotomUser } from './user.entity';

export class InitializationResult {
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

  @ApiProperty({
    description: 'Whether this is a newly created user',
    example: true,
  })
  isNewUser: boolean;

  @ApiProperty({
    description: 'Whether new accounts were created',
    example: false,
  })
  isNewAccount: boolean;
}
