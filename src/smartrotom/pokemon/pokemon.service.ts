import { Inject, Injectable } from '@nestjs/common';
import { PokemonDataService } from './pokemon-data.service';
import { MoveDataService } from './move-data.service';
import { SpawnDataService } from './spawn-data.service';
import { Pokemon, PokemonForm, SpawnInfo, Attack } from './interfaces/pokemon.interface';


import * as fs from 'fs';
import * as path from 'path';
import { and, eq } from 'drizzle-orm';
import { pokedexRegistry } from '@/_db/schema/SmartRotomPokedex';
import { DRIZZLE } from '@/drizzle/drizzle.module';
import { MySql2Database } from 'drizzle-orm/mysql2';

interface EvoTreeNode {
  pkm: string;
  evos: { [key: string]: EvoTreeNode };
  dex: number;
  index: number;
  methods?: any[];
}

@Injectable()
export class PokemonService {
    private dexCache: { [key: string]: { date: Date; data: any[] } } = {};

  constructor(
    private readonly pokemonDataService: PokemonDataService,
    private readonly moveDataService: MoveDataService,
    private readonly spawnDataService: SpawnDataService,
    @Inject(DRIZZLE) private db: MySql2Database<Record<string, never>>
  ) {}

  async loadData() {
    await this.pokemonDataService.loadPokemonData();
    await this.moveDataService.loadMoveData();
    await this.spawnDataService.loadSpawnData();
  }

  getAllPokemon(): Pokemon[] {
    return this.pokemonDataService.getAllSpecies();
  }


  getPokemonByDex(dex: number): Pokemon | undefined {
    return this.pokemonDataService.getSpeciesByDex(dex);
  }

