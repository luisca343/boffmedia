import { TeleportRequestDto } from '../../dto/teleport-request.dto';
import { TaxiStop } from '../../entities/taxi-stop.entity';
import { PlayerPosition } from '../../entities/player-position.entity';
import { TeleportOutcome } from '../../entities/teleport-outcome.entity';

export interface IWingullTransportRepository {
  getTaxiStopsFromAPI(): Promise<TaxiStop[]>;
  getPlayerPositionFromAPI(uuid: string): Promise<PlayerPosition>;
  // Returns why it refused rather than throwing: the caller charges a fare on the answer.
  teleportPlayerInAPI(request: TeleportRequestDto): Promise<TeleportOutcome>;
}
