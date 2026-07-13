import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, Length } from 'class-validator';

/**
 * Fields a user (or an admin) may change through the generic update endpoint.
 *
 * Deliberately does NOT extend CreateUserDto: `password`, `googleId`,
 * `discordId`, `uuid` are intentionally excluded so an unrelated caller can't
 * take over an account by overwriting its OAuth identity or credentials through
 * `PATCH /users/:id`. Credential and provider-link changes have their own
 * authenticated, owner-checked endpoints.
 */
export class UpdateUserDto {
  @ApiPropertyOptional({
    description: 'Username for the user',
    example: 'johndoe',
  })
  @IsOptional()
  @IsString()
  @Length(3, 32)
  username?: string;

  @ApiPropertyOptional({
    description: 'User email address',
    example: 'user@example.com',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Profile picture URL' })
  @IsOptional()
  @IsString()
  @Length(0, 255)
  profilePicture?: string;

  @ApiPropertyOptional({ description: 'Cover (banner) image URL' })
  @IsOptional()
  @IsString()
  @Length(0, 255)
  coverImage?: string;

  @ApiPropertyOptional({ description: 'Short user biography' })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  bio?: string;
}
