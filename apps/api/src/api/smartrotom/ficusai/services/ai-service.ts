import { Injectable } from '@nestjs/common';
import { GoogleGenAI, Type } from '@google/genai';
import { FicusMessageContentDto } from '../dto/ficus-message-content.dto';
import { MessagePartType } from '../dto/message-part.dto';
import { MessageSender } from '../enums/message-sender.enum';

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

    const globalContext = `Eres Profesor Ficus, asistente virtual para la región ficticia de Teras en este servidor Pokémon.
      REGLAS CRÍTICAS:

      NUNCA inventes información sobre Pokémon, ubicaciones, estadísticas o movimientos
      SIEMPRE usa las funciones disponibles para obtener datos de Pokémon, incluso para nombres raros como "Bowser"
      Si no tienes función para algo específico, di: "No tengo esa información disponible"
      
      IMPORTANTE: Solo responde al mensaje ACTUAL del usuario. NO hagas llamadas a funciones basadas en mensajes anteriores del contexto.
      El contexto se proporciona solo para entender el flujo de conversación, pero debes responder únicamente al último mensaje del usuario.`;

    const contextText = contextMessages.length > 0 
      ? `Contexto de conversación anterior (solo para referencia, NO respondas a estos mensajes):\n${contextMessages.map(msg => {
          return msg.parts
            .filter(part => part.type === 'text' && typeof part.content === 'string' && part.content.trim() !== '')
            .map(part => part.content)
            .join('\n');
        }).join('\n')}\n\nMensaje ACTUAL del usuario (responde SOLO a este):`
      : 'Mensaje del usuario:';

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

  // New method to generate fallback response using Gemma
  async generateFallbackResponse(
    pokemonName: string, 
    similarPokemon: string[], 
    userMessage: FicusMessageContentDto,
    contextMessages: FicusMessageContentDto[]
  ): Promise<FicusMessageContentDto> {
    await this.initialize();

    const contextText = contextMessages
      .slice(-3) // Only last 3 messages for context
      .map(msg => {
        return msg.parts
          .filter(part => part.type === 'text' && typeof part.content === 'string')
          .map(part => part.content)
          .join(' ');
      })
      .join('\n');

    const userText = userMessage.parts
      .filter(part => part.type === 'text' && typeof part.content === 'string')
      .map(part => part.content)
      .join(' ');

    const fallbackPrompt = `Eres Profesor Ficus, un asistente virtual amigable para la región de Teras.

    Un usuario preguntó sobre "${pokemonName}" pero ese Pokémon no existe en nuestra base de datos de la región de Teras.

    Mensaje del usuario: "${userText}"

    ${similarPokemon.length > 0 ? `Pokémon similares disponibles en Teras: ${similarPokemon.join(', ')}` : 'No encontré Pokémon similares.'}

    Contexto de la conversación:
    ${contextText}

    Responde de manera amigable y útil:
    1. Informa que "${pokemonName}" no está disponible en la región de Teras
    2. ${similarPokemon.length > 0 ? 'Sugiere los Pokémon similares que encontré' : 'Pregunta si se refería a otro Pokémon'}
    3. Ofrecer ayuda alternativa
    4. Mantén un tono profesional pero amigable como Profesor Ficus

    Responde en el mismo idioma que el usuario y mantén la respuesta concisa pero útil.`;

    try {
      const response = await this.gemini.models.generateContent({
        model: 'gemma-3-12b-it',
        contents: fallbackPrompt,
        config: {
          maxOutputTokens: 200,
          temperature: 0.7,
        }
      });

      const responseText = response.text || `Lo siento, no encontré información sobre "${pokemonName}" en la región de Teras. ${similarPokemon.length > 0 ? `¿Te refieres a alguno de estos?: ${similarPokemon.join(', ')}` : '¿Podrías revisar el nombre del Pokémon?'}`;

      return {
        sender: MessageSender.BOT,
        parts: [{
          type: MessagePartType.TEXT,
          content: responseText
        }]
      };
    } catch (error: any) {
      console.error('Error generating fallback response with Gemma:', error);
      
      // Fallback to basic response if Gemma fails
      return {
        sender: MessageSender.BOT,
        parts: [{
          type: MessagePartType.TEXT,
          content: `Lo siento, no encontré información sobre "${pokemonName}" en la región de Teras. ${similarPokemon.length > 0 ? `¿Te refieres a alguno de estos Pokémon?: ${similarPokemon.join(', ')}` : '¿Podrías revisar el nombre del Pokémon?'}`
        }]
      };
    }
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
        description: 'Returns a random Pokémon from the Teras region. Call this when the user asks for a "random Pokémon", "surprise me with a Pokémon", "pick a Pokémon for me", or when they want information about a random Pokémon (like "stats of a random Pokémon", "type of a random Pokémon", etc.). IMPORTANT: Only return information that is provided by this function - never supplement with invented data.',
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
        description: 'Returns comprehensive data about a specific Pokémon. ALWAYS use this function when users ask about a specific Pokémon\'s information. CRITICAL: Only provide information that is returned by this function - never add invented details. Keywords that should trigger this function include: "dónde", "donde", "encontrar", "spawnea", "ubicación", "localización", "habitat", "lugar", "zona", "área", "región", "where", "location", "find", "spawn", or any question about a specific Pokémon.',
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
