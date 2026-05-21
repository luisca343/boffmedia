import { ApiProperty } from '@nestjs/swagger';
import { BoffMediaUserEntity } from './user.entity';

export class UserWithRolesEntity extends BoffMediaUserEntity {
  @ApiProperty({
    example: ['admin', 'user'],
    description: 'User roles array',
    type: [String],
  })
  roles: string[];
}
