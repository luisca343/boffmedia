import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class BattlesimListQueryDto {
  @ApiProperty({
    description: 'Maximum number of items to return',
    example: 20,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 20;

  @ApiProperty({
    description: 'Cursor for pagination (encoded timestamp or id)',
    example: 'MjAyNi0wOS0wMlQxMDozMDowMFo=',
    required: false,
  })
  @IsOptional()
  @Type(() => String)
  cursor?: string;
}
