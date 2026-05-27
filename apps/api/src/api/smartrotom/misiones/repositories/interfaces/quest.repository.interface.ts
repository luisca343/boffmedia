import { QuestData, IDialogue, IQuestCategory, NPC } from '../../types';

export interface ExternalQuestResponse {
  quests: { [key: string]: QuestData };
  dialogs: { [key: string]: IDialogue };
  categories: { [key: string]: IQuestCategory };
  npcs?: NPC[];
}

export interface UserQuestResponse {
  quests: { [key: string]: QuestData };
}

export interface NpcCatalogEntry {
  uuid: string;
  [key: string]: any;
}

export interface NpcCatalogResponse {
  [dialogId: string]: NpcCatalogEntry[];
}

export interface IQuestRepository {
  // ==================== EXTERNAL API OPERATIONS ====================
  fetchAllQuestsFromAPI(): Promise<ExternalQuestResponse>;
  fetchUserQuestsFromAPI(uuid: string): Promise<UserQuestResponse>;
  fetchNpcCatalogFromAPI(): Promise<NpcCatalogResponse>;

  // ==================== VALIDATION ====================
  validateQuestData(questData: any): boolean;
  validateDialogueData(dialogueData: any): boolean;
  validateNPCData(npcData: any): boolean;
}
