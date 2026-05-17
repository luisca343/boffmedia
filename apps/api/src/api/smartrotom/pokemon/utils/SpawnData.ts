import * as fs from 'fs';
import * as path from 'path';
import { promises as fsPromises } from 'fs';
import { SpawnInfo, SpawnInfos } from '@/types/spawnInfo';
import { PokemonData } from './PokemonData';
import pino from 'pino';

const logger = pino({ name: 'util' });

export class SpawnData {
  pokemonData: PokemonData;
  constructor(PokemonData: PokemonData) {
    this.pokemonData = PokemonData;
  }

  spawnList = [];
  spawnByPokemon = {};
  spawnByDex = {};
  spawnByDexAndFormIndex = {};
  spawnByForm = {};
  spawnByPalette = {};
  spawnByPokemonAndForm = {};

  spawnByBiome = {};

  async loadSpawnData() {
    const startingTime = Date.now();

    let defaultCounter = 0;
    let terasCounter = 0;

    const folders = [
      'caverock',
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
    await Promise.all(
      folders.map(async (folder) => {
        const defaultDirDef = path.join(
          __dirname,
          '../../../../',
          'public/smartrotom/packs/default_datapack/data/pixelmon/spawning',
        );
        const publicDir = path.join(
          __dirname,
          '../../../../',
          'public/smartrotom/packs/datapack/data/pixelmon/spawning',
        );

        const defaultDir = await fsPromises.readdir(
          path.join(defaultDirDef, folder),
        );
        const dir = await fsPromises.readdir(path.join(publicDir, folder));

        const fullDir = [...new Set([...defaultDir, ...dir])];

        for (const file of fullDir) {
          if (!file || !file.includes('.json')) continue;
          let fileName = path.join(publicDir, folder, file);
          let data: SpawnInfos;
          if (fs.existsSync(fileName)) {
            data = JSON.parse(
              await fsPromises.readFile(fileName, 'utf8'),
            ) as SpawnInfos;
            terasCounter++;
          } else {
            fileName = path.join(defaultDirDef, folder, file);
            data = JSON.parse(
              await fsPromises.readFile(fileName, 'utf8'),
            ) as SpawnInfos;
            defaultCounter++;
          }
          const bannedFolders = ['legendaries', 'megas', 'npcs', 'grass'];
          if (bannedFolders.includes(folder)) return;
          //if(folder === 'standard'){
          await data.spawnInfos.forEach((spawnInfo: SpawnInfo) => {
            if (spawnInfo.typeID !== 'pokemon') return;
            const species = spawnInfo.spec.split('species:')[1].toLowerCase();
            const biomes = spawnInfo.condition?.stringBiomes;

            /*
                            The species can be a pokemon name, line 'Weezing'. A Pokémon name with a form, like 'Weezing form:galarian', 
                            a form with a palette, like 'Weepinbell palette:valencian' or a form with a form and a palette, like 'Weepinbell form:gmax palette:valencian'
                            Extracting the species name is a bit tricky, but we can use a regex to extract the species name, form and palette
                        */
            const regex =
              /(?<species>[\w-]+)(?: form:(?<form>\w+))?(?: palette:(?<palette>\w+))?/;
            const match = species.match(regex);
            const speciesName = match?.groups?.species;
            let form = match?.groups?.form;
            const palette = match?.groups?.palette;

            if (!form) form = 'base';
            const pokemonID = `${speciesName.toLowerCase()}_${form.toLowerCase()}`;
            spawnInfo.spawnType = folder;
            spawnInfo.pokemonName = speciesName;
            spawnInfo.pokemonForm = form;
            spawnInfo.pokemonPalette = palette;
            spawnInfo.gender =
              this.pokemonData.speciesByNameWithForm[pokemonID]?.gender;
            spawnInfo.pokemonDex =
              this.pokemonData.speciesByName[speciesName]?.dex || 0;

            biomes?.forEach((biome) => {
              if (!this.spawnByBiome[biome]) this.spawnByBiome[biome] = [];
              this.spawnByBiome[biome].push(spawnInfo);
            });

            /*
                        if(!this.pokemonData.speciesByName[speciesName]?.dex ){
                            logger.info(species)
                            logger.info(`No se ha encontrado el pokemon ${speciesName}`)
                            logger.info(Object.keys(this.pokemonData.speciesByName).length)
                        }*/

            if (!speciesName) return;
            if (!this.spawnByPokemon[speciesName])
              this.spawnByPokemon[speciesName] = [];
            this.spawnByPokemon[speciesName].push(spawnInfo);

            if (!this.spawnByDex[`${spawnInfo.pokemonDex}`])
              this.spawnByDex[`${spawnInfo.pokemonDex}`] = [];
            this.spawnByDex[`${spawnInfo.pokemonDex}`].push(spawnInfo);

            if (form) {
              if (!this.spawnByForm[form]) this.spawnByForm[form] = [];
              this.spawnByForm[form].push(spawnInfo);
            }

            if (palette) {
              if (!this.spawnByPalette[palette])
                this.spawnByPalette[palette] = [];
              this.spawnByPalette[palette].push(spawnInfo);
            }

            if (!this.spawnByPokemonAndForm[`${pokemonID}`])
              this.spawnByPokemonAndForm[`${pokemonID}`] = [];
            this.spawnByPokemonAndForm[`${pokemonID}`].push(spawnInfo);
          });
          //}
        }
      }),
    );

    logger.info(
      `Cargados ${terasCounter} spawns de Teras y ${defaultCounter} spawns por defecto en ${Date.now() - startingTime}ms`,
    );
  }
}
