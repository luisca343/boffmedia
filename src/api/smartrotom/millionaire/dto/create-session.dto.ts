import { BaseDto } from '@api/_utils/dto/base.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsOptional, IsString, IsInt } from 'class-validator';

export class CreateEventDto extends BaseDto {
  @ApiProperty({ 
    description: 'Conductor UUID',
    example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4'
  })
  @IsUUID()
  conductorUuid: string;

  @ApiProperty({ 
    description: 'Event title',
    example: 'Weekly Trivia Night',
    required: false
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ 
    description: 'Event description',
    example: 'Join us for an exciting millionaire game!',
    required: false
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ 
    description: 'Maximum participants',
    example: 10,
    required: false
  })
  @IsOptional()
  @IsInt()
  maxParticipants?: number;
}

// Maintain backwards compatibility alias
export class CreateSessionDto extends CreateEventDto {}
