import { rotomGET, rotomPOST, ApiResponse } from '@/services/boffAPI'

export type ReplayResponse = any; // Replace 'any' with the actual type when available

/** Replay list-row shape returned by the recent/player replay endpoints. */
export interface LeagueReplay {
  id: number;
  side1: string;
  side2: string;
  team1: string;
  team2: string;
  replay: string;
  winner: string;
  createdAt: string;
  updatedAt?: string;
}

export class LigaService {
  /**
   * Get a replay by ID
   */
  static getReplay(id: number) {
    return rotomGET<ReplayResponse>(`/liga/replay/${id}`);
  }

  /**
   * Get the most recent replays across the league.
   */
  static getRecentReplays(limit = 20) {
    return rotomGET<LeagueReplay[]>(`/liga/replays/recent?limit=${limit}`);
  }

  /**
   * Get every replay a specific player took part in.
   */
  static getPlayerReplays(uuid: string) {
    return rotomGET<LeagueReplay[]>(`/liga/replays/player/${uuid}`);
  }
}

