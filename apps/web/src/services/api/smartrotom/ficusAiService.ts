import { rotomGET, rotomPOST, rotomDELETE, ApiResponse } from '@/services/boffAPI';
import { 
  FicusAiHealthEntity,
  FicusAiUserStatsEntity,
  FicusMessageContentDto, 
  SendMessageDto, 
  SuccessResponse,
  MessageSender
} from '@boffmedia/shared';

// Define our own message part interface without the enum
export interface MessagePart {
  type: 'text' | 'pokemonData' | 'biomeList' | 'randomPokemon' | 'pokemonCount';
  content: any;
}

// Define our own message content interface
export interface FicusMessageContent {
  sender: 'user' | 'bot';
  parts: MessagePart[];
}

export interface UserStats extends FicusAiUserStatsEntity {}

/** @deprecated use FicusAiHealthEntity from @boffmedia/shared */
export type HealthStatus = FicusAiHealthEntity;

export class FicusAIService {
  /**
   * Get chat messages for a user
   */
  static getMessages(params: any): Promise<ApiResponse<FicusMessageContentDto[]>> {
    const queryParams = new URLSearchParams({
      uuid: params.uuid,
      ...(params.limit && { limit: params.limit.toString() })
    });
    
    return rotomGET<FicusMessageContentDto[]>(`/ficusai/messages?${queryParams}`);
  }

  /**
   * Send a message to the AI assistant
   */
  static sendMessage(sendMessageDto: SendMessageDto): Promise<ApiResponse<FicusMessageContentDto>> {
    return rotomPOST<FicusMessageContentDto>('/ficusai/send', sendMessageDto);
  }

  /**
   * Initialize chat for a user (create welcome message)
   */
  static initializeChat(uuid: string): Promise<ApiResponse<FicusMessageContentDto>> {
    return rotomPOST<FicusMessageContentDto>('/ficusai/initialize', { uuid });
  }

  /**
   * Delete all messages for a user
   */
  static deleteUserMessages(uuid: string): Promise<ApiResponse<SuccessResponse>> {
    const queryParams = new URLSearchParams({ uuid });
    return rotomDELETE<SuccessResponse>(`/ficusai/messages?${queryParams}`);
  }

  /**
   * Get user chat statistics
   */
  static getUserStats(uuid: string): Promise<ApiResponse<FicusAiUserStatsEntity>> {
    const queryParams = new URLSearchParams({ uuid });
    return rotomGET<FicusAiUserStatsEntity>(`/ficusai/stats?${queryParams}`);
  }

  /**
   * Health check for FicusAI service
   */
  static healthCheck(): Promise<ApiResponse<FicusAiHealthEntity>> {
    return rotomGET<FicusAiHealthEntity>('/ficusai/health');
  }

  // ==================== CONVENIENCE METHODS ====================

  /**
   * Send a simple text message to the AI
   */
  static sendTextMessage(uuid: string, text: string, server: string = 'teras'): Promise<ApiResponse<FicusMessageContentDto>> {
    const sendMessageDto: SendMessageDto = {
      uuid,
      server,
      mensaje: {
        sender: 'user' as any,
        parts: [
          {
            type: 'text' as any,
            content: text
          } as any
        ]
      }
    };

    return this.sendMessage(sendMessageDto);
  }

  /**
   * Get recent messages with a default limit
   */
  static getRecentMessages(uuid: string, limit: number = 20): Promise<ApiResponse<FicusMessageContentDto[]>> {
    return this.getMessages({ uuid, limit });
  }

  /**
   * Check if user has chat history
   */
  static async hasHistory(uuid: string): Promise<boolean> {
    try {
      const response = await this.getUserStats(uuid);
      return response.data?.hasHistory || false;
    } catch (error) {
      console.error('Error checking chat history:', error);
      return false;
    }
  }

  /**
   * Initialize chat if user has no history
   */
  static async initializeIfNeeded(uuid: string): Promise<FicusMessageContentDto | null> {
    try {
      const hasHistory = await this.hasHistory(uuid);
      
      if (!hasHistory) {
        const response = await this.initializeChat(uuid);
        return response.data || null;
      }
      
      return null;
    } catch (error) {
      console.error('Error initializing chat:', error);
      return null;
    }
  }

  /**
   * Clear chat history and reinitialize
   */
  static async resetChat(uuid: string): Promise<FicusMessageContentDto | null> {
    try {
      // Delete existing messages
      await this.deleteUserMessages(uuid);
      
      // Initialize with welcome message
      const response = await this.initializeChat(uuid);
      return response.data || null;
    } catch (error) {
      console.error('Error resetting chat:', error);
      return null;
    }
  }

  // ==================== MESSAGE BUILDERS ====================

  /**
   * Create a user message object
   */
  static createUserMessage(text: string): FicusMessageContent {
    return {
      sender: 'user',
      parts: [
        {
          type: 'text',
          content: text
        }
      ]
    };
  }

  /**
   * Create a bot message object
   */
  static createBotMessage(text: string): FicusMessageContent {
    return {
      sender: 'bot',
      parts: [
        {
          type: 'text',
          content: text
        }
      ]
    };
  }

  /**
   * Create a complex message with multiple parts
   */
  static createComplexMessage(sender: 'user' | 'bot', parts: MessagePart[]): FicusMessageContent {
    return {
      sender,
      parts
    };
  }

  /**
   * Create a complete Pokemon message
   */
  static createCompletePokemonMessage(pokemonData: {
    pokemonName: string;
    types?: string[];
    stats?: any;
    moves?: Record<string, any>;
    habitat?: string[];
  }): FicusMessageContent {
    return {
      sender: 'bot',
      parts: [
        {
          type: 'pokemonData',
          content: pokemonData
        }
      ]
    };
  }
}