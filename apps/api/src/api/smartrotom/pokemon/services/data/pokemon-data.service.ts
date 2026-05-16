import { Injectable } from '@nestjs/common';
import { BaseDataService } from './base-data.service';
import { MoveDataService } from './move-data.service';
import {
  Pokemon,
  PokemonForm,
  SpeciesMoveEntry,
} from '../../interfaces/pokemon.interface';
import * as fs from 'fs';
import * as path from 'path';
import { promises as fsPromises } from 'fs';

export interface EvoTreeNode {
  pkm: string;
  evos: { [key: string]: EvoTreeNode };
  dex: number;
  index: number;
  methods?: any[];
}

@Injectable()
export class PokemonDataService extends BaseDataService {
  constructor(private readonly moveDataService: MoveDataService) {
    super();
  }

  private pokemonNames: string[] = [];

  private species: Pokemon[] = [];
  private speciesByDex: { [key: number]: Pokemon } = {};
  private speciesByName: { [key: string]: Pokemon } = {};
  private speciesByNameWithForm: { [key: string]: PokemonForm } = {};
  private speciesByNameFormPalette: {
    [key: string]: { name: string; sprite: string };
  } = {};
  private speciesByForm: { [key: string]: PokemonForm[] } = {};
  private speciesByPalette: { [key: string]: PokemonForm[] } = {};
  private speciesByType: { [key: string]: PokemonForm[] } = {};
  private speciesByEggGroup: { [key: string]: PokemonForm[] } = {};
  private speciesByAbility: { [key: string]: PokemonForm[] } = {};
  private finalForms: { [key: string]: PokemonForm } = {};
  private speciesByMove: { [key: string]: SpeciesMoveEntry[] } = {};
  private wordleData: any[] = [];

  private customSpeciesFiles: Set<string> = new Set();

  async loadPokemonData() {
    const startingTime = Date.now();
    const defaultDir = path.join(
      process.cwd(),
      'public/smartrotom/packs/default_datapack/data/pixelmon/species',
    );
    const publicDir = path.join(
      process.cwd(),
      'public/smartrotom/packs/datapack/data/pixelmon/species',
    );

    try {
      const publicFiles = await fsPromises.readdir(publicDir);
      publicFiles.forEach((file) => {
        if (file.endsWith('.json')) {
          this.customSpeciesFiles.add(file.split('_')[1]);
        }
      });
    } catch (error: any) {
      console.warn(
        'No custom species directory found or error reading it:',
        error.message,
      );
    }

    const pokemonData = await this.readJsonFiles(defaultDir, publicDir);

    pokemonData.forEach((data: Pokemon) => {
      const isCustom = this.isFileCustom(`${data.name.toLowerCase()}.json`);
      this.processSpecies(data, isCustom);
    });

    this.sortByDex(this.species);
    this.sortMovesByCount();
    this.logStatistics(startingTime);
  }

  private isFileCustom(fileName: string): boolean {
    return this.customSpeciesFiles.has(fileName);
  }

  private processSpecies(data: Pokemon, isCustom: boolean) {
    if (!data.dex) return;

    // Add isCustom field
    data.isCustom = isCustom;

    this.species.push(data);
    this.speciesByDex[data.dex] = data;
    this.speciesByName[data.name.toLowerCase()] = data;

    data.forms?.forEach((form, index) => this.processForm(data, form, index));
  }

  getCustomSpecies(): Pokemon[] {
    return this.species.filter((pokemon) => pokemon.isCustom);
  }

  private processForm(species: Pokemon, form: PokemonForm, index: number) {
    const formName = form.name || 'base';
    const nameWithForm = `${species.name.toLowerCase()}_${formName.toLowerCase()}`;

    let type1 = form.types ? form.types[0] : species.forms[0].types[0];
    let type2 = form.types ? form.types[1] : species.forms[0].types[1];

    type1 = type1.toLowerCase();
    type2 = type2 ? type2.toLowerCase() : '';

    form.types = [type1, type2];

    this.updateSpeciesByForm(formName, form);
    this.updateSpeciesByNameWithForm(nameWithForm, form);
    this.updateSpeciesByType(form);
    this.updateSpeciesByEggGroup(form);
    this.updateSpeciesByAbility(form);
    this.updateSpeciesByMove(species, form, formName);
    this.updateWordleData(species, form, formName);

    this.processPalettes(nameWithForm, form);

    if (!form.evolutions || form.evolutions.length === 0) {
      this.finalForms[species.name] = form;
    }
  }

  private updateSpeciesByForm(formName: string, form: PokemonForm) {
    if (!this.speciesByForm[formName]) {
      this.speciesByForm[formName] = [];
    }
    this.speciesByForm[formName].push(form);
  }

  private updateSpeciesByNameWithForm(nameWithForm: string, form: PokemonForm) {
    this.speciesByNameWithForm[nameWithForm] = form;
  }

