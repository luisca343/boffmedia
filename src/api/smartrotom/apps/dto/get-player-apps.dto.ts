import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class GetPlayerAppsDto {
  @ApiProperty({ 
    description: 'Player UUID',
    example: 'player-uuid-123'
  })
  @IsString()
  uuid: string;
}