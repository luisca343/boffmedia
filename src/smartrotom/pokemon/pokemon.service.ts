import { Inject, Injectable } from '@nestjs/common';
import { EvoTreeNode, PokemonDataService } from './pokemon-data.service';
import { MoveDataService } from './move-data.service';
import { SpawnDataService } from './spawn-data.service';
import { Pokemon, SpawnInfo } from './interfaces/pokemon.interface';
import Fuse, { FuseResult, IFuseOptions } from 'fuse.js';
import { desc, eq } from 'drizzle-orm';
import { pokedexRegistry } from '@/_db/schema/SmartRotomPokedex';
import { DRIZZLE } from '@/drizzle/drizzle.module';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { PokemonImageService } from './pokemon-image.service';

@Injectable()
export class PokemonService {
  private fusePokemon: Fuse<Pokemon>;
  
  constructor(
    private readonly pokemonDataService: PokemonDataService,
    private readonly moveDataService: MoveDataService,
    private readonly spawnDataService: SpawnDataService,
    private readonly pokemonImageService: PokemonImageService,
    @Inject(DRIZZLE) private db: MySql2Database<Record<string, never>>
  ) {}
  
  private initializeFuse() {
    const options: IFuseOptions<Pokemon> = {
      keys: ['name', 'dex'],
      threshold: 0.3,
    };
    this.fusePokemon = new Fuse(this.pokemonDataService.getAllSpecies(), options);
  }
  
  async loadData() {
    await this.pokemonDataService.loadPokemonData();
    await this.moveDataService.loadMoveData();
    await this.spawnDataService.loadSpawnData();
    this.initializeFuse();
  }
  
  getAllPokemon(): Pokemon[] {
    return this.pokemonDataService.getAllSpecies();
  }
  
  getPokemonByDex(dex: number): Pokemon | undefined {
    return this.pokemonDataService.getSpeciesByDex(dex);
  }
  
  getAllMoves(): { name: string; count: number }[] {
    return this.pokemonDataService.getAllMovesSortedByCount();
  }
  
  getMoves(id: number, formIndex: number) {
    const pokemon = this.pokemonDataService.getSpeciesByDex(id);
    if (!pokemon) return null;
    
    const form = pokemon.forms[formIndex] || pokemon.forms[0];
    const moves = form.moves || {};
    
    const moveDataSet = {};
    
    Object.entries(moves).forEach(([key, moveList]) => {
      if (key === 'levelUpMoves') {
        moveList.forEach((levelUpMove: any) => {
          levelUpMove.attacks.forEach((attack: string) => {
            this.addMoveToDataSet(attack, moveDataSet);
          });
        });
      } else {
        moveList.forEach((move: string) => {
          this.addMoveToDataSet(move, moveDataSet);
        });
      }
    });
    
    return moveDataSet;
  }
  
  getPokemonNames(): string[] {
    return this.pokemonDataService.getAllSpecies().map(species => species.name);
  }
  
  getSpawnByPokemon(name: string): SpawnInfo[] {
    return this.spawnDataService.getSpawnByPokemon(name);
  }

  getMove(name: string) {
    return this.moveDataService.getMove(name);
  }

  getWordleData(): { name: string; form: string; type1: string; type2: string; gen: number; weight: number; height: number }[] {
    return this.pokemonDataService.getWordleData();
  }
  
  getPokemonByMove(name: string): { speciesID: number; form: string }[] | undefined {
    return this.pokemonDataService.sortByDex(this.pokemonDataService.getSpeciesByMove(name), 'speciesID');
  }
  
  getBiomes(): { [key: string]: number } {
    return this.spawnDataService.getAllBiomes();
  }
  
  getPokemonByBiome(name: string): { [key: string]: Array<{ dex: number; species: string; form: string; palette: string; rarity: number; percentage: number }> } {
    return this.spawnDataService.getPokemonByBiome(name);
  }
  
