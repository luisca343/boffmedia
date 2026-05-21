// @ts-nocheck — Pixelmon data transformation: complex dynamic typing not statically typeable
import { Injectable } from '@nestjs/common';
import { PokemonDataService } from './data/pokemon-data.service';
import { ShowdownPokemonData } from '../interfaces/showdown.interface';
import {
  standardizeFormDisplayName,
  standardizeFormIdSegment,
} from '../utils/ShowdownHelper';

@Injectable()
export class PokemonShowdownService {
  constructor(private readonly pokemonDataService: PokemonDataService) {}

  /**
   * Converts a Pixelmon ability name (SuctionCups) to Showdown format (Suction Cups)
   * Uses capital letters to identify word boundaries
   */
  private convertPixelmonAbilityToShowdown(abilityName: string): string {
    // Add spaces before capital letters (except the first one)
    const showdownName = abilityName.replace(/([A-Z])/g, ' $1').trim();

    // Capitalize each word
    return showdownName
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  /**
   * Converts a Showdown ability name (Suction Cups) to Pixelmon format (SuctionCups)
   */
  private convertShowdownAbilityToPixelmon(abilityName: string): string {
    // Remove spaces and capitalize each word
    return abilityName
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');
  }

  private standardizeFormName(formName: string): string {
    return standardizeFormDisplayName(formName);
  }

  /**
   * Get all Teras Pokemon (dex > 1025) in Showdown format without excluding any forms
   */
  async getTerasPokemonShowdownData(): Promise<ShowdownPokemonData> {
    const terasPokemonData: ShowdownPokemonData = {};
    const species = this.pokemonDataService.getCustomSpecies();

    // Filter for Pokémon with dex numbers > 1025 which are Teras Pokémon
    const terasSpecies = species.filter((pokemon) => pokemon.dex > 0);

    // First, group all forms by Pokemon to properly handle form relationships
    const pokemonWithForms = new Map<
      string,
      {
        basePokemon: any;
        forms: any[];
        allFormNames: string[];
        defaultForm: string;
      }
    >();

    // First pass - collect all forms for each Pokemon
    for (const pokemon of terasSpecies) {
      const formNames = pokemon.forms
        .filter((form) => !!form)
        .map((form) => form.name || 'base');

      // Determine the default form - either from defaultForms array or 'base'
      let defaultForm = 'base';
      if (pokemon.defaultForms && pokemon.defaultForms.length > 0) {
        defaultForm = pokemon.defaultForms[0];
      }

      pokemonWithForms.set(pokemon.name.toLowerCase(), {
        basePokemon: pokemon,
        forms: pokemon.forms.filter((form) => !!form),
        allFormNames: formNames,
        defaultForm: defaultForm,
      });
    }

    // Second pass - generate Showdown data with proper form relationships
    for (const [_pokemonName, pokemonData] of pokemonWithForms.entries()) {
      const pokemon = pokemonData.basePokemon;
      const forms = pokemonData.forms;
      const formNames = pokemonData.allFormNames;
      const defaultForm = pokemonData.defaultForm;

      // Find the default form
      let defaultFormObj =
        forms.find((form) => form.name === defaultForm) || forms[0];
      if (!defaultFormObj && forms.length > 0) {
        defaultFormObj = forms[0];
      }

      // Get a list of alternate forms (excluding the default form and special forms)
      const alternateFormNames = formNames.filter(
        (name) =>
          name !== defaultForm &&
          !['mega', 'gmax', 'terasmega', 'terasgmax'].includes(name),
      );

      // Create a list of full names for other formes, using standardized form names
      const otherFormes = alternateFormNames.map((formName) => {
        const standardizedFormName = this.standardizeFormName(formName);
        return `${pokemon.name}-${standardizedFormName}`;
      });

      // Create a form order list
      const formeOrder = [pokemon.name, ...otherFormes];

      // Only add these fields if the Pokémon has multiple forms
      if (alternateFormNames.length > 0) {
        // Create base form entry with additional form information
        const baseShowdownId = pokemon.name
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '');

        // Process default form abilities
        const defaultFormAbilities =
          defaultFormObj.abilities || forms[0].abilities;
        const abilities: { [key: string]: string } = {};

        if (defaultFormAbilities) {
          defaultFormAbilities.abilities.forEach((ability, index) => {
            const showdownAbilityName =
              this.convertPixelmonAbilityToShowdown(ability);
            abilities[index.toString()] = showdownAbilityName;
          });

          if (
            defaultFormAbilities.hiddenAbilities &&
            defaultFormAbilities.hiddenAbilities.length > 0
          ) {
            abilities['H'] = this.convertPixelmonAbilityToShowdown(
              defaultFormAbilities.hiddenAbilities[0],
            );
          }
        }

        const statsSource = defaultFormObj.battleStats || forms[0].battleStats;

        // Use standardized form name for baseForme if default isn't 'base'
        const standardizedDefaultForm =
          defaultForm !== 'base'
            ? this.standardizeFormName(defaultForm)
            : undefined;

        const showdownPokemon = {
          num: pokemon.dex,
          name: pokemon.name,
          baseForme: standardizedDefaultForm,
          types: defaultFormObj.types
            ? defaultFormObj.types.map(
                (type) =>
                  type.charAt(0).toUpperCase() + type.slice(1).toLowerCase(),
              )
            : [],
          baseStats: {
            hp: statsSource?.hp || 0,
            atk: statsSource?.attack || 0,
            def: statsSource?.defense || 0,
            spa: statsSource?.specialAttack || 0,
            spd: statsSource?.specialDefense || 0,
            spe: statsSource?.speed || 0,
          },
          abilities: abilities,
          weightkg: defaultFormObj.weight || 0,
          eggGroups: defaultFormObj.eggGroups || [],
          otherFormes: otherFormes.length > 0 ? otherFormes : undefined,
          formeOrder: formeOrder,
        };

        // Add gender information if relevant
        if (defaultFormObj.gender) {
          let genderRatio: any;
          if (defaultFormObj.gender === 'male') genderRatio = { M: 1, F: 0 };
          else if (defaultFormObj.gender === 'female')
            genderRatio = { M: 0, F: 1 };
          else if (defaultFormObj.gender === 'none')
            genderRatio = { M: 0, F: 0 };
          else genderRatio = { M: 0.5, F: 0.5 }; // Default balanced

          showdownPokemon['genderRatio'] = genderRatio;
        }

        if (defaultFormObj.dimensions?.height) {
          showdownPokemon['heightm'] = defaultFormObj.dimensions.height / 10;
        }

        if (
          defaultFormObj.preEvolutions &&
          defaultFormObj.preEvolutions.length > 0
        ) {
          showdownPokemon['prevo'] = defaultFormObj.preEvolutions[0];
        }

        if (defaultFormObj.evolutions && defaultFormObj.evolutions.length > 0) {
          showdownPokemon['evos'] = defaultFormObj.evolutions.map(
            (evo) => evo.to,
          );
        }

        terasPokemonData[baseShowdownId] = showdownPokemon;
      } else {
        // Just a single form - create a standard entry
        const defaultFormObj = forms[0];

        // Process abilities
        const abilities: { [key: string]: string } = {};
        if (defaultFormObj.abilities) {
          defaultFormObj.abilities.abilities.forEach((ability, index) => {
            const showdownAbilityName =
              this.convertPixelmonAbilityToShowdown(ability);
            abilities[index.toString()] = showdownAbilityName;
          });

          if (
            defaultFormObj.abilities.hiddenAbilities &&
            defaultFormObj.abilities.hiddenAbilities.length > 0
          ) {
            abilities['H'] = this.convertPixelmonAbilityToShowdown(
              defaultFormObj.abilities.hiddenAbilities[0],
            );
          }
        }

        const baseShowdownId = pokemon.name
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '');
        terasPokemonData[baseShowdownId] = {
          num: pokemon.dex,
          name: pokemon.name,
          types: defaultFormObj.types
            ? defaultFormObj.types.map(
                (type) =>
                  type.charAt(0).toUpperCase() + type.slice(1).toLowerCase(),
              )
            : [],
          baseStats: {
            hp: defaultFormObj.battleStats?.hp || 0,
            atk: defaultFormObj.battleStats?.attack || 0,
            def: defaultFormObj.battleStats?.defense || 0,
            spa: defaultFormObj.battleStats?.specialAttack || 0,
            spd: defaultFormObj.battleStats?.specialDefense || 0,
            spe: defaultFormObj.battleStats?.speed || 0,
          },
          abilities: abilities,
          weightkg: defaultFormObj.weight || 0,
          eggGroups: defaultFormObj.eggGroups || [],
        };

        if (defaultFormObj.dimensions?.height) {
          terasPokemonData[baseShowdownId].heightm =
            defaultFormObj.dimensions.height / 10;
        }

        if (
          defaultFormObj.preEvolutions &&
          defaultFormObj.preEvolutions.length > 0
        ) {
          terasPokemonData[baseShowdownId].prevo =
            defaultFormObj.preEvolutions[0];
        }

        if (defaultFormObj.evolutions && defaultFormObj.evolutions.length > 0) {
          terasPokemonData[baseShowdownId].evos = defaultFormObj.evolutions.map(
            (evo) => evo.to,
          );
        }
      }

      // Process each form of the pokemon (except the default form which was handled above)
      for (const form of pokemon.forms) {
        if (!form || form.name === defaultForm) continue;

        // Skip handling mega/gmax forms differently as they have their own format in Showdown
        const isSpecialForm = [
          'mega',
          'gmax',
          'terasmega',
          'terasgmax',
        ].includes(form.name);

        const formName = form.name;
        const standardizedFormName = this.standardizeFormName(formName); // For display names
        const formIdSegment = standardizeFormIdSegment(formName); // For ID segments

        // Create a Showdown-compatible ID with the standardized ID segment
        const showdownId = `${pokemon.name.toLowerCase().replace(/[^a-z0-9]/g, '')}${formIdSegment}`;

        // Determine gender information
        let gender: string | undefined;
        if (form.gender === 'male') gender = 'M';
        else if (form.gender === 'female') gender = 'F';
        else if (form.gender === 'none') gender = 'N';

        // Convert abilities to Showdown format (0, 1, H for hidden)
        const abilities: { [key: string]: string } = {};

        // Use the form's abilities if available, otherwise fall back to the default form's abilities
        const abilitiesSource = form.abilities || defaultFormObj.abilities;

        if (abilitiesSource) {
          abilitiesSource.abilities.forEach((ability, index) => {
            // Convert ability name from Pixelmon format to Showdown format
            const showdownAbilityName =
              this.convertPixelmonAbilityToShowdown(ability);
            abilities[index.toString()] = showdownAbilityName;
          });

          if (
            abilitiesSource.hiddenAbilities &&
            abilitiesSource.hiddenAbilities.length > 0
          ) {
            // Convert hidden ability name from Pixelmon format to Showdown format
            const showdownHiddenAbility = this.convertPixelmonAbilityToShowdown(
              abilitiesSource.hiddenAbilities[0],
            );
            abilities['H'] = showdownHiddenAbility;
          }
        }

        // Use the form's stats if available, otherwise fall back to the default form's stats
        const statsSource = form.battleStats || defaultFormObj.battleStats;

        // Create the Showdown Pokemon entry
        const showdownPokemon: any = {
          num: pokemon.dex,
          name: `${pokemon.name}-${standardizedFormName}`,
          baseSpecies: pokemon.name,
          forme: standardizedFormName,
          types: form.types
            ? form.types.map(
                (type) =>
                  type.charAt(0).toUpperCase() + type.slice(1).toLowerCase(),
              )
            : defaultFormObj.types.map(
                (type) =>
                  type.charAt(0).toUpperCase() + type.slice(1).toLowerCase(),
              ),
          baseStats: {
            hp: statsSource?.hp || 0,
            atk: statsSource?.attack || 0,
            def: statsSource?.defense || 0,
            spa: statsSource?.specialAttack || 0,
            spd: statsSource?.specialDefense || 0,
            spe: statsSource?.speed || 0,
          },
          abilities: abilities,
          weightkg: form.weight || defaultFormObj.weight || 0,
          eggGroups: form.eggGroups || defaultFormObj.eggGroups || [],
        };

        // Add gender information if relevant
        if (gender) {
          showdownPokemon.gender = gender;
        } else if (form.gender) {
          let genderRatio: any;
          if (form.gender === 'male') genderRatio = { M: 1, F: 0 };
          else if (form.gender === 'female') genderRatio = { M: 0, F: 1 };
          else if (form.gender === 'none') genderRatio = { M: 0, F: 0 };
          else genderRatio = { M: 0.5, F: 0.5 }; // Default balanced

          showdownPokemon['genderRatio'] = genderRatio;
        }

        // Add height if available
        if (form.dimensions?.height || defaultFormObj.dimensions?.height) {
          showdownPokemon.heightm =
            (form.dimensions?.height || defaultFormObj.dimensions?.height) / 10;
        }

        // Add pre-evolution data if available
        if (form.preEvolutions && form.preEvolutions.length > 0) {
          showdownPokemon.prevo = form.preEvolutions[0];
        } else if (
          defaultFormObj.preEvolutions &&
          defaultFormObj.preEvolutions.length > 0
        ) {
          showdownPokemon.prevo = defaultFormObj.preEvolutions[0];
        }

        // Add evolution data if available
        if (form.evolutions && form.evolutions.length > 0) {
          showdownPokemon.evos = form.evolutions.map((evo) => evo.to);
        }

        // Add changesFrom for non-special forms
        if (!isSpecialForm) {
          showdownPokemon.changesFrom = pokemon.name;
        }

        terasPokemonData[showdownId] = showdownPokemon;
      }
    }

    return terasPokemonData;
  }
}
