import { Injectable } from '@nestjs/common';
import { PokemonDataManagementService } from './services/pokemon-data-management.service';
import { PokedexManagementService, RegistrationResult } from './services/pokedex-management.service';
import { PokemonIntegrationService } from './services/pokemon-integration.service';
import { Pokemon, Attack } from './interfaces/pokemon.interface';
import { EvoTreeNode } from './services/data/pokemon-data.service';
import Fuse, { FuseResult } from 'fuse.js';
import { FullMove } from './entities/pokemon-move.entity';
import { SpawnInfo } from './entities/pokemon-spawn.entity';

@Injectable()
export class PokemonFacadeService {
  constructor(
    private readonly pokemonDataService: PokemonDataManagementService,
    private readonly pokedexService: PokedexManagementService,
    private readonly integrationService: PokemonIntegrationService,
  ) {}

  // ==================== INITIALIZATION ====================

  async initializeService(): Promise<void> {
    try {
      await this.pokemonDataService.initializeData();
    } catch (error) {
      console.error('Error initializing Pokemon service:', error);
      throw new Error(`Pokemon service initialization failed: ${error.message}`);
    }
  }

  // ==================== POKEMON DATA OPERATIONS ====================

  getAllPokemon(): Pokemon[] {
    try {
      return this.pokemonDataService.getAllPokemon();
    } catch (error) {
      console.error('Error getting all Pokemon:', error);
      throw new Error(`Failed to retrieve all Pokemon: ${error.message}`);
    }
  }

  getPokemonByDex(dex: number): Pokemon | undefined {
    try {
      return this.pokemonDataService.getPokemonByDex(dex);
    } catch (error) {
      console.error(`Error getting Pokemon by dex ${dex}:`, error);
      throw new Error(`Failed to retrieve Pokemon by dex: ${error.message}`);
    }
  }

  getPokemonByName(name: string): Pokemon | undefined {
    try {
      return this.pokemonDataService.getPokemonByName(name);
    } catch (error) {
      console.error(`Error getting Pokemon by name ${name}:`, error);
      throw new Error(`Failed to retrieve Pokemon by name: ${error.message}`);
    }
  }

  searchPokemonByName(name: string, amount: number = 16): FuseResult<Pokemon>[] {
    try {
      return this.pokemonDataService.searchPokemonByName(name, amount);
    } catch (error) {
      console.error(`Error searching Pokemon by name ${name}:`, error);
      throw new Error(`Failed to search Pokemon: ${error.message}`);
    }
  }

  getPokemonNames(): string[] {
    try {
      return this.pokemonDataService.getPokemonNames();
    } catch (error) {
      console.error('Error getting Pokemon names:', error);
      throw new Error(`Failed to retrieve Pokemon names: ${error.message}`);
    }
  }

  countPokemon(): number {
    try {
      return this.pokemonDataService.countPokemon();
    } catch (error) {
      console.error('Error counting Pokemon:', error);
      return 0;
    }
  }

  // ==================== EVOLUTION OPERATIONS ====================

  getEvoTree(id: number): { depth: number; tree: { [key: string]: EvoTreeNode } } {
    try {
      return this.pokemonDataService.getEvoTree(id);
    } catch (error) {
      console.error(`Error getting evolution tree for ${id}:`, error);
      throw new Error(`Failed to retrieve evolution tree: ${error.message}`);
    }
  }

  getNextPrev(id: number): { prev: Pokemon | undefined; next: Pokemon | undefined } {
    try {
      return this.pokemonDataService.getNextPrev(id);
    } catch (error) {
      console.error(`Error getting next/prev for ${id}:`, error);
      throw new Error(`Failed to retrieve next/prev Pokemon: ${error.message}`);
    }
  }

  // ==================== MOVE OPERATIONS ====================

  getAllMoves(): { name: string; count: number }[] {
    try {
      return this.pokemonDataService.getAllMoves();
    } catch (error) {
      console.error('Error getting all moves:', error);
      throw new Error(`Failed to retrieve all moves: ${error.message}`);
    }
  }

