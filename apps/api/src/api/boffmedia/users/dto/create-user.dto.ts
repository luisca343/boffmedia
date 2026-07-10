import { BaseDto } from '@api/_utils/dto/base.dto';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsOptional,
  IsUUID,
  Length,
  MinLength,
} from 'class-validator';

export class CreateUserDto extends BaseDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({
    description: 'Username for the user',
    example: 'johndoe',
  })
  @IsString()
  @Length(3, 32)
  username: string;

  @ApiProperty({
    description: 'User password',
    example: 'securePassword123',
  })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({
    description: 'User UUID',
    required: false,
    example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4',
  })
  @IsOptional()
  @IsString()
  @IsUUID()
  uuid?: string;

  @ApiProperty({
    description: 'Profile picture URL',
    required: false,
    example: 'https://example.com/avatar.jpg',
  })
  @IsOptional()
  @IsString()
  profilePicture?: string;

  @ApiProperty({
    description: 'Cover (banner) image URL',
    required: false,
    example: 'https://example.com/cover.jpg',
  })
  @IsOptional()
  @IsString()
  coverImage?: string;

  @ApiProperty({
    description: 'Short user biography',
    required: false,
    example: 'VGC player and Minecraft builder.',
  })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  bio?: string;

  @ApiProperty({
    description: 'Google ID for OAuth',
    required: false,
    example: 'google_123456789',
  })
  @IsOptional()
  @IsString()
  googleId?: string;

  @ApiProperty({
    description: 'Discord ID for OAuth',
    required: false,
    example: 'discord_123456789',
  })
  @IsOptional()
  @IsString()
  discordId?: string;

  @ApiProperty({
    description: 'Twitch ID for OAuth',
    required: false,
    example: 'twitch_141981764',
  })
  @IsOptional()
  @IsString()
  twitchId?: string;
}
