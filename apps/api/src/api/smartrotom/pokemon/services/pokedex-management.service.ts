import { Injectable, Inject } from '@nestjs/common';
import {
  PokedexRegistryData,
  PokedexStatistics,
  DetailedPokedexStatistics,
  BulkUpdateData,
  BulkUpdateResult,
} from '../repositories/pokemon.repository';
import { PokemonDataManagementService } from './pokemon-data-management.service';
import { POKEMON_REPOSITORY_TOKEN } from '@api/_utils/repositories/interfaces/repository.token';
import { IPokemonRepository } from '../repositories/interfaces/pokemon.repository.interface';

export interface RegistrationResult {
  success: boolean;
  message: string;
  isNew?: boolean;
  wasUpdated?: boolean;
}

@Injectable()
export class PokedexManagementService {
  private dexCache: { [key: string]: { date: Date; data: any[] } } = {};

  constructor(
    @Inject(POKEMON_REPOSITORY_TOKEN)
    private readonly pokemonRepository: IPokemonRepository,
    private readonly pokemonDataService: PokemonDataManagementService,
  ) {}

  async registerPokemon(
    uuid: string,
    pokemonId: number,
    form: string,
    palette: string,
    status: number,
  ): Promise<RegistrationResult> {
    try {
      const formId = form || 'base';
      const paletteId = palette || 'none';

      // Check if registry already exists
      const existingRegistry = await this.pokemonRepository.findPokedexRegistry(
        uuid,
        pokemonId,
        formId,
        paletteId,
      );

      if (!existingRegistry) {
        // Create new registry
        const caughtAt = status === 1 ? new Date() : undefined;
        const registryData: PokedexRegistryData = {
          uuid,
          pokemonId,
          formId,
          paletteId,
          seenAt: new Date(),
          caughtAt,
        };

        const result =
          await this.pokemonRepository.createPokedexRegistry(registryData);

        if (result.success) {
          // Clear cache for this user
          delete this.dexCache[uuid];
          return {
            success: true,
            message: 'Pokemon registered successfully',
            isNew: true,
          };
        } else {
          return {
            success: false,
            message: result.message || 'Failed to register pokemon',
          };
        }
      } else if (status === 1 && !existingRegistry.caughtAt) {
        // Update existing registry to caught
        const updateResult = await this.pokemonRepository.updatePokedexRegistry(
          uuid,
          pokemonId,
          formId,
          paletteId,
          { caughtAt: new Date() },
        );

        if (updateResult.success) {
          // Clear cache for this user
          delete this.dexCache[uuid];
          return {
            success: true,
            message: 'Pokemon status updated to caught',
            wasUpdated: true,
          };
        } else {
          return {
            success: false,
            message: updateResult.message || 'Failed to update pokemon status',
          };
        }
      } else {
        return {
          success: false,
          message: 'Pokemon already registered with this status',
        };
      }
    } catch (error: any) {
      console.error('Failed to register pokemon:', error);
      return {
        success: false,
        message: `Registration failed: ${error.message}`,
      };
    }
  }

  async bulkUpdateDex(
    uuid: string,
    data: BulkUpdateData,
  ): Promise<{ success: boolean; message: string; results: BulkUpdateResult }> {
    try {
      console.log('BULK UPDATING POKEDEX', uuid);
      console.log(
        `Registering ${data.SEEN.length} seen and ${data.CAUGHT.length} caught Pokemon`,
      );

      // Get existing registries to avoid duplicates
      const existingRegistries =
        await this.pokemonRepository.getAllUserPokedexRegistries(uuid);
      const existingByPokemonId = new Map();
      existingRegistries.forEach((registry) => {
        const key = `${registry.pokemonId}_${registry.formId}_${registry.paletteId}`;
        existingByPokemonId.set(key, registry);
      });

      // Prepare bulk insert values for SEEN pokemon
      const seenToInsert: PokedexRegistryData[] = [];
      const currentDate = new Date();

      // Process SEEN pokemon
      for (const pokemonId of data.SEEN) {
        const key = `${pokemonId}_base_none`;
        if (!existingByPokemonId.has(key)) {
          seenToInsert.push({
            uuid,
            pokemonId,
            formId: 'base',
            paletteId: 'none',
            seenAt: currentDate,
          });
        }
      }

      // Process CAUGHT pokemon
      const caughtToInsert: PokedexRegistryData[] = [];
      const caughtToUpdate: number[] = [];

      for (const pokemonId of data.CAUGHT) {
        const key = `${pokemonId}_base_none`;
        const existingRegistry = existingByPokemonId.get(key);

        if (!existingRegistry) {
          // New caught pokemon (also counts as seen)
          caughtToInsert.push({
            uuid,
            pokemonId,
            formId: 'base',
            paletteId: 'none',
            seenAt: currentDate,
            caughtAt: currentDate,
          });
        } else if (!existingRegistry.caughtAt) {
          // Existing seen pokemon, now caught
          caughtToUpdate.push(pokemonId);
        }
      }

      // Execute bulk operations
      const results: BulkUpdateResult = {
        inserted: { seen: 0, caught: 0 },
        updated: 0,
        total: data.SEEN.length + data.CAUGHT.length,
      };

      // Insert SEEN records
      if (seenToInsert.length > 0) {
        const seenResult =
          await this.pokemonRepository.bulkInsertPokedexRegistries(
            seenToInsert,
          );
        results.inserted.seen = seenResult.insertedCount;
      }

      // Insert CAUGHT records
      if (caughtToInsert.length > 0) {
        const caughtResult =
          await this.pokemonRepository.bulkInsertPokedexRegistries(
            caughtToInsert,
          );
        results.inserted.caught = caughtResult.insertedCount;
      }

      // Update records that were seen but now caught
      if (caughtToUpdate.length > 0) {
        const updateResult =
          await this.pokemonRepository.bulkUpdatePokedexRegistriesStatus(
            uuid,
            caughtToUpdate,
            'caught',
          );
        results.updated = updateResult.updatedCount;
      }

      // Clear cache for this user
      delete this.dexCache[uuid];

      console.log('POKEDEX UPDATE COMPLETED', results);
      return {
        success: true,
        message: 'Pokedex updated successfully',
        results,
      };
    } catch (error: any) {
      console.error('Failed to bulk update pokedex:', error);
      return {
        success: false,
        message: `Bulk update failed: ${error.message}`,
        results: {
          inserted: { seen: 0, caught: 0 },
          updated: 0,
          total: data.SEEN.length + data.CAUGHT.length,
        },
      };
    }
  }