  getAllMoves(): { [key: string]: { speciesID: number; form: string }[] } {
    return this.pokemonDataService.getAllSpeciesByMove();
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

  getPokemonByMove(name: string): { speciesID: number; form: string }[] | undefined {
    return this.pokemonDataService.getSpeciesByMove(name);
  }

  getBiomes(): { [key: string]: number } {
    return this.spawnDataService.getAllBiomes();
  }

  getPokemonByBiome(name: string): { [key: string]: Array<{ dex: number; species: string; form: string; palette: string; rarity: number; percentage: number }> } {
    return this.spawnDataService.getPokemonByBiome(name);
  }

  getItemSprite(name: string){
    const itemFileName1 = name.replaceAll('_', '').toUpperCase()
    const itemFileName2 = name
    //console.log( path.join(__dirname, '../../../', 'public/smartrotom/img/sprites/items', itemFileName + '.png'))
    const sprite = path.join(__dirname, '../../../', 'public/smartrotom/img/sprites/items', itemFileName1 + '.png');
    const sprite2 = path.join(__dirname, '../../../', 'public/smartrotom/img/sprites/items/other', itemFileName2 + '.png');
    if(fs.existsSync(sprite)) return {url: path.join('/smartrotom/img/sprites/items', itemFileName1 + '.png')}
    if(fs.existsSync(sprite2)) return {url: path.join('/smartrotom/img/sprites/items/other', itemFileName2 + '.png')}
    return {url: '/smartrotom/img/sprites/items/000.png'}
}

  async getImage({
    pokemonId = 1,
    formName = "base",
    paletteName = 'none',
    uuid,
    type = 'img',
    hide
  }: {
    pokemonId?: number,
    formName: string,
    paletteName?: string,
    uuid: string,
    type?: string,
    hide?: number
  }) {
    const pokemon = this.pokemonDataService.getSpeciesByDex(pokemonId);
    if (!pokemon) {
      throw new Error(`Pokemon with id ${pokemonId} not found`);
    }

    const form = pokemon.forms.find((f) => f.name === formName) || pokemon.forms[0];
    let status = 0;

    if (pokemonId > 0) {
      if (!this.dexCache[uuid] || new Date().getTime() - this.dexCache[uuid].date.getTime() > 1000) {
        const pokemonStatus = await this.db
          .select()
          .from(pokedexRegistry)
          .where(and(
            eq(pokedexRegistry.uuid, uuid),
          ))
          .execute();
        this.dexCache[uuid] = { date: new Date(), data: pokemonStatus };
      }
      const pokemonStatus = this.dexCache[uuid].data;
      const pokemonStatusFiltered = hide == 1
        ? pokemonStatus.filter((p) => p.pokemonId == pokemonId && p.formId === formName && p.paletteId === paletteName)
        : pokemonStatus.filter((p) => p.pokemonId == pokemonId && p.formId === formName);

      if (pokemonStatusFiltered.length > 0) {
        status = pokemonStatusFiltered[0].caughtAt ? 2 : pokemonStatusFiltered[0].seenAt ? 1 : 0;
      }
    }

    let showImg = status !== 0;
    showImg = true;

    if (type === 'img') {
      const imageFolder = paletteName === 'shiny' ? 'Front Shiny' : paletteName === 'none' ? 'Front' : '';
      const pokemonImageName = formName == "base" ? pokemon.name.toUpperCase() : `${pokemon.name.toUpperCase()}_${form.name.toUpperCase()}`;

      const image = path.join(__dirname, '../../../', 'public/smartrotom/img/sprites', imageFolder, `${pokemonImageName}.png`);
      if (fs.existsSync(image)) return { url: path.join('/smartrotom/img/sprites', imageFolder, `${pokemonImageName}.png`), type: 'image', status, showImg };
    }

    let palette;
    Object.values(form.genderProperties).forEach((genderProperty) => {
      genderProperty.palettes.forEach((p) => {
        if (p.name === paletteName) palette = p;
        return;
      });
    });

    if (!palette) {
      palette = form.genderProperties[0].palettes[0];
    }

    const sprite = this.getSpriteURL(palette, pokemonId);

    const url = `assets/pixelmon/textures/${sprite.split(':')[1]}`;
    const defaultDirDef = path.join(__dirname, '../../../', 'public/smartrotom/packs/default_resourcepack', url);
    const publicDir = path.join(__dirname, '../../../', 'public/smartrotom/packs/resourcepack', url);

    if (fs.existsSync(defaultDirDef)) return { url: path.join('/smartrotom/packs/default_resourcepack', url), type: 'sprite', status, showImg };
    if (fs.existsSync(publicDir)) return { url: path.join('/smartrotom/packs/resourcepack', url), type: 'sprite', status, showImg };
    return { url: '/smartrotom/packs/default_resourcepack/assets/pixelmon/textures/pokemon/000_missingno/all/base/none/sprite.png', status, showImg };
  }

    getSpriteURL(palette, pokemonId?: number){
        if(pokemonId == 774) return 'pixelmon:pokemon/774_minior/all/meteor/none/sprite.png'
        return palette?.sprite?.resource ? palette.sprite.resource : palette.sprite
    }

    getNextPrev(id: number): { prev: Pokemon | undefined; next: Pokemon | undefined } {
      const allSpecies = this.pokemonDataService.getAllSpecies();
      const currIndex = allSpecies.findIndex(species => species.dex === id);
  
      if (currIndex === -1) {
        return { prev: undefined, next: undefined };
      }
  
      const prev = currIndex > 1 ? allSpecies[currIndex - 1] : allSpecies[allSpecies.length - 1];
      const next = currIndex < allSpecies.length - 1 ? allSpecies[currIndex + 1] : allSpecies[0];
  
      return { prev, next };
    }

    getEvoTree(id: number) {
      const pkm = this.pokemonDataService.getSpeciesByDex(id);
      if (!pkm) {
        throw new Error(`Pokemon with id ${id} not found`);
      }
  
      let preEvo = pkm;
      while (preEvo.forms[0].preEvolutions?.length > 0) {
        const preEvoName = preEvo.forms[0].preEvolutions[0].toLowerCase();
        preEvo = this.pokemonDataService.getSpeciesByName(preEvoName);
        if (!preEvo) {
          break;
        }
      }
      const evoTree = this.getEvos(preEvo, 'all');
      return evoTree;
    }
  
    getEvos(pokemon: Pokemon, currentForm: string, evos: { [key: string]: EvoTreeNode } = {}): { depth: number; tree: { [key: string]: EvoTreeNode } } {
      if (currentForm === '') currentForm = 'base';
      
      for (const form of pokemon.forms) {
        const formName = form.name || 'base';
        const pkmId = `${pokemon.name}_${formName}`;
        
        if ((currentForm !== 'all' || formName.includes('gmax')) && formName !== currentForm) continue;
  
        if (Object.keys(evos).length === 0) {
          evos[pkmId] = { pkm: pokemon.name, evos: {}, dex: pokemon.dex, index: form.index + 1 };
        }
  
        let currentPokemon = evos[pkmId];
  
        if (!form.evolutions) {
          continue;
        }
  
        for (const evo of form.evolutions) {
          const [evoPokemonName, evoFormName] = this.getFormName(evo.to);
          const evoId = `${evoPokemonName}_${evoFormName}`;
          if (!currentPokemon.evos) currentPokemon.evos = {};
          const evoArray = currentPokemon.evos;
          
          const evoPokemon = this.pokemonDataService.getSpeciesByName(evoPokemonName);
          if (!evoPokemon) continue;
  
          const evoFormIndex = evoPokemon.forms.findIndex((f) => f.name === evoFormName);
          
          if (!evoArray[evoId]) {
            evoArray[evoId] = {
              pkm: evoPokemonName,
              evos: {},
              dex: evoPokemon.dex,
              index: (evoFormIndex > -1 ? evoFormIndex : 0) + 1
            };
          }
          
          if (!evoArray[evoId].methods) {
            evoArray[evoId].methods = [];
          }
          evoArray[evoId].methods.push(evo);
  
          this.getEvos(evoPokemon, evoFormName, evoArray);
        }
      }
      return { depth: this.getEvoTreeDepth(evos), tree: evos };
    }
  
    private getEvoTreeDepth(evos: { [key: string]: EvoTreeNode }, depth = 0): number {
      let maxDepth = depth;
      for (const evo in evos) {
        const evoDepth = this.getEvoTreeDepth(evos[evo].evos, depth + 1);
        if (evoDepth > maxDepth) maxDepth = evoDepth;
      }
      return maxDepth;
    }

    private getFormName(evolutionString: string): [string, string] {
      const parts = evolutionString.split(':');
      return [parts[0], parts[1] || 'base'];
    }




  countPokemon(): number {
    return this.pokemonDataService.getAllSpecies().length;
  }

  getPokemonByName(name: string): Pokemon | undefined {
    return this.pokemonDataService.getSpeciesByName(name);
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

