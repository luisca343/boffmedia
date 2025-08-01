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

    let botMessages: FicusMessage[] = [];

    if (response.functionCalls && response.functionCalls.length > 0) {
      console.log('Function calls found in Gemini response:', response.functionCalls);
      console.log('Response text:', response.text);

      for (const call of response.functionCalls) {
        let resultMessage: FicusMessage | null = null;
        console.log(`Attempting to call: ${call.name} with args:`, call.args);

        switch (call.name) {
          case 'getPokemonStats':
            if (typeof call.args.pokemon === 'string') {
              resultMessage = await this.sendStats(uuid, call.args.pokemon);
            } else {
              console.error('Invalid pokemon argument type for getPokemonStats:', call.args.pokemon);
              resultMessage = { sender: 'bot', parts: [{ type: 'text', content: 'Lo siento, el nombre del Pokémon no es válido para esta solicitud de estadísticas.' }] };
            }
            break;
          case 'countPokemon':
            resultMessage = await this.countPokemon(uuid);
            break;
          case 'getPokemonType':
            if (typeof call.args.pokemon === 'string') {
              resultMessage = await this.sendTipo(uuid, call.args.pokemon);
            } else {
              console.error('Invalid pokemon argument type for getPokemonType:', call.args.pokemon);
              resultMessage = { sender: 'bot', parts: [{ type: 'text', content: 'Lo siento, el nombre del Pokémon no es válido para esta solicitud de tipo.' }] };
            }
            break;
          case 'getPokemonMoves':
            if (typeof call.args.pokemon === 'string') {
              const tipoMovimientos = Array.isArray(call.args.tipoMovimientos)
                ? call.args.tipoMovimientos
                : [];
              resultMessage = await this.sendMovimientos(uuid, {
                pokemon: call.args.pokemon,
                tipoMovimientos: tipoMovimientos
              });
            } else {
              console.error('Invalid pokemon argument type for getPokemonMoves:', call.args.pokemon);
              resultMessage = { sender: 'bot', parts: [{ type: 'text', content: 'Lo siento, el nombre del Pokémon no es válido para esta solicitud de movimientos.' }] };
            }
            break;
          case 'getPokemonHabitat':
            if (typeof call.args.pokemon === 'string') {
              resultMessage = await this.sendHabitat(uuid, call.args.pokemon);
            } else {
              console.error('Invalid pokemon argument type for getPokemonHabitat:', call.args.pokemon);
              resultMessage = { sender: 'bot', parts: [{ type: 'text', content: 'Lo siento, el nombre del Pokémon no es válido para esta solicitud de hábitat.' }] };
            }
            break;
          default:
            console.log(`Unhandled function call: ${call.name}`);
            resultMessage = {
              sender: 'bot',
              parts: [{ type: 'text', content: 'Lo siento, no puedo procesar esa solicitud en este momento.' }],
            };
            break;
        }
        if (resultMessage) {
          botMessages.push(resultMessage);
        }
      }

      const combinedParts: { type: string; content: any }[] = [];
      botMessages.forEach(msg => {
          msg.parts.forEach(part => {
              combinedParts.push(part);
          });
      });

      if (combinedParts.length > 0) {
          return {
              sender: 'bot',
              parts: combinedParts
          };
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

  countPokemon(uuid: string) {
    const count = this.pokemonService.getAllPokemon().length;
    return this.sendMsg(uuid, {
      sender: 'bot',
      parts: [
        {
          type: 'text',
          content: `Hay ${count} Pokémon en la región de Teras.`,
        },
        {
          type: 'text',
          content: '\n¿Hay algo más en lo que pueda ayudarte?',
        },
      ],
    });
  }

  sendStats(uuid: string, pkmName: string) {
    console.log(`[sendStats] Received pkmName: "${pkmName}"`);
    let lista = this.pokemonService.searchPokemonByName(pkmName);
    console.log(`[sendStats] Result from pokemonService.searchPokemonByName("${pkmName}"):`, lista);

    let responseParts = [];
    if (!lista || lista.length === 0 || !lista[0].item) {
        console.log(`[sendStats] Pokémon "${pkmName}" not found or invalid data structure.`);
        responseParts.push({ type: 'text', content: `Lo siento, no encontré información de estadísticas para "${firstLetterToUpperCase(pkmName)}". ¿Podrías revisar el nombre?` });
    } else {
        let pokemon = lista[0].item;
        let stats = pokemon.forms[0].battleStats;
        console.log(`[sendStats] Stats for ${pkmName}:`, stats);
        if (stats) {
            responseParts.push({ type: 'text', content: `Aquí tienes las estadísticas base de ${firstLetterToUpperCase(pokemon.name)}:` });
            responseParts.push({ type: 'pokemonStats', content: stats });
        } else {
            responseParts.push({ type: 'text', content: `No tengo información de estadísticas para ${firstLetterToUpperCase(pkmName)}.` });
        }
    }
    responseParts.push({ type: 'text', content: '\n¿Hay algo más en lo que pueda ayudarte?' });
    return this.sendMsg(uuid, {
        sender: 'bot',
        parts: responseParts,
    });
  }

  sendTipo(uuid: string, pkmName: string) {
    console.log(`[sendTipo] Received pkmName: "${pkmName}"`);
    let lista = this.pokemonService.searchPokemonByName(pkmName);
    console.log(`[sendTipo] Result from pokemonService.getPokemonByName("${pkmName}"):`, lista);

    let responseParts = [];
    if (!lista || lista.length === 0 || !lista[0].item) {
        console.log(`[sendTipo] Pokémon "${pkmName}" not found or invalid data structure.`);
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
    responseParts.push({ type: 'text', content: '\n¿Hay algo más en lo que pueda ayudarte?' });
    return this.sendMsg(uuid, {
        sender: 'bot',
        parts: responseParts,
    });
  }

  sendMovimientos(uuid: string, args: { pokemon: string; tipoMovimientos: string[] }) {
    let pkmName = args.pokemon;
    let tipoMovimientos = args.tipoMovimientos;

    console.log(`[sendMovimientos] Received pkmName: "${pkmName}", tipoMovimientos:`, tipoMovimientos);
    let lista = this.pokemonService.searchPokemonByName(pkmName);
    console.log(`[sendMovimientos] Result from pokemonService.getPokemonByName("${pkmName}"):`, lista);

    let responseParts = [];
    if (!lista || lista.length === 0 || !lista[0].item) {
        console.log(`[sendMovimientos] Pokémon "${pkmName}" not found or invalid data structure.`);
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
    responseParts.push({ type: 'text', content: '\n¿Hay algo más en lo que pueda ayudarte?' });
    return this.sendMsg(uuid, {
        sender: 'bot',
        parts: responseParts,
    });
  }

  async sendHabitat(uuid: string, pkmName: string) {
    console.log(`[sendHabitat] Received pkmName: "${pkmName}"`);
    
    let lista = this.pokemonService.searchPokemonByName(pkmName);
    const pokemon = lista[0]?.item;
    const biomes = this.pokemonService.getBiomesByPokemon(`${pokemon?.name.toLowerCase()}_base`);

    let responseParts = [];
    if (!biomes || biomes.length === 0) {
        console.log(`[sendHabitat] No biomes found for Pokémon "${pkmName}".`);
        responseParts.push({ type: 'text', content: `Lo siento, no encontré información de hábitat para "${firstLetterToUpperCase(pkmName)}". ¿Podrías revisar el nombre?` });
    } else {
        responseParts.push({ type: 'text', content: `Aquí tienes la información de hábitat para ${firstLetterToUpperCase(pkmName)}:` });
        responseParts.push({ type: 'pokemonHabitat', content: biomes });
    }
    responseParts.push({ type: 'text', content: '\n¿Hay algo más en lo que pueda ayudarte?' });
    return this.sendMsg(uuid, {
        sender: 'bot',
        parts: responseParts,
    });
  }
}