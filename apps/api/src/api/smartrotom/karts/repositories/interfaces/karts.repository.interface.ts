import { KartPlayerStats } from '../../entities/kart-player-stats.entity';
import { KartRankingEntry } from '../../entities/kart-ranking-entry.entity';

export interface KartRaceRow {
  server?: string;
  circuito: string;
  modo: string;
  vueltas: number;
  fecha: Date;
}

export interface KartRaceParticipantRow {
  uuid: string;
  nombre: string;
  posicion: number;
  tiempoMs: number;
  mejorVueltaMs: number;
  vueltasCompletadas: number;
  dnf: boolean;
}

export interface KartRankingFilters {
  circuito?: string;
  modo?: string;
  limit?: number;
}

export interface IKartsRepository {
  saveRace(
    race: KartRaceRow,
    participants: KartRaceParticipantRow[],
  ): Promise<{ insertId: number }>;

  findTopTimes(filters: KartRankingFilters): Promise<KartRankingEntry[]>;

  findPlayerStats(uuid: string): Promise<KartPlayerStats | null>;
}
