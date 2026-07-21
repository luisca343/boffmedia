import { Inject, Injectable } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { and, asc, between, desc, eq, sql } from 'drizzle-orm';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import {
  smartRotomAchievements,
  smartRotomReplays,
  smartRotomUserAchievements,
  smartRotomUserReplays,
  smartrotomUsers,
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
        uuid: smartrotomUsers.uuid,
        username: smartrotomUsers.username,
        world: smartrotomUsers.world,
      })
      .from(smartrotomUsers)
      .where(eq(smartrotomUsers.uuid, uuid))
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
      this.db.select({ c: sql<number>`count(*)` }).from(smartRotomAchievements),
      this.db
        .select({
          c: sql<number>`count(*)`,
          badges: sql<number>`sum(case when ${smartRotomAchievements.category} = ${BADGE_CATEGORY} then 1 else 0 end)`,
        })
        .from(smartRotomUserAchievements)
        .innerJoin(
          smartRotomAchievements,
          eq(
            smartRotomAchievements.id,
            smartRotomUserAchievements.achievementId,
          ),
        )
        .where(
          and(
            eq(smartRotomUserAchievements.uuid, uuid),
            eq(smartRotomUserAchievements.completed, 1),
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
        at: sql<Date | null>`min(${smartRotomUserAchievements.completedAt})`,
      })
      .from(smartRotomUserAchievements)
      .where(
        and(
          eq(smartRotomUserAchievements.uuid, uuid),
          eq(smartRotomUserAchievements.completed, 1),
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
        achievementId: smartRotomUserAchievements.achievementId,
        players:
          sql<number>`count(distinct ${smartRotomUserAchievements.uuid})`.as(
            'players',
          ),
      })
      .from(smartRotomUserAchievements)
      .where(eq(smartRotomUserAchievements.completed, 1))
      .groupBy(smartRotomUserAchievements.achievementId)
      .as('completions');

    const rows = await this.db
      .select({
        id: smartRotomAchievements.id,
        name: smartRotomAchievements.name,
        description: smartRotomAchievements.description,
        icon: smartRotomAchievements.icon,
        category: smartRotomAchievements.category,
        subcategory: smartRotomAchievements.subcategory,
        target: smartRotomAchievements.target,
        order: smartRotomAchievements.order,
        points: smartRotomAchievements.points,
        tier: smartRotomAchievements.tier,
        progress: smartRotomUserAchievements.progress,
        completed: smartRotomUserAchievements.completed,
        completedAt: smartRotomUserAchievements.completedAt,
        players: completions.players,
        totalPlayers: sql<number>`(select count(distinct ua.uuid) from ${smartRotomUserAchievements} ua)`,
      })
      .from(smartRotomAchievements)
      .leftJoin(
        smartRotomUserAchievements,
        and(
          eq(
            smartRotomAchievements.id,
            smartRotomUserAchievements.achievementId,
          ),
          eq(smartRotomUserAchievements.uuid, uuid),
        ),
      )
      .leftJoin(
        completions,
        eq(completions.achievementId, smartRotomAchievements.id),
      )
      .orderBy(
        asc(smartRotomAchievements.category),
        asc(smartRotomAchievements.order),
        asc(smartRotomAchievements.name),
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
      .where(eq(pasaporteSeasons.active, 1))
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
        replayId: smartRotomReplays.id,
        winner: smartRotomReplays.winner,
        createdAt: smartRotomReplays.createdAt,
      })
      .from(smartRotomUserReplays)
      .innerJoin(
        smartRotomReplays,
        eq(smartRotomReplays.id, smartRotomUserReplays.replayId),
      )
      .where(
        and(
          eq(smartRotomUserReplays.uuid, uuid),
          between(smartRotomReplays.createdAt, startsAt, endsAt),
        ),
      )
      .orderBy(asc(smartRotomReplays.createdAt), asc(smartRotomReplays.id));

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
    const wins = sql<number>`sum(case when ${smartRotomReplays.winner} = ${smartrotomUsers.username} then 1 else 0 end)`;
    const losses = sql<number>`sum(case when ${smartRotomReplays.winner} is null or ${smartRotomReplays.winner} <> ${smartrotomUsers.username} then 1 else 0 end)`;
    const lp = sql<number>`greatest(0, (${wins}) * 20 - (${losses}) * 12)`;

    const rows = await this.db
      .select({ uuid: smartRotomUserReplays.uuid, lp })
      .from(smartRotomUserReplays)
      .innerJoin(
        smartRotomReplays,
        eq(smartRotomReplays.id, smartRotomUserReplays.replayId),
      )
      .innerJoin(
        smartrotomUsers,
        eq(smartrotomUsers.uuid, smartRotomUserReplays.uuid),
      )
      .where(between(smartRotomReplays.createdAt, startsAt, endsAt))
      .groupBy(smartRotomUserReplays.uuid)
      .orderBy(desc(lp), asc(smartRotomUserReplays.uuid));

    return rows.map((r) => ({ uuid: r.uuid, lp: Number(r.lp ?? 0) }));
  }
}
