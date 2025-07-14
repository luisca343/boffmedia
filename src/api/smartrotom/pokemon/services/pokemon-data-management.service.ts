import { Injectable } from '@nestjs/common';
import { PokemonDataService } from './data/pokemon-data.service';
import { MoveDataService } from './data/move-data.service';
import { SpawnDataService } from './data/spawn-data.service';
import { PokemonImageService } from './data/pokemon-image.service';
import { SpriteManifestService } from './sprite-manifest.service';
import { Pokemon, PokemonForm, Attack } from '../interfaces/pokemon.interface';
import { EvoTreeNode } from './data/pokemon-data.service';
import Fuse, { IFuseOptions, FuseResult } from 'fuse.js';
import { FullMove } from '../entities/pokemon-move.entity';
import { SpawnInfo } from '../entities/pokemon-spawn.entity';

@Injectable()
export class PokemonDataManagementService {
  private fusePokemon: Fuse<Pokemon>;

  constructor(
    private readonly pokemonDataService: PokemonDataService,
    private readonly moveDataService: MoveDataService,
    private readonly spawnDataService: SpawnDataService,
    private readonly pokemonImageService: PokemonImageService,
    private readonly spriteManifestService: SpriteManifestService,
  ) {}

  async initializeData(): Promise<void> {
    try {
      await this.pokemonDataService.loadPokemonData();
      await this.moveDataService.loadMoveData();
      await this.spawnDataService.loadSpawnData();
      await this.spriteManifestService.loadSpriteManifest();
      this.initializeFuse();
    } catch (error) {
      console.error('Failed to initialize Pokemon data:', error);
      throw new Error(`Data initialization failed: ${error.message}`);
    }
  }

  private initializeFuse(): void {
    const options: IFuseOptions<Pokemon> = {
      keys: ['name', 'dex'],
      threshold: 0.3,
    };
    this.fusePokemon = new Fuse(this.pokemonDataService.getAllSpecies(), options);
  }

  // ==================== POKEMON OPERATIONS ====================

  getAllPokemon(): Pokemon[] {
    return this.pokemonDataService.getAllSpecies();
  }

  getPokemonByDex(dex: number): Pokemon | undefined {
    return this.pokemonDataService.getSpeciesByDex(dex);
  }

  getPokemonByName(name: string): Pokemon | undefined {
    return this.pokemonDataService.getSpeciesByName(name);
  }

  searchPokemonByName(name: string, amount: number = 16): FuseResult<Pokemon>[] {
    if (!this.fusePokemon) {
      this.initializeFuse();
    }
    return this.fusePokemon.search(name, { limit: amount });
  }

  getPokemonNames(): string[] {
    return this.pokemonDataService.getAllSpecies().map(species => species.name);
  }

  countPokemon(): number {
    return this.pokemonDataService.getAllSpecies().length;
  }

  getCustomSpecies(): Pokemon[] {
    return this.pokemonDataService.getCustomSpecies();
  }

  // ==================== EVOLUTION OPERATIONS ====================

  getEvoTree(id: number): { depth: number; tree: { [key: string]: EvoTreeNode } } {
    return this.pokemonDataService.getEvoTree(id);
  }

  getNextPrev(id: number): { prev: Pokemon | undefined; next: Pokemon | undefined } {
    const allSpecies = this.pokemonDataService.getAllSpecies();
    const currIndex = allSpecies.findIndex((species) => species.dex === id);

    if (currIndex === -1) {
      return { prev: undefined, next: undefined };
    }

    const prev = currIndex > 0 ? allSpecies[currIndex - 1] : allSpecies[allSpecies.length - 1];
    const next = currIndex < allSpecies.length - 1 ? allSpecies[currIndex + 1] : allSpecies[0];

    return { prev, next };
  }

  // ==================== MOVE OPERATIONS ====================

  getAllMoves(): { name: string; count: number }[] {
    return this.pokemonDataService.getAllMovesSortedByCount();
  }

  getMove(name: string): FullMove | undefined {
    return this.moveDataService.getMove(name);
  }

  getPokemonMoves(id: number, formIndex: number): any {
      const pokemon = this.pokemonDataService.getSpeciesByDex(id);
      if (!pokemon) return null;

      const form = pokemon.forms[formIndex] || pokemon.forms[0];
      const moves = form.moves || {};

      const moveDataSet = {};

      Object.entries(moves).forEach(([key, moveList]) => {
          moveList.forEach((move: any) => {
              if (typeof move === 'object' && move.attacks) {
                  move.attacks.forEach((attack: string) => {
                      this.addMoveToDataSet(attack, moveDataSet);
                  });
              } else if (typeof move === 'string') {
                  this.addMoveToDataSet(move, moveDataSet);
              }
          });
      });

      return moveDataSet;
  }

