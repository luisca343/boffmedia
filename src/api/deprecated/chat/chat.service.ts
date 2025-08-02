import { Inject, Injectable } from '@nestjs/common';

import { GoogleGenAI, Type } from '@google/genai';
import { firstLetterToUpperCase } from '@/_utils/stringUtils';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { ficusMessages } from '@/_db/schema/FicusAI';
import { eq, desc, asc } from 'drizzle-orm';
import { PokemonFacadeService } from '@api/smartrotom/pokemon/pokemon.facade.service';

let gemini: GoogleGenAI;
export type FicusMessage = {
  sender: string;
  parts: {
    type: string;
    content: any;
  }[];
};

@Injectable()
export class ChatService {
  constructor(
    private pokemonService: PokemonFacadeService,
    @Inject(DRIZZLE) private db: MySql2Database<Record<string, never>>
  ) {}

  async start() {
    if (!gemini) {
      gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    }
  }

  async first(uuid: string) {
    return this.sendMsg(uuid, {
      sender: 'bot',
      parts: [
        {
          type: 'text',
          content:
            'Hola, soy Profesor Ficus, tu asistente virtual. ¿En qué puedo ayudarte?',
        },
      ],
    });
  }

  async getMessages(uuid: string) {
    let res = await this.db
      .select({ content: ficusMessages.content })
      .from(ficusMessages)
      .where(eq(ficusMessages.uuid, uuid))
      .orderBy(desc(ficusMessages.id))
      .limit(20)
      .execute();

    let mensajes = [];
    res.map((msg: any) => {
      msg.content = JSON.parse(msg.content);
      mensajes.unshift(msg.content);
    });
    return mensajes;
  }

  async storeMessage(uuid: string, mensaje: FicusMessage) {
    this.db
      .insert(ficusMessages)
      .values({ uuid, content: mensaje })
      .execute();
  }

  async sendMsg(uuid: string, mensaje: FicusMessage) {
    this.storeMessage(uuid, mensaje);
    return mensaje;
  }

