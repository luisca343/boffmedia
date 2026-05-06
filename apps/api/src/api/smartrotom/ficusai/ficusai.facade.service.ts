import { Injectable } from '@nestjs/common';
import { MessageService } from './services/messages.service';
import { AIService } from './services/ai-service';
import { PokemonDataService } from './services/pokemon-data.service';
import { FicusMessageContentDto } from './dto/ficus-message-content.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { GetMessagesDto } from './dto/get-messages.dto';
import { MessageSender } from './enums/message-sender.enum';
import { firstLetterToUpperCase } from '@/_utils/stringUtils';
import { MessagePartType } from './dto/message-part.dto';
import { PokemonNotFoundError } from './errors/pokemon-not-found.error';

@Injectable()
export class FicusAIFacadeService {
  // Store current message and context for fallback responses
  private currentUserMessage: FicusMessageContentDto;
  private currentContextMessages: FicusMessageContentDto[];

  constructor(
    private readonly messageService: MessageService,
    private readonly aiService: AIService,
    private readonly pokemonDataService: PokemonDataService,
  ) {}

  // ==================== MESSAGE MANAGEMENT ====================

  async getMessages(getMessagesDto: GetMessagesDto): Promise<FicusMessageContentDto[]> {
    return this.messageService.getMessages(getMessagesDto.uuid, getMessagesDto.limit);
  }

  async initializeChat(uuid: string): Promise<FicusMessageContentDto> {
    return this.messageService.createWelcomeMessage(uuid);
  }

  async deleteUserMessages(uuid: string): Promise<{ success: boolean }> {
    const result = await this.messageService.deleteUserMessages(uuid);
    return { success: result };
  }

  // ==================== CHAT INTERACTION ====================

  async sendMessage(sendMessageDto: SendMessageDto): Promise<FicusMessageContentDto> {
    const { uuid, mensaje, server } = sendMessageDto;

    // Store user message if it's from user
    if (mensaje.sender === MessageSender.USER) {
      await this.messageService.storeMessage(uuid, mensaje);
    }

    // Get AI response
    const aiResponse = await this.generateAIResponse(uuid, mensaje);
    
    // Store and return the AI response
    await this.messageService.storeMessage(uuid, aiResponse);
    return aiResponse;
  }

  // ==================== AI RESPONSE GENERATION ====================

  private async generateAIResponse(uuid: string, userMessage: FicusMessageContentDto): Promise<FicusMessageContentDto> {
    try {
      // Store current message and context for potential fallback responses
      this.currentUserMessage = userMessage;
      this.currentContextMessages = await this.messageService.getMessagesForContext(uuid, 5);
      
      // Generate AI response
      const geminiResponse = await this.aiService.generateResponse(userMessage, this.currentContextMessages);
      
      console.log('================= Gemini Response ================');
      console.log(geminiResponse);

      // Process function calls if present
      if (geminiResponse.functionCalls && geminiResponse.functionCalls.length > 0) {
        console.log('Function calls found in Gemini response:', geminiResponse.functionCalls);
        
        return await this.processFunctionCalls(geminiResponse.functionCalls, geminiResponse.text);
      } else {
        // No function calls, return simple text response
        console.log('No function calls found in Gemini response. Sending raw text response.');
        return {
          sender: MessageSender.BOT,
          parts: [{ 
            type: MessagePartType.TEXT,
            content: geminiResponse.text || 'No se pudo generar una respuesta.' 
          }],
        };
      }
    } catch (error: any) {
      console.error('Error generating AI response:', error);
      return {
        sender: MessageSender.BOT,
        parts: [{ 
          type: MessagePartType.TEXT,
          content: 'Lo siento, ocurrió un error al procesar tu mensaje. Por favor, inténtalo de nuevo.' 
        }],
      };
    }
  }

  // ==================== FUNCTION CALL PROCESSING ====================

  private async processFunctionCalls(functionCalls: any[], responseText?: string): Promise<FicusMessageContentDto> {
    const allParts: { type: string; content: any }[] = [];
    const requestedTypes: Set<string> = new Set();
    const pokemonNames: Set<string> = new Set();

    // Deduplicate function calls
    const uniqueCalls = this.aiService.deduplicateFunctionCalls(functionCalls);
    console.log(`[Deduplication] Original calls: ${functionCalls.length}, Unique calls: ${uniqueCalls.length}`);

    // Handle multiple random Pokemon calls with shared Pokemon
    const sharedRandomPokemon = await this.getSharedRandomPokemonIfNeeded(uniqueCalls);

    // Process each function call
    for (const call of uniqueCalls) {
      console.log(`Processing function call: ${call.name} with args:`, call.args);
      
      try {
        const functionParts = await this.executeFunctionCall(call, sharedRandomPokemon);
        allParts.push(...functionParts);

        // Track requested types and Pokemon names for intro text
        this.trackRequestedData(call, requestedTypes, pokemonNames, functionParts);
      } catch (error: any) {
        if (error instanceof PokemonNotFoundError) {
          console.log(`Handling Pokémon not found: ${error.pokemonName}`);
          
          // Generate intelligent response using Gemma
          const fallbackResponse = await this.aiService.generateFallbackResponse(
            error.pokemonName,
            error.similarPokemon,
            this.currentUserMessage,
            this.currentContextMessages
          );
          
          // Return the fallback response directly
          return fallbackResponse;
        } else {
          console.error('Error executing function call:', error);
          allParts.push({
            type: MessagePartType.TEXT,
            content: 'Lo siento, ocurrió un error al procesar tu solicitud.'
          });
        }
      }
    }

    // Build final response
    return this.buildFinalResponse(allParts, requestedTypes, pokemonNames, responseText);
  }

