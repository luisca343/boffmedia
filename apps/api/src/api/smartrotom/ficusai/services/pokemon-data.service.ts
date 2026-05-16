import { Injectable } from '@nestjs/common';
import { PokemonFacadeService } from '@api/smartrotom/pokemon/pokemon.facade.service';
import { firstLetterToUpperCase } from '@/_utils/stringUtils';
import { MessagePartDto, MessagePartType } from '../dto/message-part.dto';
import { PokemonData, PokemonStats } from '../types/pokemon-data.interface';
import Fuse from 'fuse.js';

@Injectable()
export class PokemonDataService {
  constructor(private readonly pokemonService: PokemonFacadeService) {}

  getPokemonCount(): { type: string; content: any }[] {
    const count = this.pokemonService.getAllPokemon().length;
    return [
      {
        type: 'pokemonCount',
        content: {
          count,
          pokemonName: null,
        },
      },
      {
        type: 'text',
        content: `Hay ${count} Pokémon en la región de Teras.`,
      },
    ];
  }

  getRandomPokemon(dataTypes: string[] = ['basic']): {
    pokemon: any;
    parts: MessagePartDto[];
  } {
    const allPokemon = this.pokemonService.getAllPokemon();

    if (!allPokemon || allPokemon.length === 0) {
      return {
        pokemon: null,
        parts: [
          {
            type: MessagePartType.TEXT,
            content:
              'Lo siento, no pude encontrar ningún Pokémon en la región de Teras en este momento.',
          },
        ],
      };
    }

    const randomIndex = Math.floor(Math.random() * allPokemon.length);
    const randomPokemon = allPokemon[randomIndex];

    const parts = this.getRandomPokemonParts(randomPokemon, dataTypes);

    return { pokemon: randomPokemon, parts };
  }

  // Modified to return consolidated PokemonData instead of separate parts
  getPokemonDataParts(
    pokemonName: string,
    dataTypes: string[],
    moveTypes: string[] = [],
  ): MessagePartDto[] | null {
    const pokemon = this.pokemonService.searchPokemonByName(pokemonName);

    if (!pokemon || pokemon.length === 0 || !pokemon[0].item) {
      // Return null instead of error message - let the AI service handle this
      return null;
    }

    const pokemonData = pokemon[0].item;
    const pokemonForm = pokemonData.forms[0];

    // Build consolidated pokemon data object
    const consolidatedData: PokemonData = {
      pokemonName: pokemonData.name,
    };

    // Add requested data types to the consolidated object
    for (const dataType of dataTypes) {
      switch (dataType) {
        case 'type':
          if (pokemonForm.types && pokemonForm.types.length > 0) {
            consolidatedData.types = pokemonForm.types;
          }
          break;
        case 'stats':
          if (pokemonForm.battleStats) {
            consolidatedData.stats = this.mapPokemonStats(
              pokemonForm.battleStats,
            );
          }
          break;
        case 'moves':
          const moves = this.getFilteredMoves(pokemonForm.moves, moveTypes);
          if (moves && Object.keys(moves).length > 0) {
            consolidatedData.moves = moves;
          }
          break;
        case 'habitat':
          const biomes = this.pokemonService.getBiomesByPokemon(
            `${pokemonData.name.toLowerCase()}_base`,
          );
          if (biomes && biomes.length > 0) {
            consolidatedData.habitat = biomes;
          }
          break;
      }
    }

    consolidatedData.id = pokemonData.dex;
    consolidatedData.form = pokemonForm.name || 'base';

    // Return single consolidated part
    return [
      {
        type: MessagePartType.POKEMON_DATA,
        content: consolidatedData,
      },
    ];
  }

