import { ApiProperty } from '@nestjs/swagger';
import { SmartRotomUserEntity } from '@api/boffmedia/users/entities/full-user.entity';

export class AuthUserEntity {
  @ApiProperty({ example: 1, description: 'User ID' })
  id: number;

  @ApiProperty({ example: 'johndoe', description: 'Username' })
  username: string;

  @ApiProperty({
    example: 'user@example.com',
    description: 'User email address',
  })
  email: string;

  @ApiProperty({
    type: String,
    isArray: true,
    example: ['user'],
    description: 'Role names assigned to the user',
  })
  roles: string[];

  @ApiProperty({
    example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4',
    description: 'Linked Minecraft UUID',
    type: String,
    nullable: true,
  })
  mcUuid: string | null;

  @ApiProperty({
    description:
      'Linked SmartRotom user data. Empty object when no SmartRotom account is linked.',
    type: SmartRotomUserEntity,
    nullable: true,
  })
  smartRotomUser: SmartRotomUserEntity | Record<string, never> | null;
}

export class AuthLoginResponseEntity {
  @ApiProperty({ description: 'JWT access token' })
  access_token: string;

  @ApiProperty({ description: 'JWT refresh token' })
  refresh_token: string;

  @ApiProperty({ type: AuthUserEntity })
  user: AuthUserEntity;
}

export class AuthRefreshSmartRotomUserEntity {
  @ApiProperty({ example: 'johndoe', description: 'SmartRotom username' })
  username: string;

  @ApiProperty({
    example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4',
    description: 'SmartRotom user UUID',
  })
  uuid: string;

  @ApiProperty({ example: 'overworld', description: 'Current Minecraft world' })
  world: string;
}

export class AuthRefreshUserEntity {
  @ApiProperty({ example: 1, description: 'User ID' })
  id: number;

  @ApiProperty({ example: 'johndoe', description: 'Username' })
  name: string;

  @ApiProperty({
    example: 'user@example.com',
    description: 'User email address',
  })
  email: string;

  @ApiProperty({
    type: String,
    isArray: true,
    example: ['user'],
    description: 'Role names assigned to the user',
  })
  roles: string[];

  @ApiProperty({
    example: 'https://example.com/avatar.jpg',
    description: 'Profile picture URL',
    type: String,
    nullable: true,
  })
  image: string | null;

  @ApiProperty({
    description: 'Linked SmartRotom user data, if any',
    type: AuthRefreshSmartRotomUserEntity,
    nullable: true,
  })
  smartRotomUser: AuthRefreshSmartRotomUserEntity | null;
}

export class AuthRefreshResponseEntity {
  @ApiProperty({ description: 'JWT access token' })
  access_token: string;

  @ApiProperty({ description: 'JWT refresh token' })
  refresh_token: string;

  @ApiProperty({ type: AuthRefreshUserEntity })
  user: AuthRefreshUserEntity;
}

/**
 * What `/auth/login` (and the OAuth callbacks) answer with INSTEAD of a session
 * when the account holds an admin role. No tokens, because the sign-in is not
 * finished — the client takes `challenge_token` to `/auth/2fa/challenge/*`.
 */
export class AuthTwoFactorChallengeDetailEntity {
  @ApiProperty({ example: true })
  required: true;

  @ApiProperty({
    example: true,
    description:
      'false = the account has no second factor yet and must be walked through enrolment before it can sign in. Admin 2FA is mandatory, so this is a step, not an offer.',
  })
  enrolled: boolean;

  @ApiProperty({
    description:
      "Short-lived typ:'mfa' token. Authenticates the /auth/2fa/challenge/* routes and nothing else.",
  })
  challenge_token: string;
}

export class AuthTwoFactorChallengeEntity {
  @ApiProperty({ type: AuthTwoFactorChallengeDetailEntity })
  two_factor: AuthTwoFactorChallengeDetailEntity;
}
