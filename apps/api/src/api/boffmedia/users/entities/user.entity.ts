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
    nullable: true,
  })
  uuid: string | null;

  @ApiProperty({
    example: 'https://example.com/avatar.jpg',
    description: 'Profile picture URL',
    nullable: true,
  })
  profilePicture: string | null;

  @ApiProperty({
    example: 'https://example.com/cover.jpg',
    description: 'Cover (banner) image URL',
    nullable: true,
  })
  coverImage: string | null;

  @ApiProperty({
    example: 'VGC player and Minecraft builder.',
    description: 'Short user biography',
    nullable: true,
  })
  bio: string | null;

  @ApiProperty({
    example: 'google_123456789',
    description: 'Google ID for OAuth',
    nullable: true,
  })
  googleId: string | null;

  @ApiProperty({
    example: 'discord_123456789',
    description: 'Discord ID for OAuth',
    nullable: true,
  })
  discordId: string | null;

  @ApiProperty({
    example: '2024-01-01T00:00:00.000Z',
    description: 'User creation timestamp',
    nullable: true,
  })
  createdAt: Date | null;

  @ApiProperty({
    example: '2024-01-01T00:00:00.000Z',
    description: 'User last update timestamp',
    nullable: true,
  })
  updatedAt: Date | null;
}
