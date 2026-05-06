import { Injectable } from '@nestjs/common';
import { PokemonShowdownService } from './pokemon-showdown.service';
import { WingullFacadeService } from '../../wingull/wingull.facade.service';
import { PokedexManagementService } from './pokedex-management.service';

@Injectable()
export class PokemonIntegrationService {
  constructor(
    private readonly pokemonShowdownService: PokemonShowdownService,
    private readonly wingullFacadeService: WingullFacadeService,
    private readonly pokedexManagementService: PokedexManagementService,
  ) {}

  // ==================== SHOWDOWN INTEGRATION ====================

  async getTerasPokemonShowdownData(): Promise<any> {
    try {
      return await this.pokemonShowdownService.getTerasPokemonShowdownData();
    } catch (error: any) {
      console.error('Failed to get Teras Pokemon Showdown data:', error);
      throw new Error(`Showdown data retrieval failed: ${error.message}`);
    }
  }

  // ==================== WINGULL INTEGRATION ====================

  async updateWingullDex(uuid: string): Promise<any> {
    try {
      return await this.wingullFacadeService.updateDex(uuid);
    } catch (error: any) {
      console.error(`Failed to update Wingull dex for ${uuid}:`, error);
      throw new Error(`Wingull dex update failed: ${error.message}`);
    }
  }

  // ==================== BULK DEX UPDATE WITH WINGULL SYNC ====================

  async updateDexWithSync(uuid: string, data: { SEEN: number[], CAUGHT: number[] }): Promise<any> {
    try {
      // Update local pokedex
      const updateResult = await this.pokedexManagementService.bulkUpdateDex(uuid, data);

      // Sync with Wingull if successful
      if (updateResult.success) {
        try {
          await this.updateWingullDex(uuid);
        } catch (wingullError) {
          console.error(`Failed to sync with Wingull for ${uuid}:`, wingullError);
          // Don't fail the entire operation if Wingull sync fails
        }
      }

      return updateResult;
    } catch (error: any) {
      console.error(`Failed to update dex with sync for ${uuid}:`, error);
      throw new Error(`Dex update with sync failed: ${error.message}`);
    }
  }
}