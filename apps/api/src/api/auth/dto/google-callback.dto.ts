import { IsString, IsEmail, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GoogleCallbackDto {
  @ApiPropertyOptional()
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  picture?: string;

  // Google's stable user id (`sub`). Sent so login captures/syncs googleId onto
  // the account and new Google sign-ups work.
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  googleId?: string;
}
