import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { IDialogue, IQuestCategory, QuestData } from './types';

@Injectable()
export class MisionesService {
  private readonly logger = new Logger(MisionesService.name);

  private quests: QuestData[] = null;
  private dialogs: IDialogue[] = null;
  private categories: IQuestCategory[] = null;
  private npcs: { name: string; dialogId: number; skin: string }[] = null;

  private lastUpdate = 0;

  async getAllQuests(force: number): Promise<any> {
    if (!this.quests && !force) return this.getAllQuests(1);
    if (this.quests && Date.now() - this.lastUpdate < 4 * 60 * 60 * 1000 && !force) {
      return {
        quests: this.quests,
        dialogs: this.dialogs,
        categories: this.categories,
        npcs: this.npcs,
      };
    }
    try {
      const response = await axios.get('http://148.251.3.244:34370/quests');
      const data = response.data;
      this.quests = data.quests;
      this.dialogs = data.dialogs;
      this.categories = data.categories;
      this.lastUpdate = Date.now();
      return data;
    } catch (error) {
      this.logger.error('Error fetching quests', error);
      throw new Error('Error fetching quests');
    }
  }

  async updateNPCs(npcs: any): Promise<{ status: string }> {
    this.npcs = npcs;
    return { status: 'ok' };
  }

  async getQuestsForUser(uuid: string): Promise<any> {
    const currentData = await this.getAllQuests(0);
    try {
      const response = await fetch('http://148.251.3.244:34370/quests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ uuid }),
      });

      const userQuestData = await response.json();
      const dialogsToLoad = [];

      const questsData = Object.keys(currentData.quests).map((questId) => {
        const savedQuest = currentData.quests[questId] as QuestData;
        const userQuest = userQuestData.quests[questId];

        if (!dialogsToLoad.includes(userQuest.dialogId)) {
          dialogsToLoad.push(userQuest.dialogId);
        }

        savedQuest.requirements.requiredDialogs.forEach((dialogId) => {
          if (!dialogsToLoad.includes(dialogId)) {
            dialogsToLoad.push(dialogId);
          }
        });

        if (userQuest) {
          return { ...savedQuest, ...userQuest };
        }

        return savedQuest;
      });

      return {
        quests: questsData,
        dialogs: dialogsToLoad.map((dialogId) => currentData.dialogs[dialogId]),
        categories: currentData.categories,
        npcs: this.npcs,
      };
    } catch (error) {
      this.logger.error('Error fetching quests for user', error);
      throw new Error('Error fetching quests for user');
    }
  }
}