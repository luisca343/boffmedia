import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import {
  ExternalQuestResponse,
  IQuestRepository,
  NpcCatalogResponse,
  UserQuestResponse,
} from './interfaces/quest.repository.interface';

@Injectable()
export class QuestRepository implements IQuestRepository {
  private readonly logger = new Logger(QuestRepository.name);
  private readonly baseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl =
      this.configService.get<string>('WINGULL_API') ||
      'http://148.251.3.244:34370';
  }

  // ==================== EXTERNAL API OPERATIONS ====================

  async fetchAllQuestsFromAPI(): Promise<ExternalQuestResponse> {
    try {
      this.logger.log('Fetching all quests from external API');

      const response = await axios.get(`${this.baseUrl}/quests/all`, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'FicusLabs-QuestService/1.0',
        },
      });

      if (!response.data) {
        throw new Error('No data received from external API');
      }

      const questResponse: ExternalQuestResponse = {
        quests: response.data.data.quests || [],
        dialogs: response.data.data.dialogs || [],
        categories: response.data.data.categories || [],
        npcs: response.data.data.npcs || [],
      };

      this.logger.log(
        `Successfully fetched ${questResponse.quests.length} quests, ${questResponse.dialogs.length} dialogs, ${questResponse.categories.length} categories, ${questResponse.npcs!.length} NPCs`,
      );
      return questResponse;
    } catch (error: any) {
      this.logger.error(
        'Failed to fetch quests from external API',
        error.stack,
      );
      throw new BadRequestException(
        `Failed to fetch quest data: ${error.message}`,
      );
    }
  }

  async fetchUserQuestsFromAPI(uuid: string): Promise<UserQuestResponse> {
    if (!uuid || uuid.trim() === '') {
      throw new BadRequestException('UUID is required');
    }

    try {
      this.logger.log(`Fetching user quests for UUID: ${uuid}`);

      const response = await axios.post(
        `${this.baseUrl}/quests`,
        { uuid },
        {
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'FicusLabs-QuestService/1.0',
          },
        },
      );

      if (!response.data) {
        throw new Error('No user quest data received from external API');
      }

      const userQuestResponse: UserQuestResponse = {
        quests: response.data.data.quests || {},
      };

      this.logger.log(`Successfully fetched user quests for ${uuid}`);
      return userQuestResponse;
    } catch (error: any) {
      this.logger.error(`Failed to fetch user quests for ${uuid}`, error.stack);
      throw new BadRequestException(
        `Failed to fetch user quest data: ${error.message}`,
      );
    }
  }

  async fetchNpcCatalogFromAPI(): Promise<NpcCatalogResponse> {
    try {
      this.logger.log('Fetching NPC catalog from external API');

      const response = await axios.get(`${this.baseUrl}/npcCatalog`, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'FicusLabs-QuestService/1.0',
        },
      });

      if (!response.data) {
        throw new Error('No data received from external API');
      }

      return (response.data.data ?? response.data) as NpcCatalogResponse;
    } catch (error: any) {
      this.logger.error(
        'Failed to fetch NPC catalog from external API',
        error.stack,
      );
      throw new BadRequestException(
        `Failed to fetch NPC catalog: ${error.message}`,
      );
    }
  }

  // ==================== VALIDATION ====================

  validateQuestData(questData: any): boolean {
    if (!questData || typeof questData !== 'object') return false;

    return !!(
      questData.id &&
      questData.name &&
      questData.logText &&
      Array.isArray(questData.objectives) &&
      questData.requirements
    );
  }

  validateDialogueData(dialogueData: any): boolean {
    if (!dialogueData || typeof dialogueData !== 'object') return false;

    return !!(
      dialogueData.id &&
      dialogueData.name &&
      dialogueData.text &&
      dialogueData.questId !== undefined
    );
  }

  validateNPCData(npcData: any): boolean {
    if (!npcData || typeof npcData !== 'object') return false;

    return !!(
      npcData.id &&
      npcData.name &&
      npcData.text &&
      npcData.questId !== undefined
    );
  }
}
