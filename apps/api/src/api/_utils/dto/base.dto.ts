import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, IsOptional } from 'class-validator';

export class BaseDto {
  @ApiProperty({
    description: 'Server UUID (automatically added by middleware)',
    example: '1ee7e5f6-8e50-4b49-9ee6-b26cc1b5f365',
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsUUID()
  server?: string;
}
