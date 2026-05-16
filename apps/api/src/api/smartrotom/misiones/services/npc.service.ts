import { Injectable, BadRequestException } from '@nestjs/common';
import { NPC } from '../types';
import { QuestCacheService } from './quest.cache.service';
import { UpdateNPCsDto } from '../dto/update-npcs.dto';

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
  constructor(private readonly questCacheService: QuestCacheService) {}

  async updateNPCs(updateRequest: UpdateNPCsDto): Promise<NPCUpdateResponse> {
    if (!updateRequest.npcs || !Array.isArray(updateRequest.npcs)) {
      throw new BadRequestException('NPCs array is required');
    }

    // Validate and clean NPC data
    const validNPCs = this.validateAndCleanNPCs(updateRequest.npcs);

    if (validNPCs.length === 0) {
      throw new BadRequestException('No valid NPCs provided');
    }

    // Update the cache
    this.questCacheService.updateNPCs(validNPCs);

    return {
      status: 'ok',
      updated: validNPCs.length,
      timestamp: new Date(),
    };
  }

  async getAllNPCs(): Promise<NPC[]> {
    const questData = await this.questCacheService.getQuestSystemData();
    return questData.npcs;
  }

  async getNPCById(npcId: number): Promise<NPC | null> {
    const npcs = await this.getAllNPCs();
    return npcs.find((npc) => npc.id === npcId) || null;
  }

  async getNPCsByQuestId(questId: number): Promise<NPC[]> {
    const npcs = await this.getAllNPCs();
    return npcs.filter((npc) => npc.questId === questId);
  }

  private validateAndCleanNPCs(npcs: any[]): NPC[] {
    return npcs
      .filter((npc) => this.isValidNPC(npc))
      .map((npc) => this.cleanNPCData(npc));
  }

  private isValidNPC(npc: any): boolean {
    return !!(
      npc &&
      typeof npc.id === 'number' &&
      typeof npc.name === 'string' &&
      npc.name.trim() !== '' &&
      typeof npc.text === 'string' &&
      typeof npc.questId === 'number'
    );
  }

  private cleanNPCData(npc: any): NPC {
    return {
      id: Number(npc.id),
      name: String(npc.name).trim(),
      text: String(npc.text),
      questId: Number(npc.questId),
      requirements: npc.requirements || {
        available: true,
        requiredQuests: [],
        requiredDialogs: [],
        requiredLevel: 0,
        requiredTime: 0,
        factionRequirements: [],
        scoreboardRequirements: [],
      },
    };
  }
}