  async getRegistries(uuid: string){
    const dex = await this.db
    .select({pokemonId: pokedexRegistry.pokemonId, formId: pokedexRegistry.formId, paletteId: pokedexRegistry.paletteId, seenAt: pokedexRegistry.seenAt, caughtAt: pokedexRegistry.caughtAt})
    .from(pokedexRegistry)
    .where(eq(pokedexRegistry.uuid, uuid))
    .orderBy(desc(pokedexRegistry.id))
    .limit(20)
    .execute()
    return dex
  }

  
  async getPokedex(uuid: string) {
    const dex = await this.db
      .selectDistinct({
        pokemonId: pokedexRegistry.pokemonId,
        seenAt: pokedexRegistry.seenAt,
        caughtAt: pokedexRegistry.caughtAt,
        paletteId: pokedexRegistry.paletteId,
      })
      .from(pokedexRegistry)
      .where(eq(pokedexRegistry.uuid, uuid))
      .execute()

    const seenUniquePokemonIds = new Set(dex.filter((p) => p.seenAt !== null).map((p) => p.pokemonId))
    const caughtUniquePokemonIds = new Set(dex.filter((p) => p.caughtAt !== null).map((p) => p.pokemonId))

    const seenPokemon = seenUniquePokemonIds.size
    const caughtPokemon = caughtUniquePokemonIds.size

    const shinyPokemon = dex.filter((p) => p.paletteId === "shiny" && p.caughtAt !== null).length
    const totalPokemon = this.pokemonDataService.getAllSpecies().length
    const missingPokemon = totalPokemon - seenPokemon
    const missingCaughtPokemon = totalPokemon - caughtPokemon

    return {
      seenPokemon,
      caughtPokemon,
      totalPokemon,
      missingPokemon,
      missingCaughtPokemon,
      shinyPokemon,
    }
  }
  
  getNextPrev(id: number): { prev: Pokemon | undefined; next: Pokemon | undefined } {
    const allSpecies = this.pokemonDataService.getAllSpecies()
    const currIndex = allSpecies.findIndex((species) => species.dex === id)

    if (currIndex === -1) {
      return { prev: undefined, next: undefined }
    }

    const prev = currIndex > 0 ? allSpecies[currIndex - 1] : allSpecies[allSpecies.length - 1]
    const next = currIndex < allSpecies.length - 1 ? allSpecies[currIndex + 1] : allSpecies[0]

    return { prev, next }
  }
  
  getEvoTree(id: number): { depth: number; tree: { [key: string]: EvoTreeNode } } {
    return this.pokemonDataService.getEvoTree(id);
  }
  
  getItemSprite(name: string) {
    return this.pokemonImageService.getItemSprite(name);
  }
  
  async getImage({pokemonId = 1, formName = "base", paletteName = 'none', uuid, type = 'img', hide }) {
    return this.pokemonImageService.getImage({ pokemonId, formName, paletteName, uuid, type, hide });
  }

  async getDetailedPokedexStatus(uuid: string) {
    const registries = await this.db
      .select({
        pokemonId: pokedexRegistry.pokemonId,
        formId: pokedexRegistry.formId,
        paletteId: pokedexRegistry.paletteId,
        seenAt: pokedexRegistry.seenAt,
        caughtAt: pokedexRegistry.caughtAt,
      })
      .from(pokedexRegistry)
      .where(eq(pokedexRegistry.uuid, uuid))
      .execute()

    const seenPokemon = new Set<string>()
    const caughtPokemon = new Set<string>()
    const shinyPokemon = new Set<string>()

    registries.forEach((registry) => {
      const pokemonFormId = `${registry.pokemonId}:${registry.formId}`
      if (registry.seenAt) {
        seenPokemon.add(pokemonFormId)
      }
      if (registry.caughtAt) {
        caughtPokemon.add(pokemonFormId)
      }
      if (registry.paletteId === "shiny" && registry.caughtAt) {
        shinyPokemon.add(pokemonFormId)
      }
    })

    const allPokemon = this.pokemonDataService.getAllSpecies()
    const totalPokemon = allPokemon.length
    const totalForms = allPokemon.reduce((total, pokemon) => total + pokemon.forms.length, 0)

    const detailedStatus = {
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
    }

    return detailedStatus
  }

  // Used in Chat
  countPokemon(): number {
    return this.pokemonDataService.getAllSpecies().length;
  }
  
  getPokemonByName(name: string): Pokemon | undefined {
    return this.pokemonDataService.getSpeciesByName(name);
  }
  
  searchPokemonByName(name: string, amount = 16): FuseResult<Pokemon>[] {
    return this.fusePokemon.search(name, { limit: amount });
  }
  
  getBiomesByPokemon(name: string): string[] {
    return this.spawnDataService.getBiomesByPokemon(name);
  }
  
  
  private addMoveToDataSet(moveName: string, moveDataSet: any) {
    const moveData = this.moveDataService.getMove(moveName);
    if (!moveData) {
      console.log(`Move ${moveName} not found`);
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
}

