import { Inject, Injectable } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { and, asc, between, desc, eq, sql } from 'drizzle-orm';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import {
  rotomAchievements,
  rotomReplays,
  rotomUserAchievements,
  rotomUserReplays,
  rotomUsers,
} from '@/_db/schema/SmartRotom';
import {
  NewPasaporteProfile,
  PasaporteProfile,
  PasaporteSeason,
  pasaporteProfiles,
  pasaporteSeasons,
} from '@/_db/schema/SmartRotomPasaporte';
import {
  BADGE_CATEGORY,
  LogroView,
  SeasonBattle,
} from './types/pasaporte.types';

@Injectable()
export class PasaporteRepository {
  constructor(
    @Inject(DRIZZLE) private readonly db: MySql2Database<Record<string, never>>,
  ) {}

  // ==================== PROFILE ====================

  async findProfile(uuid: string): Promise<PasaporteProfile | null> {
    const rows = await this.db
      .select()
      .from(pasaporteProfiles)
      .where(eq(pasaporteProfiles.uuid, uuid))
      .limit(1);
    return rows[0] ?? null;
  }

  async findUser(uuid: string) {
    const rows = await this.db
      .select({
        uuid: rotomUsers.uuid,
        username: rotomUsers.username,
        world: rotomUsers.world,
      })
      .from(rotomUsers)
      .where(eq(rotomUsers.uuid, uuid))
      .limit(1);
    return rows[0] ?? null;
  }

  // Is this trainer id already issued to somebody? The column is UNIQUE, so the
  // service checks before it inserts rather than catching a driver error.
  async trainerIdOwner(trainerId: string): Promise<string | null> {
    const rows = await this.db
      .select({ uuid: pasaporteProfiles.uuid })
      .from(pasaporteProfiles)
      .where(eq(pasaporteProfiles.trainerId, trainerId))
      .limit(1);
    return rows[0]?.uuid ?? null;
  }

  // memberSince is deliberately absent from the insert: the DB default stamps it.
  async createProfile(values: NewPasaporteProfile): Promise<void> {
    await this.db
      .insert(pasaporteProfiles)
      .values(values)
      // Two concurrent first-reads race on the same uuid; the second one is a no-op
      // rather than a 500 — the service re-reads the row afterwards either way.
      .onDuplicateKeyUpdate({ set: { uuid: values.uuid } });
  }

  // ==================== ACHIEVEMENT AGGREGATES ====================

  // Everything the carné's derived header needs, in two aggregate queries:
  // total achievements, how many this trainer completed, and how many of those are
  // gym badges (category = Gimnasios).
  async achievementTotals(uuid: string): Promise<{
    total: number;
    completed: number;
    badges: number;
  }> {
    const [totalRows, completedRows] = await Promise.all([
      this.db.select({ c: sql<number>`count(*)` }).from(rotomAchievements),
      this.db
        .select({
          c: sql<number>`count(*)`,
          badges: sql<number>`sum(case when ${rotomAchievements.category} = ${BADGE_CATEGORY} then 1 else 0 end)`,
        })
        .from(rotomUserAchievements)
        .innerJoin(
          rotomAchievements,
          eq(rotomAchievements.id, rotomUserAchievements.achievementId),
        )
        .where(
          and(
            eq(rotomUserAchievements.uuid, uuid),
            eq(rotomUserAchievements.completed, 1),
          ),
        ),
    ]);

    return {
      total: Number(totalRows[0]?.c ?? 0),
      completed: Number(completedRows[0]?.c ?? 0),
      badges: Number(completedRows[0]?.badges ?? 0),
    };
  }

  // The earliest thing this server can prove about a trainer. `rotom_users` has no join
  // date, so the first achievement they ever completed is the oldest real timestamp we
  // hold for them — that is what the carné's "miembro desde" is built from.
  async firstActivityAt(uuid: string): Promise<Date | null> {
    const rows = await this.db
      .select({
        at: sql<Date | null>`min(${rotomUserAchievements.completedAt})`,
      })
      .from(rotomUserAchievements)
      .where(
        and(
          eq(rotomUserAchievements.uuid, uuid),
          eq(rotomUserAchievements.completed, 1),
        ),
      );

    const at = rows[0]?.at;
    return at ? new Date(at) : null;
  }

