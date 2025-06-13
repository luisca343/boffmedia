import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber } from 'class-validator';
import { PlayerAppRequest, PlayerAppsRequest } from '../types/app.types';

export class PlayerAppDto implements PlayerAppRequest {
  @ApiProperty({ description: 'The UUID of the player' })
  @IsString()
  uuid: string;

  @ApiProperty({ description: 'The ID of the app' })
  @IsNumber()
  id: number;
}

export class PlayerAppsDto implements PlayerAppsRequest {
  @ApiProperty({ description: 'The UUID of the player' })
  @IsString()
  uuid: string;
}