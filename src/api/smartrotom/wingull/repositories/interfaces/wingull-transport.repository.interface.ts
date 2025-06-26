import { SuccessResponse } from '@api/_utils/entities/common-response.entity';
import { TeleportRequestDto } from '../../dto/teleport-request.dto';
import { TaxiStop } from '../../entities/taxi-stop.entity';

export interface IWingullTransportRepository {
  getTaxiStopsFromAPI(): Promise<TaxiStop[]>;
  teleportPlayerInAPI(request: TeleportRequestDto): Promise<SuccessResponse>;
}
