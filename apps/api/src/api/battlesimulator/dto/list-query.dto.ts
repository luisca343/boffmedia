import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class BattlesimListQueryDto {
  @ApiProperty({
    description: 'Maximum number of items to return',
    example: 20,
    minimum: 1,
    maximum: 100,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
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
