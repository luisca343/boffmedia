import { Injectable } from '@nestjs/common';
import { PokemonFacadeService } from '@api/smartrotom/pokemon/pokemon.facade.service';
import { firstLetterToUpperCase } from '@/_utils/stringUtils';
import { MessagePartDto, MessagePartType } from '../dto/message-part.dto';

@Injectable()
export class PokemonDataService {
  constructor(
    private readonly pokemonService: PokemonFacadeService,
  ) {}

  getPokemonCount(): { type: string; content: any }[] {
    const count = this.pokemonService.getAllPokemon().length;
    return [
      {
        type: 'pokemonCount',
        content: {
          count,
          pokemonName: null
        }
      },
      {
        type: 'text',
        content: `Hay ${count} Pokémon en la región de Teras.`,
      }
    ];
  }

  getRandomPokemon(dataTypes: string[] = ['basic']): { pokemon: any; parts: MessagePartDto[] } {
    const allPokemon = this.pokemonService.getAllPokemon();
    
    if (!allPokemon || allPokemon.length === 0) {
      return {
        pokemon: null,
        parts: [{
          type: MessagePartType.TEXT,
          content: 'Lo siento, no pude encontrar ningún Pokémon en la región de Teras en este momento.',
        }]
      };
    }

    const randomIndex = Math.floor(Math.random() * allPokemon.length);
    const randomPokemon = allPokemon[randomIndex];
    
    const parts = this.getRandomPokemonParts(randomPokemon, dataTypes);
    
    return { pokemon: randomPokemon, parts };
  }

  getPokemonDataParts(pokemonName: string, dataTypes: string[], moveTypes: string[] = []): MessagePartDto[] {
    const pokemon = this.pokemonService.searchPokemonByName(pokemonName);
    const responseParts: MessagePartDto[] = [];

    if (!pokemon || pokemon.length === 0 || !pokemon[0].item) {
      responseParts.push({ 
        type: MessagePartType.TEXT,
        content: `Lo siento, no encontré información para "${firstLetterToUpperCase(pokemonName)}". ¿Podrías revisar el nombre?` 
      });
      return responseParts;
    }

    const pokemonData = pokemon[0].item;
    const pokemonForm = pokemonData.forms[0];

    for (const dataType of dataTypes) {
      switch (dataType) {
        case 'type':
          responseParts.push(...this.getPokemonTypeParts(pokemonForm, pokemonData.name));
          break;
        case 'stats':
          responseParts.push(...this.getPokemonStatsParts(pokemonForm, pokemonData.name));
          break;
        case 'moves':
          responseParts.push(...this.getPokemonMovesParts(pokemonForm, pokemonData.name, moveTypes));
          break;
        case 'habitat':
          responseParts.push(...this.getPokemonHabitatParts(pokemonData.name));
          break;
      }
    }

    return responseParts;
  }

  private getRandomPokemonParts(pokemon: any, dataTypes: string[]): MessagePartDto[] {
    const responseParts: MessagePartDto[] = [];

    if (dataTypes.includes('basic')) {
      if (pokemon && pokemon.forms && pokemon.forms[0]) {
        const pokemonData = pokemon.forms[0];
        responseParts.push({
          type: MessagePartType.RANDOM_POKEMON,
          content: {
            name: pokemon.name,
            types: pokemonData.types || [],
            stats: pokemonData.battleStats || null,
            pokemonName: pokemon.name
          }
        });
        
        const flavorTexts = [
          `Este Pokémon es una excelente opción para tu equipo.`,
          `¡Qué interesante elección! Este Pokémon tiene características únicas.`,
          `¡Perfecto! Este Pokémon podría ser justo lo que estás buscando.`,
          `¡Genial! Este Pokémon tiene un gran potencial.`,
          `¡Excelente! Este Pokémon es muy versátil en batalla.`
        ];
        const randomFlavorText = flavorTexts[Math.floor(Math.random() * flavorTexts.length)];
        
        responseParts.push({
          type: MessagePartType.TEXT,
          content: `¡Te presento a ${firstLetterToUpperCase(pokemon.name)}! 🎲`
        });
        responseParts.push({
          type: MessagePartType.TEXT,
          content: randomFlavorText
        });
      }
    }

    // Add specific data types if requested (excluding 'basic')
    const specificDataTypes = dataTypes.filter(type => type !== 'basic');
    if (specificDataTypes.length > 0) {
      const dataParts = this.getPokemonDataParts(pokemon.name, specificDataTypes);
      responseParts.push(...dataParts);
    }

    if (dataTypes.includes('basic')) {
      responseParts.push({
        type: MessagePartType.TEXT,
        content: '\n¿Te gustaría saber más sobre este Pokémon o prefieres que elija otro?'
      });
    }

    return responseParts;
  }

  private getPokemonTypeParts(pokemonForm: any, pokemonName: string): MessagePartDto[] {
    const tipos = pokemonForm.types;
    if (tipos && tipos.length > 0) {
      return [{ 
        type: MessagePartType.POKEMON_TYPES, 
        content: { types: tipos, pokemonName } 
      }];
    } else {
      return [{ 
        type: MessagePartType.TEXT, 
        content: `No tengo información de tipo para ${firstLetterToUpperCase(pokemonName)}.` 
      }];
    }
  }

  private getPokemonStatsParts(pokemonForm: any, pokemonName: string): MessagePartDto[] {
    const stats = pokemonForm.battleStats;
    if (stats) {
      return [{ 
        type: MessagePartType.POKEMON_STATS,
        content: { stats, pokemonName } 
      }];
    } else {
      return [{ 
        type: MessagePartType.TEXT,
        content: `No tengo información de estadísticas para ${firstLetterToUpperCase(pokemonName)}.` 
      }];
    }
  }

  private getPokemonMovesParts(pokemonForm: any, pokemonName: string, moveTypes: string[]): MessagePartDto[] {
    const movimientos = pokemonForm.moves;
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

    let filteredMovimientos: any = {};
    if (moveTypes && moveTypes.length > 0) {
      Object.keys(movimientos).forEach((key) => {
        if (keyMapping[key] && moveTypes.includes(keyMapping[key])) {
          filteredMovimientos[key] = movimientos[key];
        }
      });
    } else {
      filteredMovimientos = movimientos;
    }

    if (Object.keys(filteredMovimientos).length > 0) {
      return [{ 
        type: MessagePartType.POKEMON_MOVES,
        content: { moves: filteredMovimientos, pokemonName } 
      }];
    } else {
      const moveTypeText = moveTypes.length > 0 ? ` del tipo especificado` : '';
      return [{ 
        type: MessagePartType.TEXT,
        content: `No tengo información de movimientos${moveTypeText} para ${firstLetterToUpperCase(pokemonName)}.` 
      }];
    }
  }

  private getPokemonHabitatParts(pokemonName: string): MessagePartDto[] {
    const biomes = this.pokemonService.getBiomesByPokemon(`${pokemonName.toLowerCase()}_base`);
    if (biomes && biomes.length > 0) {
      return [{ 
        type: MessagePartType.POKEMON_HABITAT,
        content: { habitat: biomes, pokemonName } 
      }];
    } else {
      return [{ 
        type: MessagePartType.TEXT, 
        content: `No tengo información de hábitat para ${firstLetterToUpperCase(pokemonName)}.` 
      }];
    }
  }
}