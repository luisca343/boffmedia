import { QuestData, IDialogue, NPC } from '../../types';

export interface ExternalQuestResponse {
  quests: QuestData[];
  dialogs: IDialogue[];
  categories: number[][];
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