  private updateSpeciesByType(form: PokemonForm) {
    form.types?.forEach((type) => {
      if (!this.speciesByType[type]) {
        this.speciesByType[type] = [];
      }
      this.speciesByType[type].push(form);
    });
  }

  private updateSpeciesByEggGroup(form: PokemonForm) {
    form.eggGroups?.forEach((eggGroup) => {
      if (!this.speciesByEggGroup[eggGroup]) {
        this.speciesByEggGroup[eggGroup] = [];
      }
      this.speciesByEggGroup[eggGroup].push(form);
    });
  }

  private updateSpeciesByAbility(form: PokemonForm) {
    form.abilities?.abilities.forEach((ability) => {
      if (!this.speciesByAbility[ability]) {
        this.speciesByAbility[ability] = [];
      }
      this.speciesByAbility[ability].push(form);
    });

    form.abilities?.hiddenAbilities?.forEach((ability) => {
      if (!this.speciesByAbility[ability]) {
        this.speciesByAbility[ability] = [];
      }
      this.speciesByAbility[ability].push(form);
    });
  }

  private updateSpeciesByMove(
    species: Pokemon,
    form: PokemonForm,
    formName: string,
  ) {
    Object.values(form.moves || {}).forEach((moveList) => {
      moveList.forEach((move) => {
        if (typeof move === 'object' && move.attacks) {
          move.attacks.forEach((attack) =>
            this.addMoveToSpecies(attack, species.dex, formName),
          );
        } else if (typeof move === 'string') {
          this.addMoveToSpecies(move, species.dex, formName);
        }
      });
    });
  }

  private addMoveToSpecies(move: string, speciesID: number, formName: string) {
    if (!this.speciesByMove[move]) {
      this.speciesByMove[move] = [];
    }
    if (
      !this.speciesByMove[move].find(
        (s) => s.speciesID === speciesID && s.form === formName,
      )
    ) {
      this.speciesByMove[move].push({ speciesID, form: formName });
    }
  }

  private updateWordleData(
    species: Pokemon,
    form: PokemonForm,
    formName: string,
  ) {
    if (formName !== 'gmax') {
      this.wordleData.push({
        name: `${species.name.toLowerCase()}_${formName.toLowerCase()}`,
        form: formName,
        type1: form.types[0].toLowerCase(),
        type2: form.types[1]?.toLowerCase(),
        gen: species.generation,
        weight: form.weight,
        height: form.dimensions?.height,
      });
    }
  }

  private processPalettes(nameWithForm: string, form: PokemonForm) {
    const palettes = form.genderProperties?.[0]?.palettes;
    if (palettes) {
      palettes.forEach((palette) => {
        if (!this.speciesByPalette[palette.name]) {
          this.speciesByPalette[palette.name] = [];
        }
        this.speciesByPalette[palette.name].push(form);
        if (!nameWithForm.includes('mega') && !nameWithForm.includes('gmax')) {
          this.speciesByNameFormPalette[`${nameWithForm}_${palette.name}`] = {
            name: palette.name,
            sprite: palette.sprite || '',
          };
        }
      });
    } else {
      this.speciesByNameFormPalette[`${nameWithForm}_none`] = {
        name: 'none',
        sprite: 'none',
      };
    }
  }

  public sortByDex(list, dex = 'dex') {
    return list.sort((a, b) => a[dex] - b[dex]);
  }

  private sortMovesByCount() {
    const moveCounts = Object.fromEntries(
      Object.entries(this.speciesByMove).map(([move, species]) => [
        move,
        species.length,
      ]),
    );

    this.speciesByMove = Object.fromEntries(
      Object.entries(this.speciesByMove).sort(
        ([a], [b]) => moveCounts[b] - moveCounts[a],
      ),
    );
  }

  private logStatistics(startTime: number) {
    const totalForms = Object.values(this.speciesByForm).reduce(
      (sum, forms) => sum + forms.length,
      0,
    );
    console.log(
      `Loaded ${this.species.length} species and ${Object.keys(this.speciesByForm).length} different forms, for a total of ${totalForms} Pokémon`,
    );
    console.log(
      `Loaded ${Object.keys(this.finalForms).length} final evolutionary forms`,
    );
    console.log(`Loading time: ${Date.now() - startTime}ms`);
  }

  getAllSpecies(): Pokemon[] {
    return this.species;
  }

  getSpeciesByDex(dex: number): Pokemon | undefined {
    return this.speciesByDex[dex];
  }

  getSpeciesByName(name: string): Pokemon | undefined {
    return this.speciesByName[name.toLowerCase()];
  }

  getSpeciesByNameWithForm(nameWithForm: string): PokemonForm | undefined {
    return this.speciesByNameWithForm[nameWithForm];
  }

  getSpeciesByForm(formName: string): PokemonForm[] | undefined {
    return this.speciesByForm[formName];
  }

  getSpeciesByPalette(paletteName: string): PokemonForm[] | undefined {
    return this.speciesByPalette[paletteName];
  }

  getSpeciesByType(type: string): PokemonForm[] | undefined {
    return this.speciesByType[type];
  }

