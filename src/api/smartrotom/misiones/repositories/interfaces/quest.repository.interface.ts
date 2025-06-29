import { QuestData, IDialogue, IQuestCategory, NPC, QuestSystemData } from '../../types';

export interface ExternalQuestResponse {
  quests: { [key: string]: QuestData };
  dialogs: { [key: string]: IDialogue };
  categories: { [key: string]: IQuestCategory };
  npcs?: NPC[];
}

export interface UserQuestResponse {
  quests: { [key: string]: QuestData };
}

export interface IQuestRepository {
  // ==================== EXTERNAL API OPERATIONS ====================
  fetchAllQuestsFromAPI(): Promise<ExternalQuestResponse>;
  fetchUserQuestsFromAPI(uuid: string): Promise<UserQuestResponse>;
  
  // ==================== VALIDATION ====================
  validateQuestData(questData: any): boolean;
  validateDialogueData(dialogueData: any): boolean;
  validateNPCData(npcData: any): boolean;
}