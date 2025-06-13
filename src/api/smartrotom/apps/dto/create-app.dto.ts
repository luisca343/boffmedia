import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber } from 'class-validator';
import { CreateAppRequest } from '../types/app.types';

export class CreateAppDto implements CreateAppRequest {
  @ApiProperty({ description: 'The name of the app' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'The URL of the app', required: false })
  @IsString()
  @IsOptional()
  url?: string;

  @ApiProperty({ description: 'The active status of the app', required: false })
  @IsNumber()
  @IsOptional()
  active?: number;
}