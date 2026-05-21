import { ApiProperty } from '@nestjs/swagger';

export class UserValidationResult {
  @ApiProperty({
    description: 'Whether the user exists',
    example: true,
  })
  exists: boolean;
}
