import { Injectable } from '@nestjs/common';
import { QuestRepository } from '@repositories/smartrotom/quest.repository';
import { QuestCacheService } from './quest.cache.service';
import { QuestSystemData, QuestData, IDialogue, NPC } from '../types';

export interface UserQuestData {
  quests: QuestData[];
  dialogs: IDialogue[];
  categories: any[];
  npcs: NPC[];
}

@Injectable()
export class UserQuestService {
  constructor(
    private readonly questRepository: QuestRepository,
    private readonly questCacheService: QuestCacheService,
  ) {}

  async getUserQuests(uuid: string): Promise<UserQuestData> {
    if (!uuid || uuid.trim() === '') {
      throw new Error('User UUID is required');
    }

    // Get the current quest system data
    const systemData = await this.questCacheService.getQuestSystemData();
    
    try {
      // Fetch user-specific quest progress
      const userQuestResponse = await this.questRepository.fetchUserQuestsFromAPI(uuid);
      
      if (!this.questRepository.validateUserQuestData(userQuestResponse)) {
        throw new Error('Invalid user quest data received from API');
      }

      // Merge system data with user progress
      const mergedData = this.mergeSystemAndUserData(systemData, userQuestResponse);
      
      return mergedData;
    } catch (error) {
      console.error(`Failed to get user quests for ${uuid}:`, error);
      
      // Fallback: return system data without user progress
      console.warn(`Returning default quest data for user ${uuid} due to API failure`);
      return {
        quests: systemData.quests,
        dialogs: systemData.dialogs,
        categories: systemData.categories,
        npcs: systemData.npcs
      };
    }
  }

  private mergeSystemAndUserData(
    systemData: QuestSystemData, 
    userQuestResponse: any
  ): UserQuestData {
    const dialogsToLoad: number[] = [];
    
    // Convert system quests object to array if needed
    const systemQuests = Array.isArray(systemData.quests) 
      ? systemData.quests 
      : Object.values(systemData.quests) as QuestData[];

    // Merge quest data with user progress
    const questsData = systemQuests.map((systemQuest) => {
      const userQuest = userQuestResponse.quests[systemQuest.id];

      // Collect dialog IDs to load
      if (userQuest?.dialogId && !dialogsToLoad.includes(userQuest.dialogId)) {
        dialogsToLoad.push(userQuest.dialogId);
      }

      // Collect required dialog IDs
      systemQuest.requirements.requiredDialogs.forEach((dialogId) => {
        if (!dialogsToLoad.includes(dialogId)) {
          dialogsToLoad.push(dialogId);
        }
      });

      // Merge user progress with system quest
      if (userQuest) {
        return { ...systemQuest, ...userQuest };
      }

      return systemQuest;
    });

    // Get dialogs for the collected IDs
    const dialogsArray = Array.isArray(systemData.dialogs) 
      ? systemData.dialogs 
      : Object.values(systemData.dialogs);

    const relevantDialogs = dialogsToLoad
      .map(dialogId => dialogsArray.find(dialog => (dialog as IDialogue).id === dialogId))
      .filter(dialog => dialog !== undefined) as IDialogue[];

    return {
      quests: questsData,
      dialogs: relevantDialogs,
      categories: systemData.categories,
      npcs: systemData.npcs
    };
  }

  async validateUserExists(uuid: string): Promise<boolean> {
    try {
      await this.getUserQuests(uuid);
      return true;
    } catch (error) {
      console.error(`User validation failed for ${uuid}:`, error);
      return false;
    }
  }
}