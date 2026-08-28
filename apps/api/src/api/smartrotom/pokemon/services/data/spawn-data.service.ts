import { Injectable } from '@nestjs/common';
import { BaseDataService } from './base-data.service';
import { PokemonDataService } from './pokemon-data.service';
import { SpawnInfos } from '../../interfaces/pokemon.interface';
import { SpawnInfo } from '../../entities/pokemon-spawn.entity';
import { Logger } from 'nestjs-pino';
import { publicPath } from '@/config/paths';
import { BiomeTagService } from './biome-tag.service';
import { readBiomeKeys } from '../../utils/biome-keys';

@Injectable()
export class SpawnDataService extends BaseDataService {
  constructor(
    private readonly logger: Logger,
    private readonly pokemonDataService: PokemonDataService,
    private readonly biomeTagService: BiomeTagService,
  ) {
    super();
  }

  private spawnByPokemon: { [key: string]: SpawnInfo[] } = {};
  private spawnByDex: { [key: string]: SpawnInfo[] } = {};
  private spawnByForm: { [key: string]: SpawnInfo[] } = {};
  private spawnByPalette: { [key: string]: SpawnInfo[] } = {};
  private spawnByPokemonAndForm: { [key: string]: SpawnInfo[] } = {};
  /** Keyed by category label or literal biome id, exactly as the condition reads. */
  private spawnByBiome: { [key: string]: SpawnInfo[] } = {};
  /** Keyed by concrete biome id, after expanding category tags. */
  private spawnByResolvedBiome: { [key: string]: SpawnInfo[] } = {};

  async loadSpawnData() {
    const startingTime = Date.now();

    // Categories are tag references in 9.4.0, so the tag table has to exist
    // before any spawnInfo is indexed against it.
    await this.biomeTagService.loadBiomeTags();

    const folders = [
      'caverock',
      'curry',
      'fishing',
      'forage',
      'grass',
      'headbutt',
      'legendaries',
      'megas',
      'npcs',
      'rocksmash',
      'standard',
      'sweetscent',
    ];

    for (const folder of folders) {
      const defaultDir = publicPath(
        'smartrotom/packs/default_datapack_9.4.0/data/pixelmon/spawning',
        folder,
      );
      const publicDir = publicPath(
        'smartrotom/packs/datapack/data/pixelmon/spawning',
        folder,
      );

      const spawnData = await this.readJsonFiles(defaultDir, publicDir);

      spawnData.forEach((data: SpawnInfos) =>
        this.processSpawnInfos(data, folder),
      );
    }

    this.logger.log(`Loaded spawn data in ${Date.now() - startingTime}ms`);
  }

  private processSpawnInfos(data: SpawnInfos, folder: string) {
    const bannedFolders = ['legendaries', 'megas', 'npcs', 'grass'];
    if (bannedFolders.includes(folder)) return;

    data.spawnInfos.forEach((spawnInfo: any) => {
      if (spawnInfo.typeID !== 'pokemon') return;

      const species = spawnInfo.spec.split('species:')[1].toLowerCase();
      const biomes = readBiomeKeys(spawnInfo.condition);

      const regex =
        /(?<species>[\w-]+)(?: form:(?<form>\w+))?(?: palette:(?<palette>\w+))?/;
      const match = species.match(regex);
      const speciesName = match?.groups?.species;
      const form = match?.groups?.form || 'base';
      const palette = match?.groups?.palette;

      const pokemonID = `${speciesName!.toLowerCase()}_${form.toLowerCase()}`;
      spawnInfo.spawnType = folder;
      spawnInfo.pokemonName = speciesName!;
      spawnInfo.pokemonForm = form;
      spawnInfo.pokemonPalette = palette;
      spawnInfo.gender =
        this.pokemonDataService.getSpeciesByNameWithForm(pokemonID)?.gender;
      spawnInfo.pokemonDex =
        this.pokemonDataService.getSpeciesByName(speciesName!)?.dex || 0;

      this.addSpawnInfoToBiomes(biomes, spawnInfo);
      this.addSpawnInfoToCollections(speciesName, form, pokemonID, spawnInfo);
    });
  }

  private addSpawnInfoToBiomes(
    biomes: string[] | undefined,
    spawnInfo: SpawnInfo,
  ) {
    biomes?.forEach((biome) => {
      if (!this.spawnByBiome[biome]) this.spawnByBiome[biome] = [];
      this.spawnByBiome[biome].push(spawnInfo);

      // A category covers many biomes and many categories overlap, so the same
      // spawnInfo reaches one biome more than once - dedupe on the way in.
      this.biomeTagService.resolveBiomeReference(biome).forEach((resolved) => {
        if (!this.spawnByResolvedBiome[resolved]) {
          this.spawnByResolvedBiome[resolved] = [];
        }
        const bucket = this.spawnByResolvedBiome[resolved];
        if (bucket[bucket.length - 1] !== spawnInfo) bucket.push(spawnInfo);
      });
    });
  }

