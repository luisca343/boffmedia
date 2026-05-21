import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class QueryChampionsDto {
  @ApiProperty({
    example: 'vgc2026regma',
    description: 'Champions regulation shorthand ID',
  })
  @IsString()
  @IsNotEmpty()
  regulationId: string;
}
