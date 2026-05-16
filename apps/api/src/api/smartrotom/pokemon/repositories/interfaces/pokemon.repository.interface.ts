import {
  PokedexRegistryData,
  PokedexRegistryResult,
  PokedexStatistics,
  BulkUpdateData,
  BulkUpdateResult,
} from '../pokemon.repository';

export interface IPokemonRepository {
  // ==================== POKEDEX REGISTRY OPERATIONS ====================
  createPokedexRegistry(
    data: PokedexRegistryData,
  ): Promise<{ success: boolean; message?: string }>;
  findPokedexRegistry(
    uuid: string,
    pokemonId: number,
    formId: string,
    paletteId: string,
  ): Promise<PokedexRegistryResult | null>;
  updatePokedexRegistry(
    uuid: string,
    pokemonId: number,
    formId: string,
    paletteId: string,
    updateData: Partial<PokedexRegistryData>,
  ): Promise<{ success: boolean; message?: string }>;
  getUserPokedexRegistries(
    uuid: string,
    limit?: number,
  ): Promise<PokedexRegistryResult[]>;
  getAllUserPokedexRegistries(uuid: string): Promise<PokedexRegistryResult[]>;

  // ==================== BULK OPERATIONS ====================
  bulkInsertPokedexRegistries(
    registries: PokedexRegistryData[],
  ): Promise<{ success: boolean; insertedCount: number }>;
  bulkUpdatePokedexRegistriesStatus(
    uuid: string,
    pokemonIds: number[],
    status: 'seen' | 'caught',
  ): Promise<{ success: boolean; updatedCount: number }>;

  // ==================== STATISTICS ====================
  getPokedexStatistics(
    uuid: string,
    totalPokemonCount: number,
  ): Promise<PokedexStatistics>;

  // ==================== CACHE SUPPORT ====================
  getUserRegistriesForCache(uuid: string): Promise<PokedexRegistryResult[]>;

  // ==================== UTILITY METHODS ====================
  checkRegistryExists(
    uuid: string,
    pokemonId: number,
    formId: string,
    paletteId: string,
  ): Promise<boolean>;
  getRegistryCount(uuid: string): Promise<number>;
}
