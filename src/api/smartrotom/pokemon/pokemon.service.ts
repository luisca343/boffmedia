import { Inject, Injectable } from '@nestjs/common';
import { EvoTreeNode, PokemonDataService } from './pokemon-data.service';
import { MoveDataService } from './move-data.service';
import { SpawnDataService } from './spawn-data.service';
import { Pokemon, SpawnInfo } from './interfaces/pokemon.interface';
import Fuse, { FuseResult, IFuseOptions } from 'fuse.js';
import { and, desc, eq } from 'drizzle-orm';
import { PokedexRegistry, pokedexRegistry } from '@/_db/schema/SmartRotomPokedex';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { PokemonImageService } from './pokemon-image.service';
import { SpriteManifestService } from './sprite-manifest.service';
import { join } from 'path';
import { promises as fs } from 'fs';

@Injectable()
export class PokemonService {
  private fusePokemon: Fuse<Pokemon>;
  
  constructor(
    private readonly pokemonDataService: PokemonDataService,
    private readonly moveDataService: MoveDataService,
    private readonly spawnDataService: SpawnDataService,
    private readonly pokemonImageService: PokemonImageService,
    private readonly spriteManifestService: SpriteManifestService,
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
    await this.spriteManifestService.loadSpriteManifest();
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
  
  async getRegistries(uuid: string) {
    // Get registry data from the database
    const dex = await this.db
      .select({
        pokemonId: pokedexRegistry.pokemonId, 
        formId: pokedexRegistry.formId, 
        paletteId: pokedexRegistry.paletteId, 
        seenAt: pokedexRegistry.seenAt, 
        caughtAt: pokedexRegistry.caughtAt
      })
      .from(pokedexRegistry)
      .where(eq(pokedexRegistry.uuid, uuid))
      .orderBy(desc(pokedexRegistry.id))
      .limit(20)
      .execute();
      
    // Enhance each registry with Pokemon data and sprite URL
    const enhancedDex = dex.map(entry => {
      // Get the Pokemon data
      const pokemon = this.pokemonDataService.getSpeciesByDex(entry.pokemonId);
      const pokemonName = pokemon?.name || 'Unknown';

      return {
        ...entry,
        pokemonName
      };
    });
    
    return enhancedDex;
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
      const pokemon = this.getPokemonByDex(registry.pokemonId);
      if(registry.formId === "base" && !pokemon.forms.some((f) => f.name === "")) {
        const baseFormId = `${registry.pokemonId}:${pokemon.forms[0].name}`
        if (registry.seenAt) {
          seenPokemon.add(baseFormId)
        }
        if (registry.caughtAt) {
          caughtPokemon.add(baseFormId)
        }
      }

      
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

  async registerPokemon(uuid: string, pokemonId: number, form: string, palette: string, status: number) {
    const formId = form || 'base';
    const paletteId = palette || 'none';
    
    const res = await this.db
      .select({seenAt: pokedexRegistry.seenAt, caughtAt: pokedexRegistry.caughtAt})
      .from(pokedexRegistry)
      .where(and(
        eq(pokedexRegistry.uuid, uuid),
        eq(pokedexRegistry.pokemonId, pokemonId),
        eq(pokedexRegistry.formId, formId),
        eq(pokedexRegistry.paletteId, paletteId)
      )).execute();
    

    if(res.length === 0) {
      const caughtAt = status === 1 ? new Date() : null;
      const result = await this.db
        .insert(pokedexRegistry)
        .values({uuid, pokemonId, formId, paletteId, seenAt: new Date(), caughtAt} as PokedexRegistry)
        .execute();
      
      if(result[0].affectedRows === 1) {
        const pokemon = this.getPokemonByDex(pokemonId);
        const pokemonName = pokemon?.name || '';
        return {success: true, type: 'pokedex_event', uuid, pokemonName, form, palette, status};
      }
    } else if(status === 1) {
      console.log('UPDATING');
      const registry = res[0];
      if(registry.caughtAt !== null) return {success: false, message: 'Pokemon already caught'};
      
      const result = await this.db
        .update(pokedexRegistry)
        .set({caughtAt: new Date()} as PokedexRegistry)
        .where(and(
          eq(pokedexRegistry.uuid, uuid),
          eq(pokedexRegistry.pokemonId, pokemonId),
          eq(pokedexRegistry.formId, formId),
          eq(pokedexRegistry.paletteId, paletteId)
        )).execute();
      
      if(result[0].affectedRows === 1) {
        const pokemon = this.getPokemonByDex(pokemonId);
        const pokemonName = pokemon?.name || '';
        return {success: true, type: 'pokedex_event', uuid, pokemonName, form, palette, status};
      }
    }
    
    return {success: false, message: 'Failed to register pokemon'};
  }

  async updateDex(uuid: string, data: { SEEN: number[], CAUGHT: number[] }) {
    console.log('BULK UPDATING POKEDEX', uuid);
    console.log(`Registering ${data.SEEN.length} seen and ${data.CAUGHT.length} caught Pokemon`);
    
    // First, get existing registries to avoid duplicates
    const existingRegistries = await this.db
      .select({
        pokemonId: pokedexRegistry.pokemonId,
        formId: pokedexRegistry.formId,
        paletteId: pokedexRegistry.paletteId,
        seenAt: pokedexRegistry.seenAt,
        caughtAt: pokedexRegistry.caughtAt
      })
      .from(pokedexRegistry)
      .where(eq(pokedexRegistry.uuid, uuid))
      .execute();
    
    const existingByPokemonId = new Map();
    existingRegistries.forEach(registry => {
      const key = `${registry.pokemonId}:${registry.formId}:${registry.paletteId}`;
      existingByPokemonId.set(key, registry);
    });
    
    // Prepare bulk insert values for SEEN pokemon
    const seenToInsert = [];
    const currentDate = new Date();
    
    // Process SEEN pokemon
    for (const pokemonId of data.SEEN) {
      const key = `${pokemonId}:base:none`;
      if (!existingByPokemonId.has(key)) {
        seenToInsert.push({
          uuid,
          pokemonId,
          formId: 'base',
          paletteId: 'none',
          seenAt: currentDate,
          caughtAt: null
        });
      }
    }
    
    // Process CAUGHT pokemon
    const caughtToInsert = [];
    const caughtToUpdate = [];
    
    for (const pokemonId of data.CAUGHT) {
      const key = `${pokemonId}:base:none`;
      const existing = existingByPokemonId.get(key);
      
      if (!existing) {
        // New record, insert with both seen and caught
        caughtToInsert.push({
          uuid,
          pokemonId,
          formId: 'base',
          paletteId: 'none',
          seenAt: currentDate,
          caughtAt: currentDate
        });
      } else if (existing.caughtAt === null) {
        // Existing record but not caught, update
        caughtToUpdate.push(pokemonId);
      }
    }
    
    // Execute bulk operations
    const results = {
      inserted: { seen: 0, caught: 0 },
      updated: 0,
      total: data.SEEN.length + data.CAUGHT.length
    };
    
    // Insert SEEN records
    if (seenToInsert.length > 0) {
      const seenResult = await this.db
        .insert(pokedexRegistry)
        .values(seenToInsert as PokedexRegistry[])
        .execute();
      
      results.inserted.seen = seenResult[0].affectedRows;
    }
    
    // Insert CAUGHT records
    if (caughtToInsert.length > 0) {
      const caughtResult = await this.db
        .insert(pokedexRegistry)
        .values(caughtToInsert as PokedexRegistry[])
        .execute();
      
      results.inserted.caught = caughtResult[0].affectedRows;
    }
    
    // Update records that were seen but now caught
    for (const pokemonId of caughtToUpdate) {
      const updateResult = await this.db
        .update(pokedexRegistry)
        .set({ caughtAt: currentDate } as Partial<PokedexRegistry>)
        .where(and(
          eq(pokedexRegistry.uuid, uuid),
          eq(pokedexRegistry.pokemonId, pokemonId),
          eq(pokedexRegistry.formId, 'base'),
          eq(pokedexRegistry.paletteId, 'none')
        ))
        .execute();
      
      results.updated += updateResult[0].affectedRows;
    }
    
    console.log('POKEDEX UPDATE COMPLETED', results);
    return {
      success: true,
      message: 'Pokedex updated successfully',
      results
    };
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

  getAllAbilities(): { name: string; count: number }[] {
    // Create a map to store ability counts
    const abilityCounts: { [key: string]: number } = {};
    
    // Get counts for each ability
    for (const ability in this.pokemonDataService.getAllSpeciesByAbility()) {
      if (this.pokemonDataService.getAllSpeciesByAbility().hasOwnProperty(ability)) {
        abilityCounts[ability] = this.pokemonDataService.getAllSpeciesByAbility()[ability].length;
      }
    }
    
    // Convert to array and sort by count (descending)
    const sortedAbilities = Object.entries(abilityCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
    
    return sortedAbilities;
  }
  
  /**
   * Get details about a specific ability
   * @param name The ability name
   * @returns The ability details
   */
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
  
  /**
   * Get Pokemon that have a specific ability
   * @param name The ability name
   * @returns Array of Pokemon with the specified ability
   */
  getPokemonByAbility(name: string): { speciesID: number; form: string; speciesName: string }[] {
    const forms = this.pokemonDataService.getSpeciesByAbility(name) || [];
    const result = [];
    
    forms.forEach(form => {
      const pokemon = this.pokemonDataService.getAllSpecies().find(
        species => species.forms.some(f => f === form)
      );
      
      if (pokemon) {
        result.push({
          speciesID: pokemon.dex,
          form: form.name || 'base',
          speciesName: pokemon.name,
        });
      }
    });
    
    // Sort by Pokedex number
    return this.pokemonDataService.sortByDex(result, 'speciesID');
  }

  async getPmdPortrait(name: string): Promise<{ url: string }> {
    try {
      // Search for the Pokemon by name
      const searchResults = this.searchPokemonByName(name, 1);
      
      if (searchResults.length === 0) {
        console.log('Pokemon not found:', name);
        return { url: '/smartrotom/img/pmd/portrait/0000/Normal.png' };
      }
      
      const pokemon = searchResults[0].item;
      console.log('Found Pokemon:', pokemon.name, 'Dex:', pokemon.dex);
      
      // Format dex number with leading zeros (4 digits)
      const dex = pokemon.dex.toString().padStart(4, '0');
      
      // Construct the PMD sprite paths
      const pmdSpritePath = join(__dirname, '../../../', 'public/smartrotom/img/pmd/portrait', dex, 'Normal.png');
      const spriteUrl = `/smartrotom/img/pmd/portrait/${dex}/Normal.png`;
      
      console.log('Checking PMD sprite path:', spriteUrl);
      
      // Check if the sprite file exists
      try {
        await fs.access(pmdSpritePath);
        console.log('PMD sprite found:', spriteUrl);
        return { url: spriteUrl };
      } catch (error) {
        console.log('PMD sprite not found, using default');
        return { url: '/smartrotom/img/pmd/portrait/0000/Normal.png' };
      }
      
    } catch (error) {
      console.error('Error in getPokemonByPMD:', error);
      return { url: '/smartrotom/img/pmd/portrait/0000/Normal.png' };
    }
  }
}