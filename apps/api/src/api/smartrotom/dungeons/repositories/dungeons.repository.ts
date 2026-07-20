import { Inject, Injectable } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { asc, desc, eq, sql } from 'drizzle-orm';
import { ResultSetHeader } from 'mysql2';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import {
  dungeonRunPlayers,
  dungeonRuns,
} from '@/_db/schema/SmartRotomDungeons';
import { DungeonRankingEntry } from '../entities/dungeon-ranking-entry.entity';
import { DungeonBestRun } from '../entities/dungeon-player-stats.entity';
import {
  DungeonParticipantRow,
  DungeonRunRow,
  IDungeonsRepository,
} from './interfaces/dungeons.repository.interface';

/** Fastest *completed* run — an abandoned run's clock says nothing about skill. */
const BEST_TIME = sql<number | null>`MIN(CASE WHEN ${dungeonRuns.completada} THEN ${dungeonRuns.duracionMs} END)`;
const COMPLETED = sql<number>`COALESCE(SUM(${dungeonRuns.completada}), 0)`;
const BEST_STAGE = sql<number>`COALESCE(MAX(${dungeonRuns.etapaFinal}), 0)`;
const RUNS = sql<number>`COUNT(DISTINCT ${dungeonRunPlayers.runId})`;

@Injectable()
export class DungeonsRepository implements IDungeonsRepository {
  constructor(
    @Inject(DRIZZLE) private db: MySql2Database<Record<string, never>>,
  ) {}

  // MariaDB stores JSON as LONGTEXT, so the driver can hand back a raw string
  // instead of a parsed array — normalise both shapes (as PcMarksRepository does).
  private parseCurses(value: string[] | string | null): string[] {
    if (Array.isArray(value)) return value.filter((c) => typeof c === 'string');
    if (typeof value === 'string') {
      try {
        const parsed: unknown = JSON.parse(value);
        return Array.isArray(parsed)
          ? parsed.filter((c): c is string => typeof c === 'string')
          : [];
      } catch {
        return [];
      }
    }
    return [];
  }

  async saveRun(
    run: DungeonRunRow,
    participants: DungeonParticipantRow[],
  ): Promise<{ insertId: number }> {
    return await this.db.transaction(async (tx) => {
      const result = (await tx
        .insert(dungeonRuns)
        .values(run)) as unknown as ResultSetHeader[];
      const insertId = result[0].insertId;

      if (participants.length > 0) {
        await tx
          .insert(dungeonRunPlayers)
          .values(participants.map((p) => ({ ...p, runId: insertId })));
      }

      return { insertId };
    });
  }

  /**
   * One row per player across every run they were in. Ranking is completions first, then
   * how deep they got, then how fast — a player who has never completed a run sorts below
   * everyone who has, regardless of their clock (hence the nulls-last term).
   */
  async findTopPlayers(limit: number = 10): Promise<DungeonRankingEntry[]> {
    const rows = await this.db
      .select({
        uuid: dungeonRunPlayers.uuid,
        nombre:
          sql<string>`SUBSTRING_INDEX(GROUP_CONCAT(${dungeonRunPlayers.nombre} ORDER BY ${dungeonRunPlayers.runId} DESC), ',', 1)`.as(
            'nombre',
          ),
        partidas: RUNS.as('partidas'),
        completadas: COMPLETED.as('completadas'),
        mejorEtapa: BEST_STAGE.as('mejorEtapa'),
        mejorPisos:
          sql<number>`COALESCE(MAX(${dungeonRuns.pisosSuperados}), 0)`.as(
            'mejorPisos',
          ),
        mejorTiempoMs: BEST_TIME.as('mejorTiempoMs'),
        muertes: sql<number>`COALESCE(SUM(${dungeonRunPlayers.muertes}), 0)`.as(
          'muertes',
        ),
        abandonos:
          sql<number>`COALESCE(SUM(${dungeonRunPlayers.abandono}), 0)`.as(
            'abandonos',
          ),
      })
      .from(dungeonRunPlayers)
      .innerJoin(dungeonRuns, eq(dungeonRuns.id, dungeonRunPlayers.runId))
      .groupBy(dungeonRunPlayers.uuid)
      .orderBy(
        desc(COMPLETED),
        desc(BEST_STAGE),
        asc(sql`${BEST_TIME} IS NULL`),
        asc(BEST_TIME),
        desc(RUNS),
      )
      .limit(limit);

    return rows.map((row, index) => ({
      rank: index + 1,
      uuid: row.uuid,
      nombre: row.nombre,
      partidas: Number(row.partidas) || 0,
      completadas: Number(row.completadas) || 0,
      mejorEtapa: Number(row.mejorEtapa) || 0,
      mejorPisos: Number(row.mejorPisos) || 0,
      mejorTiempoMs:
        row.mejorTiempoMs === null ? null : Number(row.mejorTiempoMs),
      muertes: Number(row.muertes) || 0,
      abandonos: Number(row.abandonos) || 0,
    }));
  }

  async findBestRun(uuid: string): Promise<DungeonBestRun | null> {
    const rows = await this.db
      .select({
        etapaInicial: dungeonRuns.etapaInicial,
        etapaFinal: dungeonRuns.etapaFinal,
        pisosSuperados: dungeonRuns.pisosSuperados,
        completada: dungeonRuns.completada,
        duracionMs: dungeonRuns.duracionMs,
        maldiciones: dungeonRuns.maldiciones,
        fecha: dungeonRuns.fecha,
      })
      .from(dungeonRunPlayers)
      .innerJoin(dungeonRuns, eq(dungeonRuns.id, dungeonRunPlayers.runId))
      .where(eq(dungeonRunPlayers.uuid, uuid))
      .orderBy(
        desc(dungeonRuns.completada),
        desc(dungeonRuns.etapaFinal),
        desc(dungeonRuns.pisosSuperados),
        asc(dungeonRuns.duracionMs),
      )
      .limit(1);

    if (rows.length === 0) return null;

    const row = rows[0];
    return {
      ...row,
      duracionMs: Number(row.duracionMs),
      maldiciones: this.parseCurses(row.maldiciones),
    };
  }
}