  async send(uuid: string, mensaje: FicusMessage) {
    if (mensaje.sender === 'user') await this.sendMsg(uuid, mensaje);
    await this.start();

    // Get last 5 messages for context
    const lastMessages = await this.getMessages(uuid);
    const contextMessages = lastMessages.slice(-5).map(msg => {
      // Flatten all text parts for context
      return msg.parts
        .filter(part => part.type === 'text' && typeof part.content === 'string' && part.content.trim() !== '')
        .map(part => part.content)
        .join('\n');
    }).join('\n');

    const globalContext = 'Eres Profesor Ficus, el asistente virtual para la región ficticia de Teras en este servidor Pokémon. Responde como un experto y guía amigable.';

    const userText = [
      globalContext,
      contextMessages,
      mensaje.parts
        .filter(part => part.type === 'text' && typeof part.content === 'string' && part.content.trim() !== '')
        .map(part => part.content)
        .join('\n')
    ].filter(Boolean).join('\n');

    const functionDeclarations = [
      {
        name: 'countPokemon',
        description: 'Counts the total number of Pokémon in the Teras region. This function should be called when the user asks for "how many Pokémon", "number of Pokémon", or "total Pokémon".',
        parameters: {
          type: Type.OBJECT,
          properties: {},
        },
      },
      {
        name: 'getRandomPokemon',
        description: 'Returns a random Pokémon from the Teras region. Call this when the user asks for a "random Pokémon", "surprise me with a Pokémon", "pick a Pokémon for me", or when they want information about a random Pokémon (like "stats of a random Pokémon", "type of a random Pokémon", etc.).',
        parameters: {
          type: Type.OBJECT,
          properties: {
            dataTypes: { 
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'What information to include about the random Pokémon. Can include: "basic" (just show the Pokémon), "type" (types), "stats" (statistics), "moves" (moves), "habitat" (habitat info). If not specified, defaults to ["basic"].'
            }
          },
          required: [],
        },
      },
      {
        name: 'getPokemonData',
        description: 'Returns comprehensive data about a specific Pokémon. Use this for any request about a specific Pokémon\'s information - whether they want one piece of data or multiple pieces.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            pokemon: { 
              type: Type.STRING, 
              description: 'Name of the Pokémon' 
            },
            dataTypes: { 
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'What information to retrieve. Can include: "type" (types), "stats" (statistics), "moves" (moves), "habitat" (habitat info). If not specified, returns all available data.'
            },
            moveTypes: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING }, 
              description: 'Types of moves to filter when moves are requested (level, tutor, egg, tm, tr, hm). If not specified, returns all moves.'
            }
          },
          required: ['pokemon'],
        },
      },
    ];

    const response = await gemini.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: userText,
      config: {
        tools: [{ functionDeclarations }]
      }
    });

    console.log('================= Gemini Response ================');
    console.log(response);

    if (response.functionCalls && response.functionCalls.length > 0) {
      console.log('Function calls found in Gemini response:', response.functionCalls);
      console.log('Response text:', response.text);

      // Accumulate all parts from function calls
      const allParts: { type: string; content: any }[] = [];
      const requestedTypes: Set<string> = new Set();
      let pokemonNames: Set<string> = new Set();

      // Deduplicate function calls to avoid repetitive responses
      const uniqueCalls = this.deduplicateFunctionCalls(response.functionCalls);
      console.log(`[Deduplication] Original calls: ${response.functionCalls.length}, Unique calls: ${uniqueCalls.length}`);

      // Check if we have multiple getRandomPokemon calls - if so, pick one random Pokémon for all of them
      const randomPokemonCalls = uniqueCalls.filter(call => call.name === 'getRandomPokemon');
      let sharedRandomPokemon: any = null;
      if (randomPokemonCalls.length > 1) {
        const allPokemon = this.pokemonService.getAllPokemon();
        if (allPokemon && allPokemon.length > 0) {
          const randomIndex = Math.floor(Math.random() * allPokemon.length);
          sharedRandomPokemon = allPokemon[randomIndex];
          console.log(`[Multiple Random Calls] Selected shared random Pokémon: ${sharedRandomPokemon.name} for ${randomPokemonCalls.length} calls`);
        }
      }

      for (const call of uniqueCalls) {
        console.log(`Attempting to call: ${call.name} with args:`, call.args);
        let functionParts: { type: string; content: any }[] = [];
        
        switch (call.name) {
          case 'countPokemon':
            functionParts = this.getCountPokemonParts();
            requestedTypes.add('conteo');
            break;
            
          case 'getRandomPokemon':
            const dataTypes = Array.isArray(call.args.dataTypes) && call.args.dataTypes.length > 0 
              ? call.args.dataTypes 
              : ['basic'];
            
            if (sharedRandomPokemon) {
              functionParts = await this.getRandomPokemonPartsWithPokemon(sharedRandomPokemon, dataTypes);
              pokemonNames.add(sharedRandomPokemon.name);
            } else {
              functionParts = await this.getRandomPokemonParts(dataTypes);
              // Try to get name from result
              if (functionParts.length > 0 && functionParts[0].content?.pokemonName) {
                pokemonNames.add(functionParts[0].content.pokemonName);
              }
            }
            dataTypes.forEach(type => requestedTypes.add(type));
            break;
            
          case 'getPokemonData':
            if (typeof call.args.pokemon === 'string') {
              const dataTypes = Array.isArray(call.args.dataTypes) && call.args.dataTypes.length > 0 
                ? call.args.dataTypes 
                : ['type', 'stats', 'moves', 'habitat'];
              const moveTypes = Array.isArray(call.args.moveTypes) ? call.args.moveTypes : [];
              
              functionParts = this.getPokemonDataParts(call.args.pokemon, dataTypes, moveTypes);
              pokemonNames.add(call.args.pokemon);
              dataTypes.forEach(type => requestedTypes.add(type));
            } else {
              console.error('Invalid pokemon argument type for getPokemonData:', call.args.pokemon);
              functionParts = [{ type: 'text', content: 'Lo siento, el nombre del Pokémon no es válido.' }];
            }
            break;
            
          default:
            console.log(`Unhandled function call: ${call.name}`);
            functionParts = [{ type: 'text', content: 'Lo siento, no puedo procesar esa solicitud en este momento.' }];
            break;
        }
        allParts.push(...functionParts);
      }

      if (allParts.length > 0) {
        console.log('All parts collected from function calls:', allParts);
        let intro = '';
        const showIntro = ['type', 'stats', 'moves', 'habitat'].some(type => requestedTypes.has(type));
        if (showIntro) {
          const namesList = Array.from(pokemonNames).map(n => firstLetterToUpperCase(n)).join(', ');
          if (namesList) {
            intro = `Aquí tienes la información solicitada para ${namesList}:`;
          } else {
            intro = `Aquí tienes la información solicitada:`;
          }
        }
        if (intro) {
          allParts.unshift({ type: 'text', content: intro });
        }
        allParts.push({ type: 'text', content: '\n¿Hay algo más en lo que pueda ayudarte?' });
        const finalMessage = {
          sender: 'bot',
          parts: allParts
        };
        return await this.sendMsg(uuid, finalMessage);
      } else {
        return await this.sendMsg(uuid, {
          sender: 'bot',
          parts: [{ type: 'text', content: response.text || 'No se pudo obtener información relevante.' }],
        });
      }

    } else {
      console.log('No function calls found in Gemini response. Sending raw text response.');
      console.log('Response text:', response.text);
      return await this.sendMsg(uuid, {
        sender: 'bot',
        parts: [{ type: 'text', content: response.text || 'No Gemini response.' }],
      });
    }
  }

  // Helper method to deduplicate function calls
  private deduplicateFunctionCalls(functionCalls: any[]): any[] {
    const seen = new Set<string>();
    const unique: any[] = [];

    for (const call of functionCalls) {
      // Create a unique key based on function name and arguments
      const key = JSON.stringify({
        name: call.name,
        args: call.args
      });

      if (!seen.has(key)) {
        seen.add(key);
        unique.push(call);
      } else {
        console.log(`[Deduplication] Skipping duplicate call: ${call.name} with args:`, call.args);
      }
    }

    return unique;
  }

  // New unified function to get Pokémon data based on requested types
  getPokemonDataParts(pkmName: string, dataTypes: string[], moveTypes: string[] = []): { type: string; content: any }[] {
    console.log(`[getPokemonDataParts] Received pkmName: "${pkmName}", dataTypes:`, dataTypes, 'moveTypes:', moveTypes);
    
    const lista = this.pokemonService.searchPokemonByName(pkmName);
    const responseParts: { type: string; content: any }[] = [];

    if (!lista || lista.length === 0 || !lista[0].item) {
      console.log(`[getPokemonDataParts] Pokémon "${pkmName}" not found or invalid data structure.`);
      responseParts.push({ 
        type: 'text', 
        content: `Lo siento, no encontré información para "${firstLetterToUpperCase(pkmName)}". ¿Podrías revisar el nombre?` 
      });
      return responseParts;
    }

    const pokemon = lista[0].item;
    const pokemonData = pokemon.forms[0];

    // Process each requested data type
    for (const dataType of dataTypes) {
      switch (dataType) {
        case 'type':
          const tipos = pokemonData.types;
          if (tipos && tipos.length > 0) {
            responseParts.push({ 
              type: 'pokemonTypes', 
              content: { types: tipos, pokemonName: pokemon.name } 
            });
          } else {
            responseParts.push({ 
              type: 'text', 
              content: `No tengo información de tipo para ${firstLetterToUpperCase(pkmName)}.` 
            });
          }
          break;

        case 'stats':
          const stats = pokemonData.battleStats;
          if (stats) {
            responseParts.push({ 
              type: 'pokemonStats', 
              content: { stats, pokemonName: pokemon.name } 
            });
          } else {
            responseParts.push({ 
              type: 'text', 
              content: `No tengo información de estadísticas para ${firstLetterToUpperCase(pkmName)}.` 
            });
          }
          break;

        case 'moves':
          const movimientos = pokemonData.moves;
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
            responseParts.push({ 
              type: 'pokemonMoves', 
              content: { moves: filteredMovimientos, pokemonName: pokemon.name } 
            });
          } else {
            const moveTypeText = moveTypes.length > 0 ? ` del tipo especificado` : '';
            responseParts.push({ 
              type: 'text', 
              content: `No tengo información de movimientos${moveTypeText} para ${firstLetterToUpperCase(pkmName)}.` 
            });
          }
          break;

        case 'habitat':
          const biomes = this.pokemonService.getBiomesByPokemon(`${pokemon.name.toLowerCase()}_base`);
          if (biomes && biomes.length > 0) {
            responseParts.push({ 
              type: 'pokemonHabitat', 
              content: { habitat: biomes, pokemonName: pokemon.name } 
            });
          } else {
            responseParts.push({ 
              type: 'text', 
              content: `No tengo información de hábitat para ${firstLetterToUpperCase(pkmName)}.` 
            });
          }
          break;

        default:
          console.log(`[getPokemonDataParts] Unknown data type: ${dataType}`);
          break;
      }
    }

    return responseParts;
  }

  // Updated random Pokémon functions to handle multiple data types
  async getRandomPokemonPartsWithPokemon(pokemon: any, dataTypes: string[] = ['basic']): Promise<{ type: string; content: any }[]> {
    console.log(`[getRandomPokemonPartsWithPokemon] Using specific Pokémon: ${pokemon.name} with dataTypes:`, dataTypes);

    const responseParts: { type: string; content: any }[] = [];

    // If only basic is requested or basic is included, show the basic info first
    if (dataTypes.includes('basic')) {
      if (pokemon && pokemon.forms && pokemon.forms[0]) {
        const pokemonData = pokemon.forms[0];
        responseParts.push({
          type: 'randomPokemon',
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
          type: 'text',
          content: `¡Te presento a ${firstLetterToUpperCase(pokemon.name)}! 🎲`
        });
        responseParts.push({
          type: 'text',
          content: randomFlavorText
        });
      } else {
        responseParts.push({
          type: 'randomPokemon',
          content: {
            name: pokemon.name || 'un Pokémon misterioso',
            types: [],
            stats: null,
            pokemonName: pokemon.name || null
          }
        });
        responseParts.push({
          type: 'text',
          content: `¡Te presento a ${firstLetterToUpperCase(pokemon.name || 'un Pokémon misterioso')}! 🎲`
        });
      }
    }

    // Add specific data types if requested (excluding 'basic')
    const specificDataTypes = dataTypes.filter(type => type !== 'basic');
    if (specificDataTypes.length > 0) {
      const dataParts = this.getPokemonDataParts(pokemon.name, specificDataTypes);
      responseParts.push(...dataParts);
    }

    // Only add the closing question if we're showing basic info
    if (dataTypes.includes('basic')) {
      responseParts.push({
        type: 'text',
        content: '\n¿Te gustaría saber más sobre este Pokémon o prefieres que elija otro?'
      });
    }

    return responseParts;
  }

  async getRandomPokemonParts(dataTypes: string[] = ['basic']): Promise<{ type: string; content: any }[]> {
    console.log(`[getRandomPokemonParts] Getting random Pokémon with dataTypes:`, dataTypes);
    
    const allPokemon = this.pokemonService.getAllPokemon();
    
    if (!allPokemon || allPokemon.length === 0) {
      console.log('[getRandomPokemonParts] No Pokémon found in the database');
      return [
        {
          type: 'text',
          content: 'Lo siento, no pude encontrar ningún Pokémon en la región de Teras en este momento.',
        }
      ];
    }

    // Generate random index
    const randomIndex = Math.floor(Math.random() * allPokemon.length);
    const randomPokemon = allPokemon[randomIndex];
    
    console.log(`[getRandomPokemonParts] Selected random Pokémon: ${randomPokemon.name} (index: ${randomIndex}) for dataTypes:`, dataTypes);

    return this.getRandomPokemonPartsWithPokemon(randomPokemon, dataTypes);
  }

  // Keep these helper methods for backward compatibility, but they now use the unified function
  getCountPokemonParts(): { type: string; content: any }[] {
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

  // Legacy methods that now delegate to the unified function
  getStatsParts(pkmName: string): { type: string; content: any }[] {
    return this.getPokemonDataParts(pkmName, ['stats']);
  }

  getTipoParts(pkmName: string): { type: string; content: any }[] {
    return this.getPokemonDataParts(pkmName, ['type']);
  }

  getMovimientosParts(args: { pokemon: string; tipoMovimientos: string[] }): { type: string; content: any }[] {
    return this.getPokemonDataParts(args.pokemon, ['moves'], args.tipoMovimientos);
  }

  getHabitatParts(pkmName: string): { type: string; content: any }[] {
    return this.getPokemonDataParts(pkmName, ['habitat']);
  }
}