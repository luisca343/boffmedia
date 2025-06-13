import { PartialType } from '@nestjs/mapped-types';
import { CreateAppDto } from './create-app.dto';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateAppDto extends PartialType(CreateAppDto) {
  @ApiProperty({ description: 'The name of the app', required: false })
  name?: string;

  @ApiProperty({ description: 'The description of the app', required: false })
  description?: string;

  @ApiProperty({ description: 'The URL of the app', required: false })
  url?: string;

  @ApiProperty({ description: 'The icon of the app', required: false })
  icon?: string;
}