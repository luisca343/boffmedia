import { SuccessResponse } from '@api/_utils/entities/common-response.entity';
import { MessageRequestDto } from '../../dto/message-request.dto';
import { PokemonGiveRequestDto } from '../../dto/pokemon-give-request.dto';
import {
  PokemonTakeRequestDto,
  PokemonTakeResponse,
} from '../../dto/pokemon-take-request.dto';
import {
  ItemsTakeRequestDto,
  ItemsTakeResponse,
} from '../../dto/items-take-request.dto';
import { UpdateBattleTeamDto } from '../../dto/battle-team.dto';
import { PlayerStats } from '../../entities/player-stats.entity';
import { PokemonW } from '../../entities/pokemon-w.entity';

export interface IWingullPlayerRepository {
  getStatsFromAPI(uuid: string): Promise<PlayerStats>;
  getTeamFromAPI(uuid: string): Promise<PokemonW[]>;

  getPCFromAPI(uuid: string): Promise<any>;
  movePokemonInAPI(movePokemonDto: any): Promise<any>;
  updateDexInAPI(uuid: string): Promise<SuccessResponse>;
  getQuestsFromAPI(uuid: string): Promise<any>;
  sendMessageInAPI(request: MessageRequestDto): Promise<SuccessResponse>;
  globalchatInAPI(request: MessageRequestDto): Promise<SuccessResponse>;
  givePokemonInAPI(request: PokemonGiveRequestDto): Promise<SuccessResponse>;
  giveItemsInAPI(
    uuid: string,
    items: Array<{
      id: string;
      amount: number;
      display_name?: string;
      lore?: string[];
    }>,
  ): Promise<SuccessResponse>;

  // The take-side. These 404 until the Pixelmon plugin ships /takepokemon + /takeitems —
  // that is expected, and the only caller (WigglypopCustodyService) is gated behind
  // WIGGLYPOP_ATOMIC_CUSTODY, which stays false until they exist.
  takePokemonInAPI(
    request: PokemonTakeRequestDto,
  ): Promise<PokemonTakeResponse>;
  takeItemsInAPI(request: ItemsTakeRequestDto): Promise<ItemsTakeResponse>;
  getBattleTeamsFromAPI(uuid: string): Promise<any>;
  updateBattleTeamInAPI(
    updateBattleTeamDto: UpdateBattleTeamDto,
  ): Promise<SuccessResponse>;
}