  private getRandomPokemonParts(
    pokemon: any,
    dataTypes: string[],
  ): MessagePartDto[] {
    const responseParts: MessagePartDto[] = [];

    if (dataTypes.includes('basic')) {
      if (pokemon && pokemon.forms && pokemon.forms[0]) {
        const flavorTexts = [
          `Este Pokémon es una excelente opción para tu equipo.`,
          `¡Qué interesante elección! Este Pokémon tiene características únicas.`,
          `¡Perfecto! Este Pokémon podría ser justo lo que estás buscando.`,
          `¡Genial! Este Pokémon tiene un gran potencial.`,
          `¡Excelente! Este Pokémon es muy versátil en batalla.`,
        ];
        const randomFlavorText =
          flavorTexts[Math.floor(Math.random() * flavorTexts.length)];

        responseParts.push({
          type: MessagePartType.TEXT,
          content: `¡Te presento a ${firstLetterToUpperCase(pokemon.name)}! 🎲`,
        });
        responseParts.push({
          type: MessagePartType.TEXT,
          content: randomFlavorText,
        });

        // Create consolidated pokemon data for random pokemon
        const consolidatedData: PokemonData = {
          pokemonName: pokemon.name,
          types: pokemon.forms[0].types || [],
          stats: this.mapPokemonStats(pokemon.forms[0].battleStats),
        };

        responseParts.push({
          type: MessagePartType.POKEMON_DATA,
          content: consolidatedData,
        });
      }
    }

    // Add specific data types if requested (excluding 'basic')
    const specificDataTypes = dataTypes.filter((type) => type !== 'basic');
    if (specificDataTypes.length > 0) {
      const dataParts = this.getPokemonDataParts(
        pokemon.name,
        specificDataTypes,
      );
      if (dataParts) {
        responseParts.push(...dataParts);
      }
    }

    if (dataTypes.includes('basic')) {
      responseParts.push({
        type: MessagePartType.TEXT,
        content:
          '\n¿Te gustaría saber más sobre este Pokémon o prefieres que elija otro?',
      });
    }

    return responseParts;
  }

  private mapPokemonStats(battleStats: any): PokemonStats | undefined {
    if (!battleStats) return undefined;

    return {
      hp: battleStats.hp || 0,
      attack: battleStats.attack || 0,
      defense: battleStats.defense || 0,
      specialAttack: battleStats.specialAttack || 0,
      specialDefense: battleStats.specialDefense || 0,
      speed: battleStats.speed || 0,
    };
  }

  private getFilteredMoves(
    moves: any,
    moveTypes: string[],
  ): Record<string, any> | null {
    if (!moves) return null;

    const keyMapping = {
      levelUpMoves: 'level',
      tutorMoves: 'tutor',
      eggMoves: 'egg',
      tmMoves8: 'tm',
      tmMoves7: 'tm',
      tmMoves6: 'tm',
      tmMoves5: 'tm',
      tmMoves4: 'tm',
      tmMoves3: 'tm',
      tmMoves2: 'tm',
      tmMoves1: 'tm',
      trMoves: 'tr',
      hmMoves: 'hm',
    };

    let filteredMoves: any = {};
    if (moveTypes && moveTypes.length > 0) {
      Object.keys(moves).forEach((key) => {
        if (keyMapping[key] && moveTypes.includes(keyMapping[key])) {
          filteredMoves[key] = moves[key];
        }
      });
    } else {
      filteredMoves = moves;
    }

    return Object.keys(filteredMoves).length > 0 ? filteredMoves : null;
  }

  // Add method to check if Pokémon exists
  pokemonExists(pokemonName: string): boolean {
    const pokemon = this.pokemonService.searchPokemonByName(pokemonName);
    return !!(pokemon && pokemon.length > 0 && pokemon[0].item);
  }

  // Add method to get similar Pokémon names for suggestions
  getSimilarPokemonNames(pokemonName: string, limit: number = 5): string[] {
    // Use Fuse.js for fuzzy matching with less restrictive params
    const allPokemon = this.pokemonService.getAllPokemon();
    if (!allPokemon) return [];

    const fuse = new Fuse(allPokemon, {
      keys: ['name'],
      threshold: 0.75,
      distance: 200,
      minMatchCharLength: 2,
    });
    const results = fuse.search(pokemonName, { limit });
    return results.map((result: any) => result.item.name);
  }
}
