
import { SuccessResponse } from '@api/_utils/entities/common-response.entity';
import { MessageRequestDto } from '../../dto/message-request.dto';
import { PokemonGiveRequestDto } from '../../dto/pokemon-give-request.dto';
import { PlayerStats } from '../../entities/player-stats.entity';
import { Pokemon } from '../../entities/pokemon.entity';

export interface IWingullPlayerRepository {
  getStatsFromAPI(uuid: string): Promise<PlayerStats>;
  getTeamFromAPI(uuid: string): Promise<Pokemon[]>;
  updateDexInAPI(uuid: string): Promise<SuccessResponse>;
  getQuestsFromAPI(uuid: string): Promise<any>;
  sendMessageInAPI(request: MessageRequestDto): Promise<SuccessResponse>;
  givePokemonInAPI(request: PokemonGiveRequestDto): Promise<SuccessResponse>;
  giveItemsInAPI(uuid: string, items: Array<{ id: string, amount: number, display_name?: string, lore?: string[] }>): Promise<SuccessResponse>;
}
