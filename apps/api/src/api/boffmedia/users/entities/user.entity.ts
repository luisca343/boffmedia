import { ApiProperty } from '@nestjs/swagger';

export class BoffMediaUserEntity {
  @ApiProperty({
    example: 1,
    description: 'Unique identifier for the user',
  })
  id: number;

  @ApiProperty({
    example: 'user@example.com',
    description: 'User email address',
  })
  email: string;

  @ApiProperty({
    example: 'johndoe',
    description: 'Username',
  })
  username: string;

  @ApiProperty({
    example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4',
    description: 'User UUID',
    type: String,
    nullable: true,
  })
  uuid: string | null;

  @ApiProperty({
    example: 'https://example.com/avatar.jpg',
    description: 'Profile picture URL',
    type: String,
    nullable: true,
  })
  profilePicture: string | null;

  @ApiProperty({
    example: 'https://example.com/cover.jpg',
    description: 'Cover (banner) image URL',
    type: String,
    nullable: true,
  })
  coverImage: string | null;

  @ApiProperty({
    example: 'VGC player and Minecraft builder.',
    description: 'Short user biography',
    type: String,
    nullable: true,
  })
  bio: string | null;

  @ApiProperty({
    example: 'google_123456789',
    description: 'Google ID for OAuth',
    type: String,
    nullable: true,
  })
  googleId: string | null;

  @ApiProperty({
    example: 'discord_123456789',
    description: 'Discord ID for OAuth',
    type: String,
    nullable: true,
  })
  discordId: string | null;

  @ApiProperty({
    example: true,
    description: 'Whether the user has verified their email address',
  })
  emailVerified: boolean;

  @ApiProperty({
    example: '2024-01-01T00:00:00.000Z',
    description: 'User creation timestamp',
    type: Date,
    nullable: true,
  })
  createdAt: Date | null;

  @ApiProperty({
    example: '2024-01-01T00:00:00.000Z',
    description: 'User last update timestamp',
    type: Date,
    nullable: true,
  })
  updatedAt: Date | null;
}
