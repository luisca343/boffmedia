import { Inject, Injectable } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { and, asc, eq, sql, SQLWrapper } from 'drizzle-orm';
import { ResultSetHeader } from 'mysql2';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import { kartRacePlayers, kartRaces } from '@/_db/schema/SmartRotomKarts';
import { KartRankingEntry } from '../entities/kart-ranking-entry.entity';
import {
  KartCircuitBest,
  KartPlayerStats,
} from '../entities/kart-player-stats.entity';
import {
  IKartsRepository,
  KartRaceParticipantRow,
  KartRaceRow,
  KartRankingFilters,
} from './interfaces/karts.repository.interface';

/**
 * A time is only comparable to another time when the racer actually finished and covered
 * the distance the race was set to — an elimination winner wins by being the last one
 * standing, not by driving the laps. Every time-based read is scoped by this.
 */
const COMPARABLE_TIME = and(
  eq(kartRacePlayers.dnf, false),
  eq(kartRaces.modo, 'clasica'),
  eq(kartRacePlayers.vueltasCompletadas, kartRaces.vueltas),
)!;

/** -1 means "completed no lap"; it is a sentinel, never a duration to aggregate. */
const BEST_LAP = sql<
  number | null
>`MIN(NULLIF(${kartRacePlayers.mejorVueltaMs}, -1))`;

const BEST_TIME = sql<number>`MIN(${kartRacePlayers.tiempoMs})`;

/** The value of `column` on the row holding the group's best time. */
const atBestTime = (column: SQLWrapper) =>
  sql<string>`SUBSTRING_INDEX(GROUP_CONCAT(${column} ORDER BY ${kartRacePlayers.tiempoMs} ASC), ',', 1)`;

@Injectable()
export class KartsRepository implements IKartsRepository {
  constructor(
    @Inject(DRIZZLE) private db: MySql2Database<Record<string, never>>,
  ) {}

  async saveRace(
    race: KartRaceRow,
    participants: KartRaceParticipantRow[],
  ): Promise<{ insertId: number }> {
    return await this.db.transaction(async (tx) => {
      const result = (await tx
        .insert(kartRaces)
        .values(race)) as unknown as ResultSetHeader[];
      const insertId = result[0].insertId;

      if (participants.length > 0) {
        await tx
          .insert(kartRacePlayers)
          .values(participants.map((p) => ({ ...p, raceId: insertId })));
      }

      return { insertId };
    });
  }

  /**
   * Grouped by (uuid, circuito), not by uuid alone: a lap of Rainbow Road and a lap of
   * anything else are different distances, so a single cross-circuit "best time" would be
   * meaningless. With the usual `circuito` filter this collapses to one row per player.
   */
  async findTopTimes({
    circuito,
    limit = 10,
  }: KartRankingFilters): Promise<KartRankingEntry[]> {
    const rows = await this.db
      .select({
        uuid: kartRacePlayers.uuid,
        circuito: kartRaces.circuito,
        nombre: atBestTime(kartRacePlayers.nombre).as('nombre'),
        tiempoMs: BEST_TIME.as('tiempoMs'),
        mejorVueltaMs: BEST_LAP.as('mejorVueltaMs'),
        vueltas: atBestTime(kartRaces.vueltas).as('vueltas'),
        fechaMs: atBestTime(
          sql`UNIX_TIMESTAMP(${kartRaces.fecha}) * 1000`,
        ).as('fechaMs'),
      })
      .from(kartRacePlayers)
      .innerJoin(kartRaces, eq(kartRaces.id, kartRacePlayers.raceId))
      .where(
        circuito
          ? and(COMPARABLE_TIME, eq(kartRaces.circuito, circuito))
          : COMPARABLE_TIME,
      )
      .groupBy(kartRacePlayers.uuid, kartRaces.circuito)
      .orderBy(asc(kartRaces.circuito), asc(BEST_TIME))
      .limit(limit);

    return rows.map((row, index) => ({
      rank: index + 1,
      uuid: row.uuid,
      circuito: row.circuito,
      nombre: row.nombre,
      tiempoMs: Number(row.tiempoMs),
      mejorVueltaMs:
        row.mejorVueltaMs === null ? null : Number(row.mejorVueltaMs),
      vueltas: Number(row.vueltas) || 0,
      fecha: new Date(Number(row.fechaMs)),
    }));
  }

  async findPlayerStats(uuid: string): Promise<KartPlayerStats | null> {
    const totals = await this.db
      .select({
        nombre:
          sql<string>`SUBSTRING_INDEX(GROUP_CONCAT(${kartRacePlayers.nombre} ORDER BY ${kartRacePlayers.raceId} DESC), ',', 1)`.as(
            'nombre',
          ),
        carreras: sql<number>`COUNT(*)`.as('carreras'),
        victorias:
          sql<number>`COALESCE(SUM(${kartRacePlayers.posicion} = 1), 0)`.as(
            'victorias',
          ),
        podios:
          sql<number>`COALESCE(SUM(${kartRacePlayers.posicion} <= 3), 0)`.as(
            'podios',
          ),
        abandonos: sql<number>`COALESCE(SUM(${kartRacePlayers.dnf}), 0)`.as(
          'abandonos',
        ),
      })
      .from(kartRacePlayers)
      .where(eq(kartRacePlayers.uuid, uuid));

    const total = totals[0];
    if (!total || Number(total.carreras) === 0) return null;

    const circuitRows = await this.db
      .select({
        circuito: kartRaces.circuito,
        carreras: sql<number>`COUNT(*)`.as('carreras'),
        // Scoped inside the aggregate rather than in WHERE: a player's race count for a
        // circuit should include the races their time is not comparable in.
        mejorTiempoMs: sql<number | null>`MIN(CASE WHEN ${COMPARABLE_TIME} THEN ${kartRacePlayers.tiempoMs} END)`.as(
          'mejorTiempoMs',
        ),
        mejorVueltaMs: BEST_LAP.as('mejorVueltaMs'),
      })
      .from(kartRacePlayers)
      .innerJoin(kartRaces, eq(kartRaces.id, kartRacePlayers.raceId))
      .where(eq(kartRacePlayers.uuid, uuid))
      .groupBy(kartRaces.circuito)
      .orderBy(asc(kartRaces.circuito));

    const circuitos: KartCircuitBest[] = circuitRows.map((row) => ({
      circuito: row.circuito,
      carreras: Number(row.carreras) || 0,
      mejorTiempoMs:
        row.mejorTiempoMs === null ? null : Number(row.mejorTiempoMs),
      mejorVueltaMs:
        row.mejorVueltaMs === null ? null : Number(row.mejorVueltaMs),
    }));

    return {
      uuid,
      nombre: total.nombre,
      carreras: Number(total.carreras) || 0,
      victorias: Number(total.victorias) || 0,
      podios: Number(total.podios) || 0,
      abandonos: Number(total.abandonos) || 0,
      circuitos,
    };
  }
}
