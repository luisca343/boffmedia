import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDate,
  IsInt,
  IsOptional,
} from 'class-validator';

/** Set (or clear) the scheduled time of one or more matches at once. */
export class ScheduleMatchesDto {
  @ApiProperty({ type: [Number] })
  @IsArray()
  @ArrayMinSize(1)
  @Type(() => Number)
  @IsInt({ each: true })
  matchIds: number[];

  @ApiPropertyOptional({
    type: String,
    format: 'date-time',
    description: 'Omit/null to clear the schedule.',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  scheduledAt?: Date | null;
}
