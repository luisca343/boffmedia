import { TcgSeries } from '@/_db/schema/TCG';
import { TcgSeriesDto } from '../../dto/tcg-series.dto';

export interface ITcgRepository {
  insertSeries(series: TcgSeriesDto[]): Promise<void>;
  findAll(): Promise<TcgSeries[]>;
}
