import { IsInt, IsPositive } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class QueryLimitlessDto {
  @ApiProperty({ example: 1, description: 'Internal tournament ID' })
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  tournamentId: number;
}