  async getPokedexStatistics(uuid: string): Promise<PokedexStatistics> {
    try {
      const totalPokemonCount = this.pokemonDataService.countPokemon();
      return await this.pokemonRepository.getPokedexStatistics(
        uuid,
        totalPokemonCount,
      );
    } catch (error: any) {
      console.error(`Failed to get pokedex statistics for ${uuid}:`, error);
      throw new Error(`Pokedex statistics retrieval failed: ${error.message}`);
    }
  }

  async getDetailedPokedexStatus(
    uuid: string,
  ): Promise<DetailedPokedexStatistics> {
    try {
      const registries =
        await this.pokemonRepository.getAllUserPokedexRegistries(uuid);

      const seenPokemon = new Set<string>();
      const caughtPokemon = new Set<string>();
      const shinyPokemon = new Set<string>();

      registries.forEach((registry) => {
        const pokemon = this.pokemonDataService.getPokemonByDex(
          registry.pokemonId,
        );
        if (
          registry.formId === 'base' &&
          !pokemon?.forms.some((f) => f.name === '')
        ) {
          // Handle base form normalization
        }

        const pokemonFormId = `${registry.pokemonId}:${registry.formId}`;
        if (registry.seenAt) {
          seenPokemon.add(pokemonFormId);
        }
        if (registry.caughtAt) {
          caughtPokemon.add(pokemonFormId);
        }
        if (registry.paletteId === 'shiny' && registry.caughtAt) {
          shinyPokemon.add(pokemonFormId);
        }
      });

      const allPokemon = this.pokemonDataService.getAllPokemon();
      const totalPokemon = allPokemon.length;
      const totalForms = allPokemon.reduce(
        (total, pokemon) => total + pokemon.forms.length,
        0,
      );

      return {
        seenPokemon: Array.from(seenPokemon),
        caughtPokemon: Array.from(caughtPokemon),
        shinyPokemon: Array.from(shinyPokemon),
        totalPokemon,
        totalForms,
        seenCount: seenPokemon.size,
        caughtCount: caughtPokemon.size,
        shinyCount: shinyPokemon.size,
        missingSeenPokemon: totalPokemon - seenPokemon.size,
        missingCaughtPokemon: totalPokemon - caughtPokemon.size,
        missingSeenForms: totalForms - seenPokemon.size,
        missingCaughtForms: totalForms - caughtPokemon.size,
      };
    } catch (error: any) {
      console.error(
        `Failed to get detailed pokedex status for ${uuid}:`,
        error,
      );
      throw new Error(
        `Detailed pokedex status retrieval failed: ${error.message}`,
      );
    }
  }

  async getPokedexRegistries(uuid: string, limit: number = 20): Promise<any[]> {
    try {
      const registries = await this.pokemonRepository.getUserPokedexRegistries(
        uuid,
        limit,
      );

      // Enhance each registry with Pokemon data
      return registries.map((entry) => {
        const pokemon = this.pokemonDataService.getPokemonByDex(
          entry.pokemonId,
        );
        const pokemonName = pokemon?.name || 'Unknown';

        return {
          ...entry,
          pokemonName,
        };
      });
    } catch (error: any) {
      console.error(`Failed to get pokedex registries for ${uuid}:`, error);
      throw new Error(`Pokedex registries retrieval failed: ${error.message}`);
    }
  }

  // ==================== CACHE MANAGEMENT ====================

  async getRegistriesForImageStatus(uuid: string): Promise<any[]> {
    // Cache implementation for image status checking
    if (
      !this.dexCache[uuid] ||
      new Date().getTime() - this.dexCache[uuid].date.getTime() > 1000
    ) {
      const pokemonStatus =
        await this.pokemonRepository.getUserRegistriesForCache(uuid);
      this.dexCache[uuid] = { date: new Date(), data: pokemonStatus };
    }
    return this.dexCache[uuid].data;
  }

  clearUserCache(uuid: string): void {
    delete this.dexCache[uuid];
  }

  clearAllCache(): void {
    this.dexCache = {};
  }
}