  private addMoveToDataSet(moveName: string, moveDataSet: any): void {
    const moveData = this.moveDataService.getMove(moveName);
    if (!moveData) {
      moveDataSet[moveName] = {
        name: moveName,
        type: 'Unknown',
        category: 'Unknown',
        power: 0,
        pp: '0 - 0',
        accuracy: 0
      };
      return;
    }

    if (!moveDataSet[moveName]) {
      moveDataSet[moveName] = {
        name: moveData.attackName,
        type: moveData.attackType,
        category: moveData.attackCategory,
        power: moveData.basePower,
        pp: `${moveData.ppBase} - ${moveData.ppMax}`,
        accuracy: moveData.accuracy
      };
    }
  }

  getPokemonByMove(name: string): { speciesID: number; form: string }[] | undefined {
    return this.pokemonDataService.sortByDex(this.pokemonDataService.getSpeciesByMove(name), 'speciesID');
  }

  // ==================== ABILITY OPERATIONS ====================

  getAllAbilities(): { name: string; count: number }[] {
    const abilityCounts: { [key: string]: number } = {};

    for (const ability in this.pokemonDataService.getAllSpeciesByAbility()) {
      if (this.pokemonDataService.getAllSpeciesByAbility().hasOwnProperty(ability)) {
        abilityCounts[ability] = this.pokemonDataService.getSpeciesByAbility(ability)?.length || 0;
      }
    }

    return Object.entries(abilityCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }

  getAbility(name: string): any {
    const forms = this.pokemonDataService.getSpeciesByAbility(name) || [];

    // Count unique Pokemon species with this ability
    const uniqueSpeciesWithAbility = new Set();
    forms.forEach(form => {
      const pokemon = this.pokemonDataService.getAllSpecies().find(
        species => species.forms.includes(form)
      );
      if (pokemon) {
        uniqueSpeciesWithAbility.add(pokemon.dex);
      }
    });

    return {
      name,
      count: forms.length,
      uniqueSpecies: uniqueSpeciesWithAbility.size,
    };
  }

  getPokemonByAbility(name: string): { speciesID: number; form: string; speciesName: string }[] {
    const forms = this.pokemonDataService.getSpeciesByAbility(name) || [];
    const result = [];

    forms.forEach(form => {
      const pokemon = this.pokemonDataService.getAllSpecies().find(
        species => species.forms.includes(form)
      );
      
      if (pokemon) {
        result.push({
          speciesID: pokemon.dex,
          form: form.name || 'base',
          speciesName: pokemon.name,
        });
      }
    });

    return this.pokemonDataService.sortByDex(result, 'speciesID');
  }

  // ==================== SPAWN OPERATIONS ====================

  getSpawnByPokemon(name: string): SpawnInfo[] {
    return this.spawnDataService.getSpawnByPokemon(name);
  }

  getBiomes(): { [key: string]: number } {
    return this.spawnDataService.getAllBiomes();
  }

  getPokemonByBiome(name: string): { [key: string]: Array<{ dex: number; species: string; form: string; palette: string; rarity: number; percentage: number }> } {
    return this.spawnDataService.getPokemonByBiome(name);
  }

  getBiomesByPokemon(name: string): string[] {
    return this.spawnDataService.getBiomesByPokemon(name);
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
    return await this.pokemonImageService.getImage(params);
  }

  getItemSprite(name: string): any {
    return this.pokemonImageService.getItemSprite(name);
  }

  getSimpleSprite(pokemonId: number, formName: string = 'base', paletteName: string = 'none'): string {
    return this.pokemonImageService.getSimpleSprite(pokemonId, formName, paletteName);
  }

  // ==================== WORDLE DATA ====================

  getWordleData(): any[] {
    return this.pokemonDataService.getWordleData();
  }

  // ==================== SPRITE MANIFEST ====================

  getSpriteManifest(): any {
    return this.spriteManifestService.getManifest();
  }

  async refreshSpriteManifest(): Promise<void> {
    await this.spriteManifestService.refreshManifest();
  }

  // ==================== PMD OPERATIONS ====================

  async getPmdPortrait(name: string): Promise<{ url: string }> {
    try {
      // Search for the Pokemon by name using the search method
      const searchResults = this.searchPokemonByName(name, 1);
      console.log('Searching for PMD portrait for:', name);
      console.log('Search results:', searchResults);
      
      if (searchResults.length === 0) {
        console.log('Pokemon not found:', name);
        return { url: '/smartrotom/img/pmd/portrait/0000/Normal.png' };
      }
      
      const pokemon = searchResults[0].item;
      console.log('Found Pokemon:', pokemon.name, 'Dex:', pokemon.dex);
      
      // Format dex number with leading zeros (4 digits)
      const dex = pokemon.dex.toString().padStart(4, '0');
      
      // Construct the PMD sprite URL
      const spriteUrl = `/smartrotom/img/pmd/portrait/${dex}/Normal.png`;
      
      console.log('PMD sprite URL:', spriteUrl);
      return { url: spriteUrl };
      
    } catch (error) {
      console.error('Error in getPmdPortrait:', error);
      return { url: '/smartrotom/img/pmd/portrait/0000/Normal.png' };
    }
  }
}