import { DungeonBestRun } from '../../entities/dungeon-player-stats.entity';
import { DungeonRankingEntry } from '../../entities/dungeon-ranking-entry.entity';

export interface DungeonRunRow {
  server?: string;
  semilla: string;
  etapaInicial: number;
  etapaFinal: number;
  pisosSuperados: number;
  completada: boolean;
  duracionMs: number;
  maldiciones: string[];
  monedasGanadas: number;
  monedasGastadas: number;
  monedasConvertidas: number;
  fecha: Date;
}

export interface DungeonParticipantRow {
  uuid: string;
  nombre: string;
  muertes: number;
  abandono: boolean;
}

export interface IDungeonsRepository {
  saveRun(
    run: DungeonRunRow,
    participants: DungeonParticipantRow[],
  ): Promise<{ insertId: number }>;

  findTopPlayers(limit?: number): Promise<DungeonRankingEntry[]>;

  findBestRun(uuid: string): Promise<DungeonBestRun | null>;
}
