import { Injectable } from '@nestjs/common';
import { BaseDataService } from './base-data.service';
import { PokemonDataService } from './pokemon-data.service';
import { SpawnInfo, SpawnInfos } from './interfaces/pokemon.interface';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class SpawnDataService extends BaseDataService {
  constructor(private readonly pokemonDataService: PokemonDataService) {
    super();
  }

  private spawnByPokemon: { [key: string]: SpawnInfo[] } = {};
  private spawnByDex: { [key: string]: SpawnInfo[] } = {};
  private spawnByForm: { [key: string]: SpawnInfo[] } = {};
  private spawnByPalette: { [key: string]: SpawnInfo[] } = {};
  private spawnByPokemonAndForm: { [key: string]: SpawnInfo[] } = {};
  private spawnByBiome: { [key: string]: SpawnInfo[] } = {};

  async loadSpawnData() {
    const startingTime = Date.now();
    const folders = ['caverock', 'fishing', 'forage', 'grass', 'headbutt', 'legendaries', 'megas', 'npcs', 'rocksmash', 'standard', 'sweetscent'];

    for (const folder of folders) {
      const defaultDir = path.join(__dirname, '../../../public/smartrotom/packs/default_datapack/data/pixelmon/spawning', folder);
      const publicDir = path.join(__dirname, '../../../public/smartrotom/packs/datapack/data/pixelmon/spawning', folder);

      const spawnData = await this.readJsonFiles(defaultDir, publicDir);

      spawnData.forEach((data: SpawnInfos) => this.processSpawnInfos(data, folder));
    }

    console.log(`Loaded spawn data in ${Date.now() - startingTime}ms`);
  }

  private getSimpleSpriteUrl(pokemonId: number, formName: string = 'base', paletteName: string = 'none'): string {
    try {
      const pokemon = this.pokemonDataService.getSpeciesByDex(pokemonId);
      if (!pokemon) {
        return '/smartrotom/packs/default_resourcepack/assets/pixelmon/textures/pokemon/000_missingno/all/base/none/sprite.png';
      }
      
      const form = pokemon.forms.find((f) => f.name === formName) || pokemon.forms[0];
      
      // Skip image file check and only use resource pack sprites
      
      // Get palette
      let palette;
      if (form.genderProperties) {
        for (const genderProperty of Object.values(form.genderProperties)) {
          if (genderProperty && genderProperty.palettes) {
            for (const p of genderProperty.palettes) {
              if (p && p.name === paletteName) {
                palette = p;
                break;
              }
            }
            if (palette) break;
          }
        }
      }
      
      if (!palette && form.genderProperties && form.genderProperties[0] && form.genderProperties[0].palettes) {
        palette = form.genderProperties[0].palettes[0];
      }
      
      if (!palette) {
        return '/smartrotom/packs/default_resourcepack/assets/pixelmon/textures/pokemon/000_missingno/all/base/none/sprite.png';
      }
      
      // Handle special case for Minior
      const spriteResource = pokemonId === 774 ? 
        'pixelmon:pokemon/774_minior/all/meteor/none/sprite.png' : 
        (palette.sprite?.resource || palette.sprite);
        
      if (!spriteResource) {
        return '/smartrotom/packs/default_resourcepack/assets/pixelmon/textures/pokemon/000_missingno/all/base/none/sprite.png';
      }
      
      const url = `assets/pixelmon/textures/${spriteResource.split(':')[1]}`;
      const defaultDirDef = path.join(__dirname, '../../../', 'public/smartrotom/packs/default_resourcepack', url);
      const publicDir = path.join(__dirname, '../../../', 'public/smartrotom/packs/resourcepack', url);
      
      if (fs.existsSync(defaultDirDef)) {
        return path.join('/smartrotom/packs/default_resourcepack', url);
      }
      if (fs.existsSync(publicDir)) {
        return path.join('/smartrotom/packs/resourcepack', url);
      }
      
      return '/smartrotom/packs/default_resourcepack/assets/pixelmon/textures/pokemon/000_missingno/all/base/none/sprite.png';
    } catch (error) {
      return '/smartrotom/packs/default_resourcepack/assets/pixelmon/textures/pokemon/000_missingno/all/base/none/sprite.png';
    }
  }
  
  private processSpawnInfos(data: SpawnInfos, folder: string) {
    const bannedFolders = ['legendaries', 'megas', 'npcs', 'grass'];
    if (bannedFolders.includes(folder)) return;

    data.spawnInfos.forEach((spawnInfo: SpawnInfo) => {
      if (spawnInfo.typeID !== 'pokemon') return;

      const species = spawnInfo.spec.split('species:')[1].toLowerCase();
      const biomes = spawnInfo.condition?.stringBiomes;

      const regex = /(?<species>[\w-]+)(?: form:(?<form>\w+))?(?: palette:(?<palette>\w+))?/;
      const match = species.match(regex);
      const speciesName = match?.groups?.species;
      let form = match?.groups?.form || 'base';
      const palette = match?.groups?.palette;

      const pokemonID = `${speciesName.toLowerCase()}_${form.toLowerCase()}`;
      spawnInfo.spawnType = folder;
      spawnInfo.pokemonName = speciesName;
      spawnInfo.pokemonForm = form;
      spawnInfo.pokemonPalette = palette;
      spawnInfo.gender = this.pokemonDataService.getSpeciesByNameWithForm(pokemonID)?.gender;
      spawnInfo.pokemonDex = this.pokemonDataService.getSpeciesByName(speciesName)?.dex || 0;
      
      // Add sprite URL to spawn info
      spawnInfo.spriteUrl = this.getSimpleSpriteUrl(
        spawnInfo.pokemonDex,
        spawnInfo.pokemonForm,
        spawnInfo.pokemonPalette
      );

      this.addSpawnInfoToBiomes(biomes, spawnInfo);
      this.addSpawnInfoToCollections(speciesName, form, pokemonID, spawnInfo);
    });
  }

  private addSpawnInfoToBiomes(biomes: string[] | undefined, spawnInfo: SpawnInfo) {
    biomes?.forEach(biome => {
      if (!this.spawnByBiome[biome]) this.spawnByBiome[biome] = [];
      this.spawnByBiome[biome].push(spawnInfo);
    });
  }

  private addSpawnInfoToCollections(speciesName: string | undefined, form: string, pokemonID: string, spawnInfo: SpawnInfo) {
    if (!speciesName) return;

    if (!this.spawnByPokemon[speciesName]) this.spawnByPokemon[speciesName] = [];
    this.spawnByPokemon[speciesName].push(spawnInfo);

    if (!this.spawnByDex[`${spawnInfo.pokemonDex}`]) this.spawnByDex[`${spawnInfo.pokemonDex}`] = [];
    this.spawnByDex[`${spawnInfo.pokemonDex}`].push(spawnInfo);

    if (spawnInfo.pokemonForm) {
      if (!this.spawnByForm[spawnInfo.pokemonForm]) this.spawnByForm[spawnInfo.pokemonForm] = [];
      this.spawnByForm[spawnInfo.pokemonForm].push(spawnInfo);
    }

    if (spawnInfo.pokemonPalette) {
      if (!this.spawnByPalette[spawnInfo.pokemonPalette]) this.spawnByPalette[spawnInfo.pokemonPalette] = [];
      this.spawnByPalette[spawnInfo.pokemonPalette].push(spawnInfo);
    }

    if (!this.spawnByPokemonAndForm[pokemonID]) this.spawnByPokemonAndForm[pokemonID] = [];
    this.spawnByPokemonAndForm[pokemonID].push(spawnInfo);
  }

  getSpawnByPokemon(name: string): SpawnInfo[] {
    return this.spawnByPokemonAndForm[name] || [];
  }

  getBiomesByPokemon(name: string): string[] {
    const spawnInfos = this.getSpawnByPokemon(name);
    return spawnInfos.reduce((acc: string[], spawnInfo: SpawnInfo) => {
      const biomes = spawnInfo.condition?.stringBiomes || [];
      return [...acc, ...biomes];
    }, []);
  }

  getSpawnByDex(dex: number): SpawnInfo[] {
    return this.spawnByDex[dex.toString()] || [];
  }

  getSpawnByForm(form: string): SpawnInfo[] {
    return this.spawnByForm[form] || [];
  }

  getSpawnByPalette(palette: string): SpawnInfo[] {
    return this.spawnByPalette[palette] || [];
  }

  getSpawnByPokemonAndForm(pokemonID: string): SpawnInfo[] {
    return this.spawnByPokemonAndForm[pokemonID] || [];
  }

  getSpawnByBiome(biome: string): SpawnInfo[] {
    return this.spawnByBiome[biome] || [];
  }

  getAllSpawns(): { [key: string]: SpawnInfo[] } {
    return this.spawnByPokemonAndForm;
  }

  getAllBiomes(): { [key: string]: number } {
    const biomes: { [key: string]: number } = {};
    const allSpawns = this.getAllSpawns();
  
    for (const [pokemonId, spawnInfos] of Object.entries(allSpawns)) {
      spawnInfos.forEach(spawnInfo => {
        if (spawnInfo.condition?.stringBiomes) {
          spawnInfo.condition.stringBiomes.forEach(biome => {
            if (!biomes[biome]) {
              biomes[biome] = 0;
            }
            biomes[biome]++;
          });
        }
      });
    }
  
    const sortedBiomes = Object.fromEntries(
      Object.entries(biomes)
        .sort(([, a], [, b]) => b - a)
    );
  
    return sortedBiomes;
  }

  getPokemonByBiome(biomeName: string): { [key: string]: Array<{ dex: number; species: string; form: string; palette: string; rarity: number; percentage: number; spriteUrl: string }> } {
    const biomeData = this.getSpawnByBiome(biomeName);
    const spawns: {
      [key: string]: Array<{
        dex: number;
        species: string;
        form: string;
        palette: string;
        rarity: number;
        percentage: number;
        spriteUrl: string;
      }>
    } = {};

    const totals: { [key: string]: number } = {};
    const pokemonAcc: {
      [key: string]: {
        dex: number;
        species: string;
        form: string;
        palette: string;
        rarity: number;
        percentage: number;
        spriteUrl: string;
      }
    } = {};

    biomeData.forEach((spawn) => {
      if (!totals[spawn.spawnType]) totals[spawn.spawnType] = 0;
      totals[spawn.spawnType] += spawn.rarity;
    });

    for (const spawn of biomeData) {
      const id = `${spawn.spawnType}_${spawn.pokemonName}${spawn.pokemonForm}${spawn.pokemonPalette}`;
      if (!spawns[spawn.spawnType]) spawns[spawn.spawnType] = [];
      if (!pokemonAcc[id]) {
        pokemonAcc[id] = this.getPokemonSprite(spawn, totals[spawn.spawnType]);
      } else {
        pokemonAcc[id].rarity += spawn.rarity;
        pokemonAcc[id].percentage = (pokemonAcc[id].rarity / totals[spawn.spawnType]) * 100;
      }
    }

    // Add each pokemonAcc to the spawns object
    for (const key in pokemonAcc) {
      spawns[key.split('_')[0]].push(pokemonAcc[key]);
    }

    // Sort each spawn type by rarity
    for (const key in spawns) {
      spawns[key] = spawns[key].sort((a, b) => b.rarity - a.rarity);
    }

    // Sort the spawn types by amount of pokemon
    const sortedSpawns = Object.keys(spawns).sort((a, b) => spawns[b].length - spawns[a].length);
    const sortedSpawnsObj: { [key: string]: any } = {};
    sortedSpawns.forEach((key) => {
      sortedSpawnsObj[key] = spawns[key];
    });

    return sortedSpawnsObj;
  }

  private getPokemonSprite(spawn: SpawnInfo, total: number) {
    const pokemon = this.pokemonDataService.getSpeciesByName(spawn.pokemonName);
    return {
      dex: pokemon?.dex || 0,
      species: spawn.pokemonName,
      form: spawn.pokemonForm,
      palette: spawn.pokemonPalette,
      rarity: spawn.rarity,
      percentage: (spawn.rarity / total) * 100,
      // Add sprite URL directly to the response
      spriteUrl: this.getSimpleSpriteUrl(
        pokemon?.dex || 0, 
        spawn.pokemonForm, 
        spawn.pokemonPalette
      )
    };
  }
}