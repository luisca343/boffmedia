import { ApiProperty } from '@nestjs/swagger';
import { SessionUserEntity } from './session-user.entity';

export class IntegrationsEntity {
  @ApiProperty({
    example: true,
    description: 'Whether user has SmartRotom integration',
  })
  hasSmartRotom: boolean;

  @ApiProperty({
    example: true,
    description: 'Whether user has Starbank integration',
  })
  hasStarbank: boolean;

  @ApiProperty({
    example: 2,
    description: 'Number of roles assigned to user',
  })
  rolesCount: number;
}

export class AuthenticationResultEntity {
  @ApiProperty({
    description: 'Session user data',
    type: SessionUserEntity,
  })
  sessionUser: SessionUserEntity;

  @ApiProperty({
    description: 'User integrations status',
    type: IntegrationsEntity,
  })
  integrations: IntegrationsEntity;
}
