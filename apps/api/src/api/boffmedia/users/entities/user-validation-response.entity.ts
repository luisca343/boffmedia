import { ApiProperty } from '@nestjs/swagger';

export class UserValidationResponseEntity {
  @ApiProperty({
    example: true,
    description: 'Whether a user matching the identifier exists',
  })
  exists: boolean;

  @ApiProperty({
    example: 'username',
    description: 'Identifier type used for lookup',
  })
  type: string;

  @ApiProperty({
    example: 'steve123',
    description: 'Identifier value that was looked up',
  })
  identifier: string;
}