  getMove(name: string): FullMove | undefined {
    try {
      return this.pokemonDataService.getMove(name);
    } catch (error) {
      console.error(`Error getting move ${name}:`, error);
      throw new Error(`Failed to retrieve move: ${error.message}`);
    }
  }

  getPokemonMoves(id: number, formIndex: number): any {
    try {
      return this.pokemonDataService.getPokemonMoves(id, formIndex);
    } catch (error) {
      console.error(`Error getting moves for Pokemon ${id}, form ${formIndex}:`, error);
      throw new Error(`Failed to retrieve Pokemon moves: ${error.message}`);
    }
  }

  getPokemonByMove(name: string): { speciesID: number; form: string }[] | undefined {
    try {
      return this.pokemonDataService.getPokemonByMove(name);
    } catch (error) {
      console.error(`Error getting Pokemon by move ${name}:`, error);
      throw new Error(`Failed to retrieve Pokemon by move: ${error.message}`);
    }
  }

  // ==================== ABILITY OPERATIONS ====================

  getAllAbilities(): { name: string; count: number }[] {
    try {
      return this.pokemonDataService.getAllAbilities();
    } catch (error) {
      console.error('Error getting all abilities:', error);
      throw new Error(`Failed to retrieve all abilities: ${error.message}`);
    }
  }

  getAbility(name: string): any {
    try {
      return this.pokemonDataService.getAbility(name);
    } catch (error) {
      console.error(`Error getting ability ${name}:`, error);
      throw new Error(`Failed to retrieve ability: ${error.message}`);
    }
  }

  getPokemonByAbility(name: string): { speciesID: number; form: string; speciesName: string }[] {
    try {
      return this.pokemonDataService.getPokemonByAbility(name);
    } catch (error) {
      console.error(`Error getting Pokemon by ability ${name}:`, error);
      throw new Error(`Failed to retrieve Pokemon by ability: ${error.message}`);
    }
  }

  // ==================== SPAWN OPERATIONS ====================

  getSpawnByPokemon(name: string): SpawnInfo[] {
    try {
      return this.pokemonDataService.getSpawnByPokemon(name);
    } catch (error) {
      console.error(`Error getting spawns for Pokemon ${name}:`, error);
      throw new Error(`Failed to retrieve Pokemon spawns: ${error.message}`);
    }
  }

  getBiomes(): { name: string; count: number }[] {
      try {
          const biomesObject = this.pokemonDataService.getBiomes();
          return Object.entries(biomesObject).map(([name, count]) => ({
              name,
              count
          }));
      } catch (error) {
          console.error('Error getting biomes:', error);
          throw new Error(`Failed to retrieve biomes: ${error.message}`);
      }
  }

  getPokemonByBiome(name: string): { [key: string]: Array<{ dex: number; species: string; form: string; palette: string; rarity: number; percentage: number }> } {
    try {
      return this.pokemonDataService.getPokemonByBiome(name);
    } catch (error) {
      console.error(`Error getting Pokemon by biome ${name}:`, error);
      throw new Error(`Failed to retrieve Pokemon by biome: ${error.message}`);
    }
  }

  getBiomesByPokemon(name: string): string[] {
    try {
      return this.pokemonDataService.getBiomesByPokemon(name);
    } catch (error) {
      console.error(`Error getting biomes for Pokemon ${name}:`, error);
      throw new Error(`Failed to retrieve biomes for Pokemon: ${error.message}`);
    }
  }

  // ==================== IMAGE OPERATIONS ====================

  async getImage(params: {
    pokemonId?: number;
    formName: string;
    paletteName?: string;
    uuid: string;
    type?: string;
    hide?: number;
  }): Promise<any> {
    try {
      return await this.pokemonDataService.getImage(params);
    } catch (error) {
      console.error('Error getting Pokemon image:', error);
      throw new Error(`Failed to retrieve Pokemon image: ${error.message}`);
    }
  }

