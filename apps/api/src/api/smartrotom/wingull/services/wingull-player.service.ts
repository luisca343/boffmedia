import { HttpException, Inject, Injectable } from '@nestjs/common';
import { MessageRequestDto } from '../dto/message-request.dto';
import { PokemonGiveRequestDto } from '../dto/pokemon-give-request.dto';
import { PokemonTakeResponse } from '../dto/pokemon-take-request.dto';
import { ItemsTakeResponse, TakeItemDto } from '../dto/items-take-request.dto';
import { UpdateBattleTeamDto } from '../dto/battle-team.dto';
import { WINGULL_USER_REPOSITORY_TOKEN } from '@api/_utils/repositories/interfaces/repository.token';
import { IWingullPlayerRepository } from '../repositories/interfaces/wingull-player.repository.interface';
import { PlayerStats } from '../entities/player-stats.entity';
import { PokemonW } from '../entities/pokemon-w-.entity';
import { Logger } from 'nestjs-pino';

@Injectable()
export class WingullPlayerService {
  constructor(
    private readonly logger: Logger,

    @Inject(WINGULL_USER_REPOSITORY_TOKEN)
    private readonly wingullPlayerRepository: IWingullPlayerRepository,
  ) {}

  async getStats(uuid: string): Promise<PlayerStats> {
    try {
      return await this.wingullPlayerRepository.getStatsFromAPI(uuid);
    } catch (error: any) {
      this.logger.error(`Failed to get stats for ${uuid}:`, error);
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Stats retrieval failed: ${error.message}`);
    }
  }

  async getTeam(uuid: string): Promise<PokemonW[]> {
    try {
      return await this.wingullPlayerRepository.getTeamFromAPI(uuid);
    } catch (error: any) {
      this.logger.error(`Failed to get team for ${uuid}:`, error);
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Team retrieval failed: ${error.message}`);
    }
  }

  async getPC(uuid: string): Promise<any> {
    try {
      return await this.wingullPlayerRepository.getPCFromAPI(uuid);
    } catch (error: any) {
      this.logger.error(`Failed to get PC for ${uuid}:`, error);
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`PC retrieval failed: ${error.message}`);
    }
  }

  async movePokemon(movePokemonDto: any): Promise<any> {
    try {
      return await this.wingullPlayerRepository.movePokemonInAPI(
        movePokemonDto,
      );
    } catch (error: any) {
      this.logger.error(`Failed to move Pokémon:`, error);
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Pokémon move failed: ${error.message}`);
    }
  }

  async updateDex(uuid: string): Promise<any> {
    try {
      return await this.wingullPlayerRepository.updateDexInAPI(uuid);
    } catch (error: any) {
      this.logger.error(`Failed to update dex for ${uuid}:`, error);
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Dex update failed: ${error.message}`);
    }
  }

  async getQuests(uuid: string): Promise<any> {
    try {
      return await this.wingullPlayerRepository.getQuestsFromAPI(uuid);
    } catch (error: any) {
      this.logger.error(`Failed to get quests for ${uuid}:`, error);
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Quests retrieval failed: ${error.message}`);
    }
  }

  async sendMessage(uuid: string, message: string): Promise<any> {
    try {
      const request: MessageRequestDto = { uuid, message };
      return await this.wingullPlayerRepository.sendMessageInAPI(request);
    } catch (error: any) {
      this.logger.error(`Failed to send message to ${uuid}:`, error);
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Message sending failed: ${error.message}`);
    }
  }

  async globalchat(uuid: string, message: string): Promise<any> {
    try {
      const request: MessageRequestDto = { uuid, message };
      return await this.wingullPlayerRepository.globalchatInAPI(request);
    } catch (error: any) {
      this.logger.error(
        `Failed to send global chat message for ${uuid}:`,
        error,
      );
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Global chat message sending failed: ${error.message}`);
    }
  }

  async givePokemon(
    uuid: string,
    pokespec: string,
    sendMessage: boolean = true,
  ): Promise<any> {
    try {
      const request: PokemonGiveRequestDto = { uuid, pokespec, sendMessage };
      return await this.wingullPlayerRepository.givePokemonInAPI(request);
    } catch (error: any) {
      this.logger.error(`Failed to give Pokémon to ${uuid}:`, error);
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Pokémon giving failed: ${error.message}`);
    }
  }

  async giveItems(
    uuid: string,
    items: Array<{
      id: string;
      amount: number;
      display_name?: string;
      lore?: string[];
    }>,
  ): Promise<any> {
    try {
      return await this.wingullPlayerRepository.giveItemsInAPI(uuid, items);
    } catch (error: any) {
      this.logger.error(`Failed to give items to ${uuid}:`, error);
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Items giving failed: ${error.message}`);
    }
  }

  /**
   * Removes a Pokémon from a player's PC and hands back its pokespec. `expectedKey` is the
   * content hash the slot must still match — the plugin refuses the take otherwise, which is
   * what makes "sell the mon you listed" unraceable. Throws until the plugin ships the route.
   */
  async takePokemon(
    uuid: string,
    box: number,
    index: number,
    expectedKey: string,
  ): Promise<PokemonTakeResponse> {
    try {
      return await this.wingullPlayerRepository.takePokemonInAPI({
        uuid,
        box,
        index,
        expectedKey,
      });
    } catch (error: any) {
      this.logger.error(`Failed to take Pokémon from ${uuid}:`, error);
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Pokémon taking failed: ${error.message}`);
    }
  }

  /**
   * Removes items from a player. Returns what was ACTUALLY removed, which may be less than
   * asked for — settle against `taken`, never against the request.
   */
  async takeItems(
    uuid: string,
    items: TakeItemDto[],
  ): Promise<ItemsTakeResponse> {
    try {
      return await this.wingullPlayerRepository.takeItemsInAPI({ uuid, items });
    } catch (error: any) {
      this.logger.error(`Failed to take items from ${uuid}:`, error);
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Items taking failed: ${error.message}`);
    }
  }

  async getBattleTeams(uuid: string): Promise<any> {
    try {
      return await this.wingullPlayerRepository.getBattleTeamsFromAPI(uuid);
    } catch (error: any) {
      this.logger.error(`Failed to get battle teams for ${uuid}:`, error);
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Battle teams retrieval failed: ${error.message}`);
    }
  }

  async updateBattleTeam(
    updateBattleTeamDto: UpdateBattleTeamDto,
  ): Promise<any> {
    try {
      return await this.wingullPlayerRepository.updateBattleTeamInAPI(
        updateBattleTeamDto,
      );
    } catch (error: any) {
      this.logger.error('Failed to update battle team:', error);
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Battle team update failed: ${error.message}`);
    }
  }
}