  private async getSharedRandomPokemonIfNeeded(uniqueCalls: any[]): Promise<any> {
    const randomPokemonCalls = uniqueCalls.filter(call => call.name === 'getRandomPokemon');
    
    if (randomPokemonCalls.length > 1) {
      const randomResult = this.pokemonDataService.getRandomPokemon(['basic']);
      if (randomResult.pokemon) {
        console.log(`[Multiple Random Calls] Selected shared random Pokémon: ${randomResult.pokemon.name} for ${randomPokemonCalls.length} calls`);
        return randomResult.pokemon;
      }
    }
    
    return null;
  }

  private async executeFunctionCall(call: any, sharedRandomPokemon?: any): Promise<{ type: string; content: any }[]> {
    switch (call.name) {
      case 'countPokemon':
        return this.pokemonDataService.getPokemonCount();
        
      case 'getRandomPokemon':
        const dataTypes = Array.isArray(call.args.dataTypes) && call.args.dataTypes.length > 0 
          ? call.args.dataTypes 
          : ['basic'];
        
        if (sharedRandomPokemon) {
          const parts = this.pokemonDataService.getRandomPokemon(dataTypes);
          // Override with shared Pokemon
          return parts.parts.map(part => ({
            ...part,
            content: part.content?.pokemonName ? 
              { ...part.content, pokemonName: sharedRandomPokemon.name } : 
              part.content
          }));
        } else {
          const result = this.pokemonDataService.getRandomPokemon(dataTypes);
          return result.parts;
        }
        
      case 'getPokemonData':
        if (typeof call.args.pokemon === 'string') {
          const dataTypes = Array.isArray(call.args.dataTypes) && call.args.dataTypes.length > 0 
            ? call.args.dataTypes 
            : ['type', 'stats', 'moves', 'habitat'];
          const moveTypes = Array.isArray(call.args.moveTypes) ? call.args.moveTypes : [];
          
          // Try to get Pokemon data
          const pokemonData = this.pokemonDataService.getPokemonDataParts(call.args.pokemon, dataTypes, moveTypes);
          
          // If Pokémon not found, throw error to trigger fallback response
          if (pokemonData === null) {
            console.log(`Pokémon "${call.args.pokemon}" not found, will generate fallback response with Gemma`);
            
            // Get similar Pokémon suggestions
            const similarPokemon = this.pokemonDataService.getSimilarPokemonNames(call.args.pokemon, 3);
            
            // Throw custom error to be caught by processFunctionCalls
            throw new PokemonNotFoundError(call.args.pokemon, similarPokemon);
          }
          
          return pokemonData;
        } else {
          console.error('Invalid pokemon argument type for getPokemonData:', call.args.pokemon);
          return [{ 
            type: MessagePartType.TEXT, 
            content: 'Lo siento, el nombre del Pokémon no es válido.' 
          }];
        }
        
      default:
        console.log(`Unhandled function call: ${call.name}`);
        return [{ 
          type: MessagePartType.TEXT, 
          content: 'Lo siento, no puedo procesar esa solicitud en este momento.' 
        }];
    }
  }

  private trackRequestedData(
    call: any, 
    requestedTypes: Set<string>, 
    pokemonNames: Set<string>, 
    functionParts: { type: string; content: any }[]
  ): void {
    // Track requested types
    if (call.name === 'countPokemon') {
      requestedTypes.add('conteo');
    } else if (call.name === 'getRandomPokemon' && call.args.dataTypes) {
      call.args.dataTypes.forEach(type => requestedTypes.add(type));
    } else if (call.name === 'getPokemonData') {
      if (call.args.dataTypes) {
        call.args.dataTypes.forEach(type => requestedTypes.add(type));
      }
      if (call.args.pokemon) {
        pokemonNames.add(call.args.pokemon);
      }
    }

    // Extract Pokemon names from function results
    functionParts.forEach(part => {
      if (part.content?.pokemonName) {
        pokemonNames.add(part.content.pokemonName);
      }
    });
  }

  private buildFinalResponse(
    allParts: { type: string; content: any }[], 
    requestedTypes: Set<string>, 
    pokemonNames: Set<string>,
    responseText?: string
  ): FicusMessageContentDto {
    if (allParts.length === 0) {
      return {
        sender: MessageSender.BOT,
        parts: [{ 
          type: MessagePartType.TEXT,
          content: responseText || 'No se pudo obtener información relevante.' 
        }],
      };
    }

    // Add intro text for specific data requests
    const showIntro = ['type', 'stats', 'moves', 'habitat'].some(type => requestedTypes.has(type));
    if (showIntro) {
      const namesList = Array.from(pokemonNames)
        .map(name => firstLetterToUpperCase(name))
        .join(', ');
      
      const intro = namesList 
        ? `Aquí tienes la información solicitada para ${namesList}: \n\n`
        : `Aquí tienes la información solicitada:\n\n`;
      
      allParts.unshift({ type: MessagePartType.TEXT, content: intro });
    }

    // Add closing text
    allParts.push({ 
      type: MessagePartType.TEXT, 
      content: '\n¿Hay algo más en lo que pueda ayudarte?' 
    });

    return {
      sender: MessageSender.BOT,
      parts: allParts as import('./dto/message-part.dto').MessagePartDto[]
    };
  }

  // ==================== UTILITY METHODS ====================

  async getUserMessageCount(uuid: string): Promise<number> {
    return this.messageService.getUserMessageCount(uuid);
  }
}