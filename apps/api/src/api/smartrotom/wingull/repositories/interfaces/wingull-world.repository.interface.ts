import { Weather } from '../../entities/weather.entity';
import { Region } from '../../entities/region.entity';
import { Performance } from '../../entities/performance.entity';
import { SuccessResponse } from '@api/_utils/entities/common-response.entity';

export interface IWingullWorldRepository {
  getPerformanceFromAPI(): Promise<Performance>;
  getRegionsFromAPI(): Promise<Region[]>;
  getWeatherFromAPI(): Promise<Weather>;
  updateNPCsInAPI(data: any): Promise<SuccessResponse>;
}
