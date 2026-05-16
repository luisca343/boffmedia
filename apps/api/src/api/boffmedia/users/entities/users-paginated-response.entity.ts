import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BoffMediaUserEntity } from './user.entity';

export class UsersPaginatedResponseEntity {
  @ApiProperty({
    type: BoffMediaUserEntity,
    isArray: true,
    description: 'List of users',
  })
  users: BoffMediaUserEntity[];

  @ApiProperty({ example: 150, description: 'Total number of matching users' })
  total: number;

  @ApiPropertyOptional({ example: 10, description: 'Requested page size' })
  limit?: number;

  @ApiPropertyOptional({ example: 0, description: 'Requested page offset' })
  offset?: number;
}
