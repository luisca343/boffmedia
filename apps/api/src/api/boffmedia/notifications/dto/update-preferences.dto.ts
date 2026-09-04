import { IsString, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePreferencesDto {
  @ApiProperty({
    description: 'Notification type (event, achievement, tournament, system, forum)',
  })
  @IsString()
  type: string;

  @ApiProperty({
    description: 'Whether this notification type should be muted',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isMuted?: boolean;
}
