import { ApiProperty } from '@nestjs/swagger';
import { RotomUser } from './user.entity';

export class UserCreationResult {
  @ApiProperty({
    description: 'The user data',
    type: RotomUser,
  })
  user: RotomUser;

  @ApiProperty({
    description: 'Whether this is a newly created user',
    example: true,
  })
  isNew: boolean;
}
