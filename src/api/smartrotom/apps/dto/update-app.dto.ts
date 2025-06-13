import { PartialType } from '@nestjs/mapped-types';
import { CreateAppDto } from './create-app.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';
import { UpdateAppRequest } from '../types/app.types';

export class UpdateAppDto extends PartialType(CreateAppDto) implements UpdateAppRequest {
  @ApiProperty({ description: 'The name of the app', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ description: 'The description of the app', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'The URL of the app', required: false })
  @IsString()
  @IsOptional()
  url?: string;

  @ApiProperty({ description: 'The icon of the app', required: false })
  @IsString()
  @IsOptional()
  icon?: string;
}