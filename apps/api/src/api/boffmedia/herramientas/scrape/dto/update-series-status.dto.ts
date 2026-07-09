import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum SeriesStatus {
  ONGOING = 'ongoing',
  COMPLETED = 'completed',
  HIATUS = 'hiatus',
}

export class UpdateSeriesStatusDto {
  @ApiProperty({ enum: SeriesStatus })
  @IsEnum(SeriesStatus)
  status: SeriesStatus;
}
