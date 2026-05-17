import { IsEnum } from 'class-validator';

export enum SeriesStatus {
  ONGOING = 'ongoing',
  COMPLETED = 'completed',
  HIATUS = 'hiatus',
}

export class UpdateSeriesStatusDto {
  @IsEnum(SeriesStatus)
  status: SeriesStatus;
}
