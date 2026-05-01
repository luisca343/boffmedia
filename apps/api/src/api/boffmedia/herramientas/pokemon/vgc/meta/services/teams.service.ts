import { Injectable } from '@nestjs/common';
import { VgcPastesRepository } from '../repositories/vgcpastes.repository';
import { LimitlessRepository } from '../repositories/limitless.repository';
import { PastesRepository } from '../repositories/pastes.repository';
import { SpeciesTeamEntry } from '../entities/pokemon-usage.entity';
import { VgcMetaSlot } from '@/_db/schema/Vgc';

const TEAMS_LIMIT = 30;

@Injectable()
export class TeamsService {
  constructor(
    private readonly vgcPastesRepository: VgcPastesRepository,
    private readonly limitlessRepository:  LimitlessRepository,
    private readonly pastesRepository:     PastesRepository,
  ) {}

  /**
   * Returns up to 30 teams featuring `speciesId` for a regulation.
   * Sources: VGCPastes CSV, Limitless tournaments, and raw vgc_pastes by formatId.
   * Teams are sorted by numeric rank (ascending) — unranked teams come last.
   */
  async getTeamsForSpecies(
    speciesId:    string,
    regulationId: string,
    formatId?:    string,
  ): Promise<SpeciesTeamEntry[]> {
    const [vgcPastesTeams, limitlessTeams, rawPastes] = await Promise.all([
      this.vgcPastesRepository.findTeamsByRegulationWithPastes(regulationId),
      this.limitlessRepository.findTeamsByRegulationWithPastes(regulationId),
      formatId ? this.pastesRepository.findByFormatId(formatId) : Promise.resolve([]),
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

    // Collect paste IDs already added from the two structured sources to avoid duplicates.
    // vgc_paste_teams and vgc_limitless_teams reference vgc_pastes rows by paste_id, so a
    // raw paste that was already linked via those tables would otherwise appear twice.
    const linkedPasteIds = new Set<number>();
    for (const team of vgcPastesTeams) {
      if ((team as any).pasteId != null) linkedPasteIds.add((team as any).pasteId);
    }
    for (const team of limitlessTeams) {
      if ((team as any).pasteId != null) linkedPasteIds.add((team as any).pasteId);
    }

    for (const paste of rawPastes) {
      if (linkedPasteIds.has(paste.id)) continue;
      const slots = JSON.parse(paste.parsedSlots) as VgcMetaSlot[];
      if (!slots.some((s) => s.speciesId === speciesId)) continue;
      results.push({
        source:     'paste',
        playerId:   String(paste.id),
        playerName: paste.author ?? null,
        record:     null,
        rank:       null,
        slots,
        rawText:    paste.rawText,
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
