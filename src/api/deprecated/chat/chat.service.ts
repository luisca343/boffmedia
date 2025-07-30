import { Inject, Injectable } from '@nestjs/common';

import { GoogleGenerativeAI } from '@google/generative-ai';
import { firstLetterToUpperCase } from '@/_utils/stringUtils';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { ficusMessages } from '@/_db/schema/FicusAI';
import { eq, desc, asc } from 'drizzle-orm';
import { PokemonFacadeService } from '@api/smartrotom/pokemon/pokemon.facade.service';

let gemini: GoogleGenerativeAI;
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
      gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
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


    const userText = mensaje.parts
      .filter(part => part.type === 'text' && typeof part.content === 'string' && part.content.trim() !== '')
      .map(part => part.content)
      .join('\n');
      
    // 1. Define available functions for Gemini (JSON format enforced)
    const functionDescriptions = `
      === CONTEXT ===
        You are Professor Ficus, a Pokémon expert assistant. You help users get information about Pokémon.

        IMPORTANT: When a user asks about a specific Pokémon, you MUST use the exact Pokémon name they mentioned.

        Available functions (respond ONLY with valid JSON array, no other text):

        - sendStats(pkmName): Get base stats for a Pokémon
        - sendTipo(pkmName): Get the type(s) of a Pokémon  
        - sendMovimientos(pkmName, tipoMovimientos): Get moves for a Pokémon
        - sendHabitat(pkmName): Get habitat information for a Pokémon

        CRITICAL: Always use the EXACT Pokémon name the user mentioned. If they say "Charizard", use "charizard" (lowercase). If they say "Pikachu", use "pikachu".

        If the user's message doesn't require a function call, respond with normal text (not JSON).
      === END CONTEXT ===

      Answer this based in your knowledge: ${userText}`;

    const geminiMessages = [
      {
        role: 'user',
        parts: [{ text: `${functionDescriptions}` }]
      }
    ];

    // 3. Call Gemini
    const model = gemini.getGenerativeModel({ model: 'gemma-3-27b-it' });
    const result = await model.generateContent({ contents: geminiMessages });

    const completionResponse =
      typeof result?.response?.text === 'function'
        ? await result.response.text()
        : 'No Gemini response.';

    console.log('Gemini response:')
    console.log(completionResponse);

    // 4. Parse JSON function call(s)
    try {
      // Clean up response: remove leading/trailing whitespace and newlines
      const cleanedResponse = completionResponse
        .replace(/```[a-z]*\s*/gi, '') // Remove ```json, ```typescript, etc.
        .replace(/```/g, '')           // Remove any remaining ```
        .replace(/^[\s\n]+|[\s\n]+$/g, '') // Trim whitespace/newlines
        .replace(/,\s*\n*]/g, ']');    

      console.log('Cleaned response:', cleanedResponse);

      const functionCalls = JSON.parse(cleanedResponse);
      console.log('Parsed function calls:');
      console.log(functionCalls);
      if (Array.isArray(functionCalls)) {
        for (const call of functionCalls) {
          console.log('Processing function call:', call);
          if (call.name === 'sendStats') {
            console.log('Calling sendStats with:', call.parameters.pkmName);
            return await this.sendStats(uuid, call.parameters.pkmName);
          }
          if (call.name === 'sendTipo') {
            return await this.sendTipo(uuid, call.parameters.pkmName);
          }
          if (call.name === 'sendMovimientos') {
            return await this.sendMovimientos(uuid, { pokemon: call.parameters.pkmName, tipoMovimientos: call.parameters.tipoMovimientos });
          }
          if (call.name === 'sendHabitat') {
            return await this.sendHabitat(uuid, call.parameters.pkmName);
          }
        }
      }
    } catch (e) {
      // If not valid JSON, fallback to regex (optional)
      const match = completionResponse.match(/sendStats\("([^"]+)"\)/);
      if (match) {
        return await this.sendStats(uuid, match[1]);
      }
      const matchTipo = completionResponse.match(/sendTipo\("([^"]+)"\)/);
      if (matchTipo) {
        return await this.sendTipo(uuid, matchTipo[1]);
      }
      const matchMov = completionResponse.match(/sendMovimientos\("([^"]+)",\s*\[([^\]]*)\]\)/);
      if (matchMov) {
        const tipos = matchMov[2].split(',').map(s => s.replace(/"/g, '').trim());
        return await this.sendMovimientos(uuid, { pokemon: matchMov[1], tipoMovimientos: tipos });
      }
      const matchHabitat = completionResponse.match(/sendHabitat\("([^"]+)"\)/);
      if (matchHabitat) {
        return await this.sendHabitat(uuid, matchHabitat[1]);
      }
    }
    // 5. Normal response if no function
    return await this.sendMsg(uuid, {
      sender: 'bot',
      parts: [{ type: 'text', content: completionResponse }],
    });
  }

  sendStats(uuid, pkmName) {
    console.log('Fetching stats for Pokémon:', pkmName);
    let lista = this.pokemonService.searchPokemonByName(pkmName) as any;
    console.log('Pokemon list:', lista);
    let pokemon = lista[0].item;
    let stats = pokemon.forms[0].battleStats;

    console.log('Stats for', pkmName, ':', stats);

    if (stats) {
      return this.sendMsg(uuid, {
        sender: 'bot',
        parts: [
          {
            type: 'text',
            content: `Aquí tienes las estadísticas base de ${firstLetterToUpperCase(pokemon.name)}:`,
          },
          { type: 'pokemonStats', content: stats },
          {
            type: 'text',
            content: '\n¿Hay algo más en lo que pueda ayudarte?',
          },
        ],
      });
    } else {
      console.log('No stats found for', pkmName);
      return this.sendMsg(uuid, {
        sender: 'bot',
        parts: [
          { type: 'text', content: 'No tengo información sobre ese Pokémon.' },
        ],
      });
    }
  }

  sendTipo(uuid, pkmName) {
    let lista = this.pokemonService.getPokemonByName(pkmName) as any;
    let pokemon = lista[0].item;
    let tipos = pokemon.forms[0].types;
    if (tipos) {
      return this.sendMsg(uuid, {
        sender: 'bot',
        parts: [
          {
            type: 'text',
            content: `${firstLetterToUpperCase(pokemon.name)} es un Pokémon de tipo ${tipos.join(' / ')}.`,
          },
          {
            type: 'text',
            content: '\n¿Hay algo más en lo que pueda ayudarte?',
          },
        ],
      });
    } else {
      return this.sendMsg(uuid, {
        sender: 'bot',
        parts: [
          { type: 'text', content: 'No tengo información sobre ese Pokémon.' },
        ],
      });
    }
  }

  sendMovimientos(uuid, args) {
    let pkmName = args.pokemon;
    let tipoMovimientos = args.tipoMovimientos as string[];

    let lista = this.pokemonService.getPokemonByName(pkmName) as any;
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

    Object.keys(movimientos).forEach((key) => {
      if (!tipoMovimientos.includes(keyMapping[key])) {
        delete movimientos[key];
      }
    });

    if (movimientos) {
      return this.sendMsg(uuid, {
        sender: 'bot',
        parts: [
          {
            type: 'text',
            content: `Aquí tienes la lista de movimientos de ${firstLetterToUpperCase(pokemon.name)}:`,
          },
          { type: 'pokemonMoves', content: movimientos },
          {
            type: 'text',
            content: '\n¿Hay algo más en lo que pueda ayudarte?',
          },
        ],
      });
    } else {
      return this.sendMsg(uuid, {
        sender: 'bot',
        parts: [
          { type: 'text', content: 'No tengo información sobre ese Pokémon.' },
        ],
      });
    }
  }

  async sendHabitat(uuid, pkmName) {
    /*
    let { biomes, name } =
      await this.pokemonService.getBiomesByPokemonName(pkmName);
    if (biomes && biomes.length > 0) {
      return this.sendMsg(uuid, {
        sender: 'bot',
        parts: [
          {
            type: 'text',
            content: `Los Pokémon de la especie ${name} habitan en los siguientes biomas:`,
          },
          { type: 'biomeList', content: biomes },
          {
            type: 'text',
            content: '\n¿Hay algo más en lo que pueda ayudarte?',
          },
        ],
      });
    } else {
      return this.sendMsg(uuid, {
        sender: 'bot',
        parts: [
          { type: 'text', content: 'No tengo información sobre ese Pokémon.' },
        ],
      });
    }*/
  }
}