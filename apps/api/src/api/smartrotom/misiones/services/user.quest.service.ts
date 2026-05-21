import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import {
  QuestSystemData,
  QuestData,
  IDialogue,
  IQuestCategory,
  NPC,
} from '../types';
import { QUEST_REPOSITORY_TOKEN } from '@api/_utils/repositories/interfaces/repository.token';
import { IQuestRepository } from '../repositories/interfaces/quest.repository.interface';
import { QuestCacheService } from './quest.cache.service';

export interface UserQuestData {
  quests: QuestData[];
  dialogs: IDialogue[];
  categories: IQuestCategory[];
  npcs: NPC[];
}

@Injectable()
export class UserQuestService {
  constructor(
    @Inject(QUEST_REPOSITORY_TOKEN)
    private readonly questRepository: IQuestRepository,
    private readonly questCacheService: QuestCacheService,
  ) {}

  async getUserQuests(uuid: string): Promise<UserQuestData> {
    if (!uuid || uuid.trim() === '') {
      throw new BadRequestException('UUID is required');
    }

    // Get the current quest system data
    const systemData = await this.questCacheService.getQuestSystemData();

    // Get user-specific quest progress
    const userQuestResponse =
      await this.questRepository.fetchUserQuestsFromAPI(uuid);

    // Merge system and user data
    return this.mergeSystemAndUserData(systemData, userQuestResponse);
  }

  private mergeSystemAndUserData(
    systemData: QuestSystemData,
    userQuestResponse: any,
  ): UserQuestData {
    // Create a map of user quest progress
    const userQuestMap = new Map();
    Object.values(userQuestResponse.quests || {}).forEach((quest: any) => {
      userQuestMap.set(quest.id, quest);
    });

    // Merge system quests with user progress
    const mergedQuests = systemData.quests.map((systemQuest) => {
      const userQuest = userQuestMap.get(systemQuest.id);

      if (userQuest) {
        // Merge user progress with system quest data
        return {
          ...systemQuest,
          status: userQuest.status || systemQuest.status,
          objectives: userQuest.objectives || systemQuest.objectives,
          // Preserve any other user-specific data
          ...userQuest,
        };
      }

      return systemQuest;
    });

    return {
      quests: mergedQuests,
      dialogs: systemData.dialogs,
      categories: systemData.categories,
      npcs: systemData.npcs,
    };
  }

  async validateUserExists(uuid: string): Promise<boolean> {
    try {
      await this.questRepository.fetchUserQuestsFromAPI(uuid);
      return true;
    } catch {
      return false;
    }
  }
}