  getSpeciesByEggGroup(eggGroup: string): PokemonForm[] | undefined {
    return this.speciesByEggGroup[eggGroup];
  }

  getAllSpeciesByAbility(): { [key: string]: PokemonForm[] } {
    return this.speciesByAbility;
  }

  getSpeciesByAbility(ability: string): PokemonForm[] | undefined {
    return this.speciesByAbility[ability];
  }

  getFinalForms(): { [key: string]: PokemonForm } {
    return this.finalForms;
  }

  getSpeciesByMove(
    move: string,
  ): { speciesID: number; form: string }[] | undefined {
    return this.speciesByMove[move];
  }

  getWordleData(): any[] {
    return this.wordleData;
  }

  getPokemonNamePalette(): { [key: string]: { name: string; sprite: string } } {
    return this.speciesByNameFormPalette;
  }

  getAllSpeciesByMove(): {
    [key: string]: { speciesID: number; form: string }[];
  } {
    return this.speciesByMove;
  }

  getAllMovesSortedByCount(): { name: string; count: number }[] {
    const moveCounts: { [key: string]: number } = {};

    for (const move in this.speciesByMove) {
      if (this.speciesByMove.hasOwnProperty(move)) {
        moveCounts[move] = this.speciesByMove[move].length;
      }
    }

    const sortedMoves = Object.entries(moveCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    return sortedMoves;
  }

  getEvoTree(id: number) {
    const pkm = this.getSpeciesByDex(id);
    let preEvo = pkm;

    // Find base pre-evolution
    while (preEvo.forms[0].preEvolutions?.length > 0) {
      const preEvoName = preEvo.forms[0].preEvolutions[0].toLowerCase();
      preEvo = this.getSpeciesByName(preEvoName);
    }

    // Get evolution tree with sprites
    const evoTree = this.getEvos(preEvo, 'all');

    return evoTree;
  }

  getEvos(pokemon: Pokemon, currentForm: string, evos = {} as any) {
    if (currentForm === '') currentForm = 'base';
    let index = 0;
    for (const form of pokemon.forms) {
      const formName = form.name || 'base';
      const pkmId = `${pokemon.name}_${formName}`;
      let currentPokemon = evos[pkmId];
      if (
        (currentForm != 'all' || formName.includes('gmax')) &&
        formName !== currentForm
      )
        continue;

      if (Object.keys(evos).length === 0 || !evos.pkm) {
        evos[pkmId] = {
          pkm: pokemon.name,
          evos: {},
          dex: pokemon.dex,
          index: form.index + 1,
        };
        currentPokemon = evos[pkmId];
      } else {
        currentPokemon = evos;
      }

      if (!form.evolutions) {
        continue;
      }

      for (const evo of form.evolutions) {
        const [evoPokemonName, evoFormName] = this.getFormName(evo.to);
        const evoId = `${evoPokemonName}_${evoFormName}`;
        if (!currentPokemon.evos) currentPokemon.evos = {};
        const evoArray = currentPokemon.evos;
        const evoFormIndex =
          this.getSpeciesByName(evoPokemonName).forms?.findIndex(
            (f) => f.name === evoFormName,
          ) > -1
            ? this.getSpeciesByName(evoPokemonName).forms?.findIndex(
                (f) => f.name === evoFormName,
              )
            : 0;
        if (!evoArray[evoId]) {
          const evoPkmDex = this.getSpeciesByName(evoPokemonName).dex;
          evoArray[evoId] = {
            pkm: evoPokemonName,
            evos: {},
            dex: evoPkmDex,
            index: evoFormIndex + 1,
          };
        }

        const thisEvo = evoArray[evoId];
        if (!evoArray[evoId].methods) {
          evoArray[evoId].methods = [];
        }
        evoArray[evoId].methods.push(evo);

        const evoPkm = this.getSpeciesByName(evoPokemonName);
        const evoEvo = this.getEvos(
          evoPkm,
          evoFormName,
          evoArray[evoId],
        ) as any;
      }
      index++;
    }
    return { depth: this.getEvoTreeDepth(evos), tree: evos };
  }

  getEvoTreeDepth(evos: any, depth = 0) {
    let maxDepth = depth;
    for (const evo in evos) {
      const evoDepth = this.getEvoTreeDepth(evos[evo].evos, depth + 1);
      if (evoDepth > maxDepth) maxDepth = evoDepth;
    }
    return maxDepth;
  }

  getFormName(nombre: string) {
    nombre = nombre.toLowerCase();
    let [nombrePkm, forma] = [nombre, 'base'];
    if (nombre.includes(' form:')) {
      [nombrePkm, forma] = nombre.split(' form:');
    }
    if (nombre.includes(' f:')) {
      [nombrePkm, forma] = nombre.split(' f:');
    }
    if (nombre.includes(' palette:')) {
      [nombrePkm, forma] = nombre.split(' palette:');
    }

    return [nombrePkm, forma];
  }
}
