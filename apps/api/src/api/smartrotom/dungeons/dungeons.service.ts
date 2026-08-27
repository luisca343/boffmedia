import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DUNGEONS_REPOSITORY_TOKEN } from '@api/_utils/repositories/interfaces/repository.token';
import { SaveDungeonRunDto } from './dto/save-dungeon-run.dto';
import { DungeonRankingEntry } from './entities/dungeon-ranking-entry.entity';
import { DungeonPlayerStats } from './entities/dungeon-player-stats.entity';
import { SaveDungeonRunResponse } from './entities/save-dungeon-run-response.entity';
import { IDungeonsRepository } from './repositories/interfaces/dungeons.repository.interface';

const MAX_RANKING_LIMIT = 100;
/** Deep enough that a named player almost always has a rank to show. */
const RANK_LOOKUP_DEPTH = 1000;

@Injectable()
export class DungeonsService {
  constructor(
    @Inject(DUNGEONS_REPOSITORY_TOKEN)
    private readonly repository: IDungeonsRepository,
  ) {}

  async saveRun(body: SaveDungeonRunDto): Promise<SaveDungeonRunResponse> {
    const { participantes, fecha, server, ...run } = body;

    const { insertId } = await this.repository.saveRun(
      { ...run, server, fecha: new Date(fecha) },
      participantes,
    );

    return { saved: true, id: insertId };
  }

  async getRanking(limit?: number): Promise<DungeonRankingEntry[]> {
    const capped = Math.min(Math.max(limit ?? 10, 1), MAX_RANKING_LIMIT);
    return await this.repository.findTopPlayers(capped);
  }

  async getPlayerStats(uuid: string): Promise<DungeonPlayerStats> {
    const stats = await this.repository.findPlayerStatsWithRank(uuid);

    if (!stats) {
      throw new NotFoundException(`No dungeon runs found for ${uuid}`);
    }

    return stats;
  }
}