  private addSpawnInfoToCollections(
    speciesName: string | undefined,
    form: string,
    pokemonID: string,
    spawnInfo: SpawnInfo,
  ) {
    if (!speciesName) return;

    if (!this.spawnByPokemon[speciesName])
      this.spawnByPokemon[speciesName] = [];
    this.spawnByPokemon[speciesName].push(spawnInfo);

    if (!this.spawnByDex[`${spawnInfo.pokemonDex}`])
      this.spawnByDex[`${spawnInfo.pokemonDex}`] = [];
    this.spawnByDex[`${spawnInfo.pokemonDex}`].push(spawnInfo);

    if (spawnInfo.pokemonForm) {
      if (!this.spawnByForm[spawnInfo.pokemonForm])
        this.spawnByForm[spawnInfo.pokemonForm] = [];
      this.spawnByForm[spawnInfo.pokemonForm].push(spawnInfo);
    }

    if (spawnInfo.pokemonPalette) {
      if (!this.spawnByPalette[spawnInfo.pokemonPalette])
        this.spawnByPalette[spawnInfo.pokemonPalette] = [];
      this.spawnByPalette[spawnInfo.pokemonPalette].push(spawnInfo);
    }

    if (!this.spawnByPokemonAndForm[pokemonID])
      this.spawnByPokemonAndForm[pokemonID] = [];
    this.spawnByPokemonAndForm[pokemonID].push(spawnInfo);
  }

  getSpawnByPokemon(name: string): SpawnInfo[] {
    return this.spawnByPokemonAndForm[name] || [];
  }

  getBiomesByPokemon(name: string): string[] {
    const spawnInfos = this.getSpawnByPokemon(name);
    return spawnInfos.reduce((acc: string[], spawnInfo: SpawnInfo) => {
      return [...acc, ...readBiomeKeys(spawnInfo.condition)];
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

  /**
   * Spawns for a biome, by category label or by concrete biome id.
   *
   * Category labels (`all_forests`, `mesas`) are what the Pokedex has always
   * linked to, so they win. A concrete id (`minecraft:badlands`) falls through
   * to the resolved index, which is what makes /localizacion/minecraft:badlands
   * answerable at all.
   */
  getSpawnByBiome(biome: string): SpawnInfo[] {
    return this.spawnByBiome[biome] || this.spawnByResolvedBiome[biome] || [];
  }

  /** Spawns for a concrete biome id only, ignoring category labels. */
  getSpawnByResolvedBiome(biome: string): SpawnInfo[] {
    return this.spawnByResolvedBiome[biome] || [];
  }

  /** Every concrete biome id that has at least one spawn, with its spawn count. */
  getAllResolvedBiomes(): { [key: string]: number } {
    const counts = Object.fromEntries(
      Object.entries(this.spawnByResolvedBiome).map(([biome, spawns]) => [
        biome,
        spawns.length,
      ]),
    );

    return Object.fromEntries(
      Object.entries(counts).sort(([, a], [, b]) => b - a),
    );
  }

  /** Concrete biome ids a Pokemon can spawn in, categories already expanded. */
  getResolvedBiomesByPokemon(name: string): string[] {
    const out = new Set<string>();
    for (const spawnInfo of this.getSpawnByPokemon(name)) {
      for (const biome of readBiomeKeys(spawnInfo.condition)) {
        for (const resolved of this.biomeTagService.resolveBiomeReference(
          biome,
        )) {
          out.add(resolved);
        }
      }
    }
    return [...out];
  }

  getAllSpawns(): { [key: string]: SpawnInfo[] } {
    return this.spawnByPokemonAndForm;
  }

  getAllBiomes(): { [key: string]: number } {
    const biomes: { [key: string]: number } = {};
    const allSpawns = this.getAllSpawns();

    for (const [_pokemonId, spawnInfos] of Object.entries(allSpawns)) {
      spawnInfos.forEach((spawnInfo) => {
        readBiomeKeys(spawnInfo.condition).forEach((biome) => {
          if (!biomes[biome]) {
            biomes[biome] = 0;
          }
          biomes[biome]++;
        });
      });
    }

    const sortedBiomes = Object.fromEntries(
      Object.entries(biomes).sort(([, a], [, b]) => b - a),
    );

    return sortedBiomes;
  }

  getPokemonByBiome(biomeName: string): {
    [key: string]: Array<{
      dex: number;
      species: string;
      form: string;
      palette: string;
      rarity: number;
      percentage: number;
    }>;
  } {
    const biomeData = this.getSpawnByBiome(biomeName);
    const spawns: {
      [key: string]: Array<{
        dex: number;
        species: string;
        form: string;
        palette: string;
        rarity: number;
        percentage: number;
      }>;
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
      };
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
        pokemonAcc[id].percentage =
          (pokemonAcc[id].rarity / totals[spawn.spawnType]) * 100;
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
    const sortedSpawns = Object.keys(spawns).sort(
      (a, b) => spawns[b].length - spawns[a].length,
    );
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
      palette: spawn.pokemonPalette ?? '',
      rarity: spawn.rarity,
      percentage: (spawn.rarity / total) * 100,
    };
  }
}
