import { Injectable } from '@nestjs/common';
import { GoogleGenAI, Type } from '@google/genai';
import { FicusMessageContentDto } from '../dto/ficus-message-content.dto';

@Injectable()
export class AIService {
  private gemini: GoogleGenAI;

  async initialize(): Promise<void> {
    if (!this.gemini) {
      this.gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    }
  }

  async generateResponse(
    userMessage: FicusMessageContentDto, 
    contextMessages: FicusMessageContentDto[]
  ): Promise<any> {
    await this.initialize();

    const globalContext = 'Eres Profesor Ficus, el asistente virtual para la región ficticia de Teras en este servidor Pokémon. Responde como un experto y guía amigable. Cuando el usuario pregunte sobre la ubicación, localización, o dónde encontrar un Pokémon, siempre llama a la función getPokemonData con dataTypes que incluya "habitat".';

    const contextText = contextMessages.map(msg => {
      return msg.parts
        .filter(part => part.type === 'text' && typeof part.content === 'string' && part.content.trim() !== '')
        .map(part => part.content)
        .join('\n');
    }).join('\n');

    const userText = [
      globalContext,
      contextText,
      userMessage.parts
        .filter(part => part.type === 'text' && typeof part.content === 'string' && part.content.trim() !== '')
        .map(part => part.content)
        .join('\n')
    ].filter(Boolean).join('\n');

    const functionDeclarations = this.getFunctionDeclarations();

    const response = await this.gemini.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: userText,
      config: {
        tools: [{ functionDeclarations }]
      }
    });

    return response;
  }

  deduplicateFunctionCalls(functionCalls: any[]): any[] {
    const seen = new Set<string>();
    const unique: any[] = [];

    for (const call of functionCalls) {
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

  private getFunctionDeclarations() {
    return [
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
        description: 'Returns comprehensive data about a specific Pokémon. ALWAYS use this function when users ask about a specific Pokémon\'s location, where to find it, where it spawns, its habitat, or any other information. Keywords that should trigger this function include: "dónde", "donde", "encontrar", "spawnea", "ubicación", "localización", "habitat", "lugar", "zona", "área", "región", "where", "location", "find", "spawn".',
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
              description: 'What information to retrieve. Can include: "type" (types), "stats" (statistics), "moves" (moves), "habitat" (habitat info, location, where it can be found, spawn locations). For location/habitat questions, ALWAYS include "habitat" in this array. If not specified, returns all available data.'
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
  }
}