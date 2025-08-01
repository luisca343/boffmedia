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
        description: 'Counts the total number of Pokémon in the Teras region. This function should ONLY be called when the user asks for "how many Pokémon", "number of Pokémon", or "total Pokémon".',
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
            requestType: { 
              type: Type.STRING, 
              description: 'What information is requested: "basic" for just showing the Pokémon, "stats" for statistics, "type" for types, "moves" for moves, "habitat" for habitat info',
              enum: ['basic', 'stats', 'type', 'moves', 'habitat']
            }
          },
          required: ['requestType'],
        },
      },
      {
        name: 'getPokemonStats',
        description: 'Returns the base stats of a Pokémon given its name. Only call this when the user asks for stats of a specific Pokémon.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            pokemon: { type: Type.STRING, description: 'Name of the Pokémon' }
          },
          required: ['pokemon'],
        },
      },
      {
        name: 'getPokemonType',
        description: 'Returns the type(s) of a Pokémon given its name. Only call this when the user asks for the type of a specific Pokémon.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            pokemon: { type: Type.STRING, description: 'Name of the Pokémon' }
          },
          required: ['pokemon'],
        },
      },
      {
        name: 'getPokemonMoves',
        description: 'Returns the moves of a Pokémon given its name and optionally filtered by move type. Only call this when the user asks for the moves of a specific Pokémon.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            pokemon: { type: Type.STRING, description: 'Name of the Pokémon' },
            tipoMovimientos: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Types of moves to filter (level, tutor, egg, tm, tr, hm)' }
          },
          required: ['pokemon'],
        },
      },
      {
        name: 'getPokemonHabitat',
        description: 'Returns the habitat information of a Pokémon given its name. Only call this when the user asks for the habitat of a specific Pokémon.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            pokemon: { type: Type.STRING, description: 'Name of the Pokémon' }
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

      for (const call of response.functionCalls) {
        console.log(`Attempting to call: ${call.name} with args:`, call.args);

        let functionParts: { type: string; content: any }[] = [];

        switch (call.name) {
          case 'getPokemonStats':
            if (typeof call.args.pokemon === 'string') {
              functionParts = await this.getStatsParts(call.args.pokemon);
            } else {
              console.error('Invalid pokemon argument type for getPokemonStats:', call.args.pokemon);
              functionParts = [{ type: 'text', content: 'Lo siento, el nombre del Pokémon no es válido para esta solicitud de estadísticas.' }];
            }
            break;
          case 'countPokemon':
            functionParts = this.getCountPokemonParts();
            break;
          case 'getRandomPokemon':
            const requestType = typeof call.args.requestType === 'string' ? call.args.requestType : 'basic';
            functionParts = await this.getRandomPokemonParts(requestType);
            break;
          case 'getPokemonType':
            if (typeof call.args.pokemon === 'string') {
              functionParts = this.getTipoParts(call.args.pokemon);
            } else {
              console.error('Invalid pokemon argument type for getPokemonType:', call.args.pokemon);
              functionParts = [{ type: 'text', content: 'Lo siento, el nombre del Pokémon no es válido para esta solicitud de tipo.' }];
            }
            break;
          case 'getPokemonMoves':
            if (typeof call.args.pokemon === 'string') {
              const tipoMovimientos = Array.isArray(call.args.tipoMovimientos)
                ? call.args.tipoMovimientos
                : [];
              functionParts = this.getMovimientosParts({
                pokemon: call.args.pokemon,
                tipoMovimientos: tipoMovimientos
              });
            } else {
              console.error('Invalid pokemon argument type for getPokemonMoves:', call.args.pokemon);
              functionParts = [{ type: 'text', content: 'Lo siento, el nombre del Pokémon no es válido para esta solicitud de movimientos.' }];
            }
            break;
          case 'getPokemonHabitat':
            if (typeof call.args.pokemon === 'string') {
              functionParts = this.getHabitatParts(call.args.pokemon);
            } else {
              console.error('Invalid pokemon argument type for getPokemonHabitat:', call.args.pokemon);
              functionParts = [{ type: 'text', content: 'Lo siento, el nombre del Pokémon no es válido para esta solicitud de hábitat.' }];
            }
            break;
          default:
            console.log(`Unhandled function call: ${call.name}`);
            functionParts = [{ type: 'text', content: 'Lo siento, no puedo procesar esa solicitud en este momento.' }];
            break;
        }

        // Add function parts to accumulated parts
        allParts.push(...functionParts);
      }

      // Add the final help message only once
      if (allParts.length > 0) {
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

  // New helper methods that return parts instead of sending messages directly
  getCountPokemonParts(): { type: string; content: any }[] {
    const count = this.pokemonService.getAllPokemon().length;
    return [
      {
        type: 'text',
        content: `Hay ${count} Pokémon en la región de Teras.`,
      }
    ];
  }

  async getRandomPokemonParts(requestType: string = 'basic'): Promise<{ type: string; content: any }[]> {
    console.log(`[getRandomPokemonParts] Getting random Pokémon with requestType: ${requestType}`);
    
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
    
    console.log(`[getRandomPokemonParts] Selected random Pokémon: ${randomPokemon.name} (index: ${randomIndex}) for requestType: ${requestType}`);

    // Handle different request types
    switch (requestType) {
      case 'stats':
        return this.getStatsParts(randomPokemon.name);
      
      case 'type':
        return this.getTipoParts(randomPokemon.name);
      
      case 'moves':
        return this.getMovimientosParts({ pokemon: randomPokemon.name, tipoMovimientos: [] });
      
      case 'habitat':
        return this.getHabitatParts(randomPokemon.name);
      
      case 'basic':
      default:
        // Original behavior for basic random Pokémon display
        let responseParts = [];
        
        if (randomPokemon && randomPokemon.forms && randomPokemon.forms[0]) {
          const pokemonData = randomPokemon.forms[0];
          
          // Add introduction text
          responseParts.push({
            type: 'text',
            content: `¡Te presento a ${firstLetterToUpperCase(randomPokemon.name)}! 🎲`
          });

          // Add basic info
          responseParts.push({
            type: 'randomPokemon',
            content: {
              name: randomPokemon.name,
              types: pokemonData.types || [],
              stats: pokemonData.battleStats || null,
            }
          });

          // Add some flavor text
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
            content: randomFlavorText
          });

        } else {
          console.log('[getRandomPokemonParts] Invalid Pokémon data structure:', randomPokemon);
          responseParts.push({
            type: 'text',
            content: `¡Te presento a ${firstLetterToUpperCase(randomPokemon.name || 'un Pokémon misterioso')}! 🎲`
          });
        }

        responseParts.push({
          type: 'text',
          content: '\n¿Te gustaría saber más sobre este Pokémon o prefieres que elija otro?'
        });

        return responseParts;
    }
  }

  getStatsParts(pkmName: string): { type: string; content: any }[] {
    console.log(`[getStatsParts] Received pkmName: "${pkmName}"`);
    let lista = this.pokemonService.searchPokemonByName(pkmName);
    console.log(`[getStatsParts] Result from pokemonService.searchPokemonByName("${pkmName}"):`, lista);

    let responseParts = [];
    if (!lista || lista.length === 0 || !lista[0].item) {
        console.log(`[getStatsParts] Pokémon "${pkmName}" not found or invalid data structure.`);
        responseParts.push({ type: 'text', content: `Lo siento, no encontré información de estadísticas para "${firstLetterToUpperCase(pkmName)}". ¿Podrías revisar el nombre?` });
    } else {
        let pokemon = lista[0].item;
        let stats = pokemon.forms[0].battleStats;
        console.log(`[getStatsParts] Stats for ${pkmName}:`, stats);
        if (stats) {
            responseParts.push({ type: 'text', content: `Aquí tienes las estadísticas base de ${firstLetterToUpperCase(pokemon.name)}:` });
            responseParts.push({ type: 'pokemonStats', content: stats });
        } else {
            responseParts.push({ type: 'text', content: `No tengo información de estadísticas para ${firstLetterToUpperCase(pkmName)}.` });
        }
    }
    return responseParts;
  }

  getTipoParts(pkmName: string): { type: string; content: any }[] {
    console.log(`[getTipoParts] Received pkmName: "${pkmName}"`);
    let lista = this.pokemonService.searchPokemonByName(pkmName);
    console.log(`[getTipoParts] Result from pokemonService.getPokemonByName("${pkmName}"):`, lista);

    let responseParts = [];
    if (!lista || lista.length === 0 || !lista[0].item) {
        console.log(`[getTipoParts] Pokémon "${pkmName}" not found or invalid data structure.`);
        responseParts.push({ type: 'text', content: `Lo siento, no encontré información de tipo para "${firstLetterToUpperCase(pkmName)}". ¿Podrías revisar el nombre?` });
    } else {
        let pokemon = lista[0].item;
        let tipos = pokemon.forms[0].types;
        if (tipos && tipos.length > 0) {
            responseParts.push({ type: 'pokemonTypes', content: {types: tipos, pokemonName: pokemon.name} });
        } else {
            responseParts.push({ type: 'text', content: `No tengo información de tipo para ${firstLetterToUpperCase(pkmName)}.` });
        }
    }
    return responseParts;
  }

  getMovimientosParts(args: { pokemon: string; tipoMovimientos: string[] }): { type: string; content: any }[] {
    let pkmName = args.pokemon;
    let tipoMovimientos = args.tipoMovimientos;

    console.log(`[getMovimientosParts] Received pkmName: "${pkmName}", tipoMovimientos:`, tipoMovimientos);
    let lista = this.pokemonService.searchPokemonByName(pkmName);
    console.log(`[getMovimientosParts] Result from pokemonService.getPokemonByName("${pkmName}"):`, lista);

    let responseParts = [];
    if (!lista || lista.length === 0 || !lista[0].item) {
        console.log(`[getMovimientosParts] Pokémon "${pkmName}" not found or invalid data structure.`);
        responseParts.push({ type: 'text', content: `Lo siento, no encontré información de movimientos para "${firstLetterToUpperCase(pkmName)}". ¿Podrías revisar el nombre?` });
    } else {
        let pokemon = lista[0].item;
        let movimientos = pokemon.forms[0].moves;

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
        if (tipoMovimientos && tipoMovimientos.length > 0) {
            Object.keys(movimientos).forEach((key) => {
                if (keyMapping[key] && tipoMovimientos.includes(keyMapping[key])) {
                    filteredMovimientos[key] = movimientos[key];
                }
            });
        } else {
            filteredMovimientos = movimientos;
        }

        if (Object.keys(filteredMovimientos).length > 0) {
            responseParts.push({ type: 'text', content: `Aquí tienes la lista de movimientos de ${firstLetterToUpperCase(pokemon.name)}:` });
            responseParts.push({ type: 'pokemonMoves', content: filteredMovimientos });
        } else {
            responseParts.push({ type: 'text', content: `No tengo información de movimientos (o no se encontraron para el tipo especificado) para ${firstLetterToUpperCase(pkmName)}.` });
        }
    }
    return responseParts;
  }

  getHabitatParts(pkmName: string): { type: string; content: any }[] {
    console.log(`[getHabitatParts] Received pkmName: "${pkmName}"`);
    
    let lista = this.pokemonService.searchPokemonByName(pkmName);
    const pokemon = lista[0]?.item;
    const biomes = this.pokemonService.getBiomesByPokemon(`${pokemon?.name.toLowerCase()}_base`);

    let responseParts = [];
    if (!biomes || biomes.length === 0) {
        console.log(`[getHabitatParts] No biomes found for Pokémon "${pkmName}".`);
        responseParts.push({ type: 'text', content: `Lo siento, no encontré información de hábitat para "${firstLetterToUpperCase(pkmName)}". ¿Podrías revisar el nombre?` });
    } else {
        responseParts.push({ type: 'text', content: `Aquí tienes la información de hábitat para ${firstLetterToUpperCase(pkmName)}:` });
        responseParts.push({ type: 'pokemonHabitat', content: biomes });
    }
    return responseParts;
  }

  // Keep the original methods for backward compatibility (if needed elsewhere)
  countPokemon(uuid: string) {
    const parts = this.getCountPokemonParts();
    parts.push({ type: 'text', content: '\n¿Hay algo más en lo que pueda ayudarte?' });
    return this.sendMsg(uuid, {
      sender: 'bot',
      parts: parts,
    });
  }

  async getRandomPokemon(uuid: string, requestType: string = 'basic') {
    const parts = await this.getRandomPokemonParts(requestType);
    parts.push({ type: 'text', content: '\n¿Hay algo más en lo que pueda ayudarte?' });
    return this.sendMsg(uuid, {
      sender: 'bot',
      parts: parts,
    });
  }

  sendStats(uuid: string, pkmName: string) {
    const parts = this.getStatsParts(pkmName);
    parts.push({ type: 'text', content: '\n¿Hay algo más en lo que pueda ayudarte?' });
    return this.sendMsg(uuid, {
        sender: 'bot',
        parts: parts,
    });
  }

  sendTipo(uuid: string, pkmName: string) {
    const parts = this.getTipoParts(pkmName);
    parts.push({ type: 'text', content: '\n¿Hay algo más en lo que pueda ayudarte?' });
    return this.sendMsg(uuid, {
        sender: 'bot',
        parts: parts,
    });
  }

  sendMovimientos(uuid: string, args: { pokemon: string; tipoMovimientos: string[] }) {
    const parts = this.getMovimientosParts(args);
    parts.push({ type: 'text', content: '\n¿Hay algo más en lo que pueda ayudarte?' });
    return this.sendMsg(uuid, {
        sender: 'bot',
        parts: parts,
    });
  }

  async sendHabitat(uuid: string, pkmName: string) {
    const parts = this.getHabitatParts(pkmName);
    parts.push({ type: 'text', content: '\n¿Hay algo más en lo que pueda ayudarte?' });
    return this.sendMsg(uuid, {
        sender: 'bot',
        parts: parts,
    });
  }
}