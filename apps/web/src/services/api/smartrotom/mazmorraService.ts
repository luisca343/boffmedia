import { rotomGET } from '@/services/boffAPI';
import type { DungeonPlayerStats, DungeonRankingEntry } from '@boffmedia/shared';

export class MazmorraService {
  /**
   * Leaderboard rows. Runs are written by the mod (POST /dungeons/run); nothing on the
   * web side creates them, so this is read-only.
   */
  static getRanking(limit?: number) {
    const query = limit ? `?limit=${limit}` : '';
    return rotomGET<DungeonRankingEntry[]>(`/dungeons/ranking${query}`);
  }

  /** 404s for a player who has never finished a dungeon run. */
  static getPlayerStats(uuid: string) {
    return rotomGET<DungeonPlayerStats>(`/dungeons/stats/${uuid}`);
  }
}