  // Every achievement (locked and unlocked) left-joined with this trainer's progress,
  // plus a REAL rarity. The completion counts come from ONE grouped subquery joined in
  // — never a per-achievement query — and the player total rides along as a scalar
  // subquery, so the whole list is a single round trip.
  async findLogros(uuid: string): Promise<LogroView[]> {
    const completions = this.db
      .select({
        achievementId: rotomUserAchievements.achievementId,
        players: sql<number>`count(distinct ${rotomUserAchievements.uuid})`.as(
          'players',
        ),
      })
      .from(rotomUserAchievements)
      .where(eq(rotomUserAchievements.completed, 1))
      .groupBy(rotomUserAchievements.achievementId)
      .as('completions');

    const rows = await this.db
      .select({
        id: rotomAchievements.id,
        name: rotomAchievements.name,
        description: rotomAchievements.description,
        icon: rotomAchievements.icon,
        category: rotomAchievements.category,
        subcategory: rotomAchievements.subcategory,
        target: rotomAchievements.target,
        order: rotomAchievements.order,
        points: rotomAchievements.points,
        tier: rotomAchievements.tier,
        progress: rotomUserAchievements.progress,
        completed: rotomUserAchievements.completed,
        completedAt: rotomUserAchievements.completedAt,
        players: completions.players,
        totalPlayers: sql<number>`(select count(distinct ua.uuid) from ${rotomUserAchievements} ua)`,
      })
      .from(rotomAchievements)
      .leftJoin(
        rotomUserAchievements,
        and(
          eq(rotomAchievements.id, rotomUserAchievements.achievementId),
          eq(rotomUserAchievements.uuid, uuid),
        ),
      )
      .leftJoin(
        completions,
        eq(completions.achievementId, rotomAchievements.id),
      )
      .orderBy(
        asc(rotomAchievements.category),
        asc(rotomAchievements.order),
        asc(rotomAchievements.name),
      );

    return rows.map((r) => {
      const totalPlayers = Number(r.totalPlayers ?? 0);
      const players = Number(r.players ?? 0);
      // No players at all → nothing is rare yet. And an achievement nobody holds is
      // still floored at 1%, so the UI never paints a 0%-rare badge.
      const rarity =
        totalPlayers > 0
          ? Math.max(1, Math.round((players / totalPlayers) * 100))
          : 100;

      return {
        id: r.id,
        name: r.name,
        description: r.description,
        icon: r.icon ?? null,
        category: r.category,
        subcategory: r.subcategory ?? null,
        target: r.target ?? 1,
        order: r.order ?? 0,
        progress: Number(r.progress ?? 0),
        completed: Number(r.completed ?? 0) === 1,
        completedAt: r.completedAt ?? null,
        points: r.points ?? 10,
        tier: r.tier ?? 'bronce',
        rarity,
      };
    });
  }

  // ==================== SEASON ====================

  async findActiveSeason(): Promise<PasaporteSeason | null> {
    const rows = await this.db
      .select()
      .from(pasaporteSeasons)
      .where(eq(pasaporteSeasons.active, true))
      .orderBy(desc(pasaporteSeasons.startsAt))
      .limit(1);
    return rows[0] ?? null;
  }

  // The player's battles inside the season window, oldest first.
  //
  // rotom_replays.side1/side2/winner store player NAMES, not uuids — battle-achievement
  // writes `side1: name1, side2: name2, winner: name1`. The uuid→battle link is
  // rotom_user_replays; the win/loss verdict is `winner === username`.
  async seasonBattles(
    uuid: string,
    username: string,
    startsAt: Date,
    endsAt: Date,
  ): Promise<SeasonBattle[]> {
    const rows = await this.db
      .select({
        replayId: rotomReplays.id,
        winner: rotomReplays.winner,
        createdAt: rotomReplays.createdAt,
      })
      .from(rotomUserReplays)
      .innerJoin(rotomReplays, eq(rotomReplays.id, rotomUserReplays.replayId))
      .where(
        and(
          eq(rotomUserReplays.uuid, uuid),
          between(rotomReplays.createdAt, startsAt, endsAt),
        ),
      )
      .orderBy(asc(rotomReplays.createdAt), asc(rotomReplays.id));

    return rows.map((r) => ({
      replayId: r.replayId,
      win: r.winner !== null && r.winner === username,
      createdAt: r.createdAt ?? null,
    }));
  }

  // Every player with at least one battle in the season, ordered by the SAME derived LP
  // the service computes (wins*20 - losses*12, floored at 0). ONE aggregate query — the
  // rank is the row's position in it, not a loop of per-player queries.
  async seasonLeaderboard(
    startsAt: Date,
    endsAt: Date,
  ): Promise<{ uuid: string; lp: number }[]> {
    const wins = sql<number>`sum(case when ${rotomReplays.winner} = ${rotomUsers.username} then 1 else 0 end)`;
    const losses = sql<number>`sum(case when ${rotomReplays.winner} is null or ${rotomReplays.winner} <> ${rotomUsers.username} then 1 else 0 end)`;
    const lp = sql<number>`greatest(0, (${wins}) * 20 - (${losses}) * 12)`;

    const rows = await this.db
      .select({ uuid: rotomUserReplays.uuid, lp })
      .from(rotomUserReplays)
      .innerJoin(rotomReplays, eq(rotomReplays.id, rotomUserReplays.replayId))
      .innerJoin(rotomUsers, eq(rotomUsers.uuid, rotomUserReplays.uuid))
      .where(between(rotomReplays.createdAt, startsAt, endsAt))
      .groupBy(rotomUserReplays.uuid)
      .orderBy(desc(lp), asc(rotomUserReplays.uuid));

    return rows.map((r) => ({ uuid: r.uuid, lp: Number(r.lp ?? 0) }));
  }
}
