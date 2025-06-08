import { QuestSystemData, QuestData, IDialogue, IQuestCategory, NPC } from '@api/smartrotom/misiones/types';
import { Injectable } from '@nestjs/common';
import axios, { AxiosResponse } from 'axios';

export interface ExternalQuestResponse {
  quests: { [key: string]: QuestData };
  dialogs: { [key: string]: IDialogue };
  categories: { [key: string]: IQuestCategory };
  npcs?: NPC[];
}

export interface UserQuestResponse {
  quests: { [key: string]: QuestData };
}

@Injectable()
export class QuestRepository {
  private readonly QUEST_API_BASE_URL = 'http://148.251.3.244:34370';

  // ==================== EXTERNAL API OPERATIONS ====================

  async fetchAllQuestsFromAPI(): Promise<ExternalQuestResponse> {
    try {
      const response: AxiosResponse<any> = await axios.get(
        `${this.QUEST_API_BASE_URL}/quests`,
        {
          timeout: 10000, // 10 second timeout
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      // Check if response is wrapped in a success object
      if (response.data && response.data.success && response.data.data) {
        return response.data.data;
      }

      // Return raw data if not wrapped
      return response.data;
    } catch (error) {
      console.error('Failed to fetch quests from external API:', error);
      throw new Error(`External quest API request failed: ${error.message}`);
    }
  }

  // TODO: Fix this method to handle user quests properly
  async fetchUserQuestsFromAPI(uuid: string): Promise<UserQuestResponse> {
    if (!uuid || uuid.trim() === '') {
      throw new Error('UUID is required for fetching user quests');
    }

    try {
      const response: AxiosResponse<any> = await axios.post(
        `${this.QUEST_API_BASE_URL}/quests`,
        { uuid },
        {
          timeout: 10000, // 10 second timeout
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      // Check if response is wrapped in a success object
      if (response.data && response.data.success && response.data.data) {
        return response.data.data;
      }

      // Return raw data if not wrapped
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch user quests for UUID ${uuid}:`, error);
      throw new Error(`User quest API request failed: ${error.message}`);
    }
  }

  // ==================== DATA VALIDATION ====================

  validateQuestSystemData(data: ExternalQuestResponse): boolean {
    if (!data || typeof data !== 'object') {
      return false;
    }

    if (!data.quests || typeof data.quests !== 'object') {
      return false;
    }

    if (!data.dialogs || typeof data.dialogs !== 'object') {
      return false;
    }

    if (!data.categories || typeof data.categories !== 'object') {
      return false;
    }

    return true;
  }

  validateUserQuestData(data: UserQuestResponse): boolean {
    if (!data || typeof data !== 'object') {
      return false;
    }

    if (!data.quests || typeof data.quests !== 'object') {
      return false;
    }

    return true;
  }

  // ==================== DATA TRANSFORMATION ====================

  transformExternalDataToSystemData(externalData: ExternalQuestResponse, npcs: NPC[] = []): QuestSystemData {
    const quests = Object.values(externalData.quests);
    const dialogs = Object.values(externalData.dialogs);
    const categories = Object.values(externalData.categories);

    return {
      quests,
      dialogs,
      categories,
      npcs: npcs || externalData.npcs || []
    };
  }

  // ==================== HEALTH CHECK ====================

  async checkAPIHealth(): Promise<{ healthy: boolean; latency?: number; error?: string }> {
    const startTime = Date.now();
    
    try {
      const response = await axios.get(`${this.QUEST_API_BASE_URL}/health`, {
        timeout: 5000,
        validateStatus: (status) => status < 500 // Accept 4xx as "healthy" but not 5xx
      });
      
      const latency = Date.now() - startTime;
      return {
        healthy: response.status < 400,
        latency
      };
    } catch (error) {
      return {
        healthy: false,
        latency: Date.now() - startTime,
        error: error.message
      };
    }
  }
}