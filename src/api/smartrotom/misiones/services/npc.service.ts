import { Injectable } from '@nestjs/common';
import { QuestCacheService } from './quest.cache.service';
import { NPC } from '../types';

export interface NPCUpdateRequest {
  npcs: NPC[];
}

export interface NPCUpdateResponse {
  status: string;
  updated: number;
  timestamp: Date;
}

@Injectable()
export class NPCService {
  constructor(
    private readonly questCacheService: QuestCacheService,
  ) {}

  async updateNPCs(updateRequest: NPCUpdateRequest): Promise<NPCUpdateResponse> {
    if (!updateRequest || !Array.isArray(updateRequest.npcs)) {
      throw new Error('Invalid NPC update request: npcs array is required');
    }

    try {
      // Validate NPC data structure
      const validatedNPCs = this.validateAndCleanNPCs(updateRequest.npcs);
      
      // Update NPCs in cache
      this.questCacheService.updateNPCs(validatedNPCs);

      return {
        status: 'ok',
        updated: validatedNPCs.length,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Failed to update NPCs:', error);
      throw new Error(`NPC update failed: ${error.message}`);
    }
  }

  async getAllNPCs(): Promise<NPC[]> {
    try {
      const systemData = await this.questCacheService.getQuestSystemData();
      return systemData.npcs || [];
    } catch (error) {
      console.error('Failed to get NPCs:', error);
      throw new Error(`Failed to retrieve NPCs: ${error.message}`);
    }
  }

  async getNPCById(npcId: number): Promise<NPC | null> {
    try {
      const npcs = await this.getAllNPCs();
      return npcs.find(npc => npc.id === npcId) || null;
    } catch (error) {
      console.error(`Failed to get NPC ${npcId}:`, error);
      return null;
    }
  }

  async getNPCsByQuestId(questId: number): Promise<NPC[]> {
    try {
      const npcs = await this.getAllNPCs();
      return npcs.filter(npc => npc.questId === questId);
    } catch (error) {
      console.error(`Failed to get NPCs for quest ${questId}:`, error);
      return [];
    }
  }

  private validateAndCleanNPCs(npcs: any[]): NPC[] {
    return npcs
      .filter(npc => this.isValidNPC(npc))
      .map(npc => this.cleanNPCData(npc));
  }

  private isValidNPC(npc: any): boolean {
    if (!npc || typeof npc !== 'object') return false;
    if (typeof npc.id !== 'number') return false;
    if (!npc.name || typeof npc.name !== 'string') return false;
    
    return true;
  }

  private cleanNPCData(npc: any): NPC {
    return {
      id: Number(npc.id),
      name: String(npc.name).trim(),
      text: npc.text ? String(npc.text).trim() : '',
      questId: npc.questId ? Number(npc.questId) : 0,
      requirements: npc.requirements || {
        available: true,
        requiredQuests: [],
        requiredDialogs: [],
        requiredLevel: 0,
        requiredTime: 0,
        factionRequirements: [],
        scoreboardRequirements: []
      }
    };
  }
}