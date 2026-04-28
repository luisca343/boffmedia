import { Injectable } from '@nestjs/common';
import { VgcPastesRepository } from '../repositories/vgcpastes.repository';
import { LimitlessRepository } from '../repositories/limitless.repository';
import { SpeciesTeamEntry } from '../entities/pokemon-usage.entity';
import { VgcMetaSlot } from '@/_db/schema/Vgc';

const TEAMS_LIMIT = 30;

@Injectable()
export class TeamsService {
  constructor(
    private readonly vgcPastesRepository: VgcPastesRepository,
    private readonly limitlessRepository:  LimitlessRepository,
  ) {}

  /**
   * Returns up to 30 teams featuring `speciesId` for a regulation.
   * Sources: VGCPastes + all completed Limitless tournaments for that regulation.
   * Teams are sorted by numeric rank (ascending) — unranked teams come last.
   */
  async getTeamsForSpecies(
    speciesId:    string,
    regulationId: string,
  ): Promise<SpeciesTeamEntry[]> {
    const [vgcPastesTeams, limitlessTeams] = await Promise.all([
      this.vgcPastesRepository.findTeamsByRegulationWithPastes(regulationId),
      this.limitlessRepository.findTeamsByRegulationWithPastes(regulationId),
    ]);

    const results: SpeciesTeamEntry[] = [];

    for (const team of vgcPastesTeams) {
      const slots = JSON.parse(team.parsedSlots) as VgcMetaSlot[];
      if (!slots.some((s) => s.speciesId === speciesId)) continue;
      results.push({
        source:     'vgcpastes',
        playerId:   team.teamId,
        playerName: team.playerName,
        record:     null,
        rank:       team.rank,
        slots,
        rawText:    team.rawText,
      });
    }

    for (const team of limitlessTeams) {
      const slots = JSON.parse(team.parsedSlots) as VgcMetaSlot[];
      if (!slots.some((s) => s.speciesId === speciesId)) continue;
      results.push({
        source:     'limitless',
        playerId:   team.playerSlug,
        playerName: team.playerName,
        record:     team.record,
        rank:       team.placing != null ? String(team.placing) : null,
        slots,
        rawText:    team.rawText,
      });
    }

    // Sort by numeric rank ascending; unranked teams sink to the bottom
    results.sort((a, b) => {
      const rankA = a.rank != null ? parseInt(a.rank, 10) : Infinity;
      const rankB = b.rank != null ? parseInt(b.rank, 10) : Infinity;
      if (!isNaN(rankA) && !isNaN(rankB)) return rankA - rankB;
      if (!isNaN(rankA)) return -1;
      if (!isNaN(rankB)) return 1;
      return 0;
    });

    return results.slice(0, TEAMS_LIMIT);
  }
}