  getItemSprite(name: string): any {
    try {
      return this.pokemonDataService.getItemSprite(name);
    } catch (error) {
      console.error(`Error getting item sprite ${name}:`, error);
      throw new Error(`Failed to retrieve item sprite: ${error.message}`);
    }
  }

  // ==================== POKEDEX OPERATIONS ====================

  async registerPokemon(
    uuid: string,
    pokemonId: number,
    form: string,
    palette: string,
    status: number
  ): Promise<RegistrationResult> {
    try {
      return await this.pokedexService.registerPokemon(uuid, pokemonId, form, palette, status);
    } catch (error) {
      console.error('Error registering Pokemon:', error);
      throw new Error(`Failed to register Pokemon: ${error.message}`);
    }
  }

  async updateDex(uuid: string, data: { SEEN: number[], CAUGHT: number[] }): Promise<any> {
    try {
      return await this.integrationService.updateDexWithSync(uuid, data);
    } catch (error) {
      console.error('Error updating dex:', error);
      throw new Error(`Failed to update dex: ${error.message}`);
    }
  }

  async getPokedexStatistics(uuid: string): Promise<any> {
    try {
      return await this.pokedexService.getPokedexStatistics(uuid);
    } catch (error) {
      console.error(`Error getting pokedex statistics for ${uuid}:`, error);
      throw new Error(`Failed to retrieve pokedex statistics: ${error.message}`);
    }
  }

  async getDetailedPokedexStatus(uuid: string): Promise<any> {
    try {
      return await this.pokedexService.getDetailedPokedexStatus(uuid);
    } catch (error) {
      console.error(`Error getting detailed pokedex status for ${uuid}:`, error);
      throw new Error(`Failed to retrieve detailed pokedex status: ${error.message}`);
    }
  }

  async getPokedexRegistries(uuid: string): Promise<any[]> {
    try {
      return await this.pokedexService.getPokedexRegistries(uuid);
    } catch (error) {
      console.error(`Error getting pokedex registries for ${uuid}:`, error);
      throw new Error(`Failed to retrieve pokedex registries: ${error.message}`);
    }
  }

  // ==================== INTEGRATION OPERATIONS ====================

  async getTerasPokemonShowdownData(): Promise<any> {
    try {
      return await this.integrationService.getTerasPokemonShowdownData();
    } catch (error) {
      console.error('Error getting Teras Pokemon Showdown data:', error);
      throw new Error(`Failed to retrieve Showdown data: ${error.message}`);
    }
  }

  // ==================== WORDLE OPERATIONS ====================

  getWordleData(): any[] {
    try {
      return this.pokemonDataService.getWordleData();
    } catch (error) {
      console.error('Error getting Wordle data:', error);
      throw new Error(`Failed to retrieve Wordle data: ${error.message}`);
    }
  }

  // ==================== SPRITE MANIFEST OPERATIONS ====================

  getSpriteManifest(): any {
    try {
      return this.pokemonDataService.getSpriteManifest();
    } catch (error) {
      console.error('Error getting sprite manifest:', error);
      throw new Error(`Failed to retrieve sprite manifest: ${error.message}`);
    }
  }

  async refreshSpriteManifest(): Promise<void> {
    try {
      await this.pokemonDataService.refreshSpriteManifest();
    } catch (error) {
      console.error('Error refreshing sprite manifest:', error);
      throw new Error(`Failed to refresh sprite manifest: ${error.message}`);
    }
  }

  // ==================== PMD OPERATIONS ====================

  async getPmdPortrait(name: string): Promise<{ url: string }> {
    try {
      return await this.pokemonDataService.getPmdPortrait(name);
    } catch (error) {
      console.error(`Error getting PMD portrait for ${name}:`, error);
      throw new Error(`Failed to retrieve PMD portrait: ${error.message}`);
    }
  }
}