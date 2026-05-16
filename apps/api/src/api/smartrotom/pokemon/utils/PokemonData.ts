import * as fs from 'fs';
import * as path from 'path';
import { promises as fsPromises } from 'fs';
import { Pokemon } from '@/types/pokemon';
import { wolfeyTypeRanking } from './types';
import { MoveData } from './MoveData';

export class PokemonData {
  moveData: MoveData;

  constructor(moveData: MoveData) {
    this.moveData = moveData;
  }

  pokemonList = [];
  species = [] as Pokemon[];

  highestDex = 0;
  speciesByDex = {};
  speciesByName = {};
  speciesByNameWithForm = {} as [key: string, value: Pokemon];
  speciesByNameFormPalette = {} as [key: string, value: Pokemon];
  speciesByForm = {};
  speciesByPalette = {};
  speciesByType = {};
  speciesByEggGroup = {};
  speciesByAbility = {};
  finalForms = {};

  wordleData = [];

  speciesByMove = {};

  async loadPokemonData() {
    const startingTime = Date.now();
    const defaultDirDef = path.join(
      __dirname,
      '../../../../',
      'public/smartrotom/packs/default_datapack/data/pixelmon/species',
    );
    const publicDir = path.join(
      __dirname,
      '../../../../',
      'public/smartrotom/packs/datapack/data/pixelmon/species',
    );

    const defaultDir = await fsPromises.readdir(defaultDirDef);
    const dir = await fsPromises.readdir(publicDir);

    const fullDir = [...new Set([...defaultDir, ...dir])];

    let defaultCounter = 0;
    let terasCounter = 0;

    for (const file of fullDir) {
      if (!file || !file.includes('.json')) continue;
      let fileName = path.join(publicDir, file);
      let data: Pokemon;
      if (fs.existsSync(fileName)) {
        data = JSON.parse(
          await fsPromises.readFile(fileName, 'utf8'),
        ) as Pokemon;
        terasCounter++;
      } else {
        fileName = path.join(defaultDirDef, file);
        data = JSON.parse(
          await fsPromises.readFile(fileName, 'utf8'),
        ) as Pokemon;
        defaultCounter++;
      }
      if (data.dex === 0) continue;

      this.pokemonList.push(file.split('.')[0].split('_')[1]);
      this.species.push(data);
      this.speciesByDex[data.dex] = data;
      this.speciesByName[data.name.toLowerCase()] = data;

      if (data.dex > this.highestDex) {
        this.highestDex = data.dex;
      }

      let formIndex = 0;
      data.forms?.forEach((form, index) => {
        formIndex++;
        if (!form) return;
        const formName = form.name || 'base';
        if (!this.speciesByForm[formName]) {
          this.speciesByForm[formName] = [];
        }

        let type1 = form.types ? form.types[0] : data.forms[0].types[0];
        let type2 = form.types ? form.types[1] : data.forms[0].types[1];

        type1 = type1.toLowerCase();
        type2 = type2 ? type2.toLowerCase() : undefined;

        const dimensions = form.dimensions
          ? form.dimensions
          : data.forms[0].dimensions;

        const rank = type2
          ? wolfeyTypeRanking.find(
              (r) =>
                (r.type1 === type1 && r.type2 === type2) ||
                (r.type1 === type2 && r.type2 === type1),
            )
          : wolfeyTypeRanking.find(
              (r) => r.type1 === type1 && r.type2 === type1,
            );

        const nameWithForm = `${data.name.toLowerCase()}_${formName.toLowerCase()}`;
        this.speciesByNameWithForm[nameWithForm] = form;

        form.pkmDex = data.dex;
        form.pkmName = data.name;
        form.pkmGeneration = data.generation;
        form.rank = rank;
        form.index = index;
        data.forms[index].rank = rank;
        const tex =
          form?.genderProperties &&
          (form?.genderProperties[0].palettes[0].texture as any);

        if (tex && tex.resource) {
          data.forms[index].gender = tex.resource.split('/')[2];
        } else {
          data.forms[index].gender =
            form?.genderProperties &&
            form?.genderProperties[0].palettes[0].texture.split('/')[2];
        }

        this.speciesByForm[formName].push(form);

        const genderProperties =
          form?.genderProperties && form.genderProperties.length > 0
            ? form.genderProperties[0]
            : undefined;
        const palettes = genderProperties?.palettes;

        if (!form.evolutions || form.evolutions.length === 0) {
          this.finalForms[data.name] = form;
        }

        if (palettes) {
          palettes.forEach((palette) => {
            if (!this.speciesByPalette[palette.name]) {
              this.speciesByPalette[palette.name] = [];
            }
            this.speciesByPalette[palette.name].push(form);
            if (nameWithForm.includes('mega') || nameWithForm.includes('gmax'))
              return;
            this.speciesByNameFormPalette[`${nameWithForm}_${palette.name}`] = {
              name: palette.name,
              sprite: palette.sprite,
            };
          });
        } else {
          this.speciesByNameFormPalette[`${nameWithForm}_none`] = {
            name: 'none',
            sprite: 'none',
          };
        }

        const types = form?.types;
        if (types) {
          types.forEach((type) => {
            if (!this.speciesByType[type]) {
              this.speciesByType[type] = [];
            }
            this.speciesByType[type].push(form);
          });
        }

        const eggGroups = form?.eggGroups;
        if (eggGroups) {
          eggGroups.forEach((eggGroup) => {
            if (!this.speciesByEggGroup[eggGroup]) {
              this.speciesByEggGroup[eggGroup] = [];
            }
            this.speciesByEggGroup[eggGroup].push(form);
          });
        }

        const abilities = form?.abilities;
        if (abilities) {
          abilities.abilities.forEach((ability) => {
            if (!this.speciesByAbility[ability]) {
              this.speciesByAbility[ability] = [];
            }
            this.speciesByAbility[ability].push(form);
          });

          abilities.hiddenAbilities?.forEach((ability) => {
            if (!this.speciesByAbility[ability]) {
              this.speciesByAbility[ability] = [];
            }
            this.speciesByAbility[ability].push(form);
          });
        }

        const moves = form?.moves;
        if (moves) {
          Object.values(moves).forEach((moveList) => {
            moveList.forEach((move) => {
              if (move.attacks) {
                const attacks = move.attacks;
                attacks.forEach((attack) => {
                  if (!this.speciesByMove[attack]) {
                    this.speciesByMove[attack] = [];
                  }
                  if (
                    !this.speciesByMove[attack].find(
                      (s) => s.speciesID === data.dex && s.form === formName,
                    )
                  ) {
                    this.speciesByMove[attack].push({
                      speciesID: data.dex,
                      form: formName,
                    });
                  }
                });
              } else {
                if (!this.speciesByMove[move]) {
                  this.speciesByMove[move] = [];
                }
                if (
                  !this.speciesByMove[move].find(
                    (s) => s.speciesID === data.dex && s.form === formName,
                  )
                ) {
                  this.speciesByMove[move].push({
                    speciesID: data.dex,
                    form: formName,
                  });
                }
              }
            });
          });
        }

        if (formName !== 'gmax') {
          this.wordleData.push({
            name: nameWithForm,
            form: formName,
            type1: type1,
            type2: type2,
            gen: data.generation,
            weight: form.weight,
            height: dimensions.height,
          });
        }
      });
    }

    const countMoves = [];

    Object.entries(this.speciesByMove).forEach(([move, species]) => {
      countMoves[move] = this.speciesByMove[move].length;
    });

    // Sort moves by count
    const sortedMoves = Object.keys(countMoves).sort(
      (a, b) => countMoves[b] - countMoves[a],
    );
    const sortedMovesCopy = {} as { [key: string]: any[] };
    sortedMoves.forEach((key) => {
      sortedMovesCopy[key] = this.speciesByMove[key];
    });

    this.speciesByMove = sortedMovesCopy;

    //console.log(`Moves sorted by count: ${sortedMoves.map((m) => `${m} (${countMoves[m]})`).join(', ')}`);

    let totalForms = 0;
    Object.values(this.speciesByForm).forEach((forms: any[]) => {
      totalForms += forms.length;
    });

    console.log(
      `Cargadas ${this.species.length} especies y ${Object.keys(this.speciesByForm).length} formas diferentes, para un total de ${totalForms} Pokémon`,
    );
    console.log(
      `Cargadas ${Object.keys(this.finalForms).length} formas evolutivas finales`,
    );
    console.log(
      `Cargados ${defaultCounter} archivos predeterminados y ${terasCounter} archivos modificados`,
    );
    const endTime = Date.now();
    console.log(`Tiempo de carga: ${endTime - startingTime}ms`);
  }
}
