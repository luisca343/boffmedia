import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { BaseDto } from '@api/_utils/dto/base.dto';

export class GetResourceDto extends BaseDto {
  @ApiProperty({ 
    description: 'Expansion filter (optional)',
    example: 'genetic-apex',
    required: false 
  })
  @IsOptional()
  @IsString()
  expansion?: string;
}