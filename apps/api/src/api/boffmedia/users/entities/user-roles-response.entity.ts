import { ApiProperty } from '@nestjs/swagger';

export class UserRolesResponseEntity {
  @ApiProperty({
    type: String,
    isArray: true,
    example: ['admin', 'moderator'],
    description: 'User role names',
  })
  roles: string[];
}
