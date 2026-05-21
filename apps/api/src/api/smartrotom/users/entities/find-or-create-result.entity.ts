import { ApiProperty } from '@nestjs/swagger';
import { SmartRotomUser } from './user.entity';

export class FindOrCreateResult {
  @ApiProperty({
    description: 'The user data',
    type: SmartRotomUser,
  })
  user: SmartRotomUser;

  @ApiProperty({
    description: 'Whether this is a newly created user',
    example: true,
  })
  isNew: boolean;

  @ApiProperty({
    description: 'Status of the operation',
    example: 'created',
    enum: ['found', 'created'],
  })
  status: 'found' | 'created';
}
