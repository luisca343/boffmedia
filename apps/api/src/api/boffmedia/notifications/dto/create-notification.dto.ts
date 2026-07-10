import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

/**
 * Admin-only. Creates a notification for one user, or — when `userId` is
 * omitted — broadcasts it to every user.
 */
export class CreateNotificationDto {
  @ApiPropertyOptional({
    description: 'Target user id. Omit to broadcast to all users.',
    example: 42,
  })
  @IsOptional()
  @IsInt()
  userId?: number;

  @ApiProperty({
    enum: ['event', 'achievement', 'tournament', 'forum', 'system'],
    example: 'system',
  })
  @IsEnum(['event', 'achievement', 'tournament', 'forum', 'system'])
  type: 'event' | 'achievement' | 'tournament' | 'forum' | 'system';

  @ApiProperty({ example: 'Mantenimiento programado' })
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional({ example: 'La plataforma estará en mantenimiento a las 22:00.' })
  @IsOptional()
  @IsString()
  body?: string;

  @ApiPropertyOptional({ example: '/eventos/12' })
  @IsOptional()
  @IsString()
  @MaxLength(512)
  link?: string;
}
