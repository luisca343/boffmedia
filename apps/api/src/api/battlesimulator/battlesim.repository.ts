import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, isNull, lt, sql } from 'drizzle-orm';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import { randomUUID } from 'node:crypto';
import {
  battlesimReplays,
  battlesimTeams,
  type BattlesimReplay,
  type BattlesimTeam,
} from '@/_db/schema/Battlesim';

interface ReplayInput {
  clientId: string;
  format: string;
  p1Name: string;
  p2Name: string;
  winner?: string | null;
  log: string;
  teams?: string | null;
  source: 'local' | 'pvp';
  opponentUserId?: number | null;
  playedAt: number;
  deletedAt?: number | null;
}

interface TeamInput {
  clientId: string;
  name: string;
  format: string;
  packed: string;
  clientUpdatedAt?: number | null;
  deletedAt?: number | null;
}

@Injectable()
export class BattlesimRepository {
  constructor(@Inject(DRIZZLE) private readonly db: MySql2Database) {}

  /**
   * Upsert a replay using client_id for idempotency within an account.
   * If a row with the same (user_id, client_id) exists, it is updated.
   * Otherwise a new row is created with a server-generated uuid.
   */
  async upsertReplay(
    userId: number,
    replay: ReplayInput,
  ): Promise<BattlesimReplay> {
    const id = randomUUID();
    await this.db
      .insert(battlesimReplays)
      .values({
        id,
        userId,
        clientId: replay.clientId,
        format: replay.format,
        p1Name: replay.p1Name,
        p2Name: replay.p2Name,
        winner: replay.winner ?? null,
        log: replay.log,
        teams: replay.teams ?? null,
        source: replay.source,
        opponentUserId: replay.opponentUserId ?? null,
        playedAt: replay.playedAt,
        deletedAt: replay.deletedAt ?? null,
      })
      .onDuplicateKeyUpdate({
        set: {
          format: sql`VALUES(format)`,
          p1Name: sql`VALUES(p1_name)`,
          p2Name: sql`VALUES(p2_name)`,
          winner: sql`VALUES(winner)`,
          log: sql`VALUES(log)`,
          teams: sql`VALUES(teams)`,
          source: sql`VALUES(source)`,
          opponentUserId: sql`VALUES(opponent_user_id)`,
          playedAt: sql`VALUES(played_at)`,
          updatedAt: sql`NOW()`,
          deletedAt: sql`VALUES(deleted_at)`,
        },
      });

    // Fetch and return the upserted row.
    const [row] = await this.db
      .select()
      .from(battlesimReplays)
      .where(
        and(
          eq(battlesimReplays.userId, userId),
          eq(battlesimReplays.clientId, replay.clientId),
        ),
      )
      .limit(1);

    return row!;
  }

  /**
   * List replays owned by the caller, newest first, excluding tombstones.
   * Also includes replays where the caller is the opponent.
   */
  async listReplays(
    userId: number,
    limit: number = 20,
    cursor?: string,
  ): Promise<{ items: BattlesimReplay[]; cursor: string | null }> {
    // Build the where conditions upfront.
    const conditions: any[] = [
      // The caller owns this row, or is the opponent in a PvP battle.
      sql`(${battlesimReplays.userId} = ${userId} OR ${battlesimReplays.opponentUserId} = ${userId})`,
      // Exclude tombstones.
      isNull(battlesimReplays.deletedAt),
    ];

    // Add cursor condition if provided.
    if (cursor) {
      const cursorTime = parseInt(cursor, 10);
      if (Number.isInteger(cursorTime)) {
        conditions.push(lt(battlesimReplays.playedAt, cursorTime));
      }
    }

    const rows = await this.db
      .select()
      .from(battlesimReplays)
      .where(and(...conditions))
      .orderBy(desc(battlesimReplays.playedAt))
      .limit(limit + 1); // Fetch one extra to know if there's a next page.

    const hasMore = rows.length > limit;
    const items = rows.slice(0, limit);
    const nextCursor = hasMore
      ? String(items[items.length - 1].playedAt)
      : null;

    return { items, cursor: nextCursor };
  }

  /**
   * Get a single replay by id. Public endpoint (no auth check here).
   * Returns null if not found or tombstoned.
   */
  async getReplayById(id: string): Promise<BattlesimReplay | null> {
    const [row] = await this.db
      .select()
      .from(battlesimReplays)
      .where(
        and(eq(battlesimReplays.id, id), isNull(battlesimReplays.deletedAt)),
      )
      .limit(1);

    return row ?? null;
  }

  /**
   * Upsert a team using client_id for idempotency within an account.
   */
  async upsertTeam(userId: number, team: TeamInput): Promise<BattlesimTeam> {
    const id = randomUUID();
    await this.db
      .insert(battlesimTeams)
      .values({
        id,
        userId,
        clientId: team.clientId,
        name: team.name,
        format: team.format,
        packed: team.packed,
        clientUpdatedAt: team.clientUpdatedAt ?? null,
        deletedAt: team.deletedAt ?? null,
      })
      .onDuplicateKeyUpdate({
        set: {
          name: sql`VALUES(name)`,
          format: sql`VALUES(format)`,
          packed: sql`VALUES(packed)`,
          updatedAt: sql`NOW()`,
          clientUpdatedAt: sql`VALUES(client_updated_at)`,
          deletedAt: sql`VALUES(deleted_at)`,
        },
      });

    // Fetch and return the upserted row.
    const [row] = await this.db
      .select()
      .from(battlesimTeams)
      .where(
        and(
          eq(battlesimTeams.userId, userId),
          eq(battlesimTeams.clientId, team.clientId),
        ),
      )
      .limit(1);

    return row!;
  }

  /**
   * List teams owned by the caller, excluding tombstones.
   */
  async listTeams(userId: number): Promise<BattlesimTeam[]> {
    return this.db
      .select()
      .from(battlesimTeams)
      .where(
        and(
          eq(battlesimTeams.userId, userId),
          isNull(battlesimTeams.deletedAt),
        ),
      )
      .orderBy(desc(battlesimTeams.updatedAt));
  }

  /**
   * Get a single team by client_id. Internal lookup only (not public).
   */
  async getTeamByClientId(
    userId: number,
    clientId: string,
  ): Promise<BattlesimTeam | null> {
    const [row] = await this.db
      .select()
      .from(battlesimTeams)
      .where(
        and(
          eq(battlesimTeams.userId, userId),
          eq(battlesimTeams.clientId, clientId),
        ),
      )
      .limit(1);

    return row ?? null;
  }

  /**
   * Tombstone a team (soft delete).
   * If the team doesn't exist, this is idempotent (no error).
   */
  async deleteTeam(userId: number, clientId: string): Promise<void> {
    const now = Date.now();
    await this.db
      .update(battlesimTeams)
      .set({ deletedAt: now })
      .where(
        and(
          eq(battlesimTeams.userId, userId),
          eq(battlesimTeams.clientId, clientId),
        ),
      );
  }

  /**
   * Record a PvP battle by creating replays for both players.
   * Links the two replays via the opponentUserId field.
   *
   * Called by the battle gateway when a PvP battle ends.
   * Each player gets their own replay row with the opponent linked.
   */
  async recordPvpReplay(data: {
    format: string;
    p1: { userId: number; name: string };
    p2: { userId: number; name: string };
    winner: string;
    log: string;
    playedAt: number;
    // Returns ONE id per player: a PvP battle is stored twice, once owned by
    // each account, and `battleEnd` has to hand each player the row THEY can
    // open. Returning nothing is why the gateway had no replay id to send.
  }): Promise<{ p1: string; p2: string }> {
    const replayId1 = randomUUID();
    const replayId2 = randomUUID();

    // Create replay for player 1, linked to player 2.
    await this.db.insert(battlesimReplays).values({
      id: replayId1,
      userId: data.p1.userId,
      clientId: randomUUID(), // Server-generated client ID for PvP replays.
      format: data.format,
      p1Name: data.p1.name,
      p2Name: data.p2.name,
      winner: data.winner,
      log: data.log,
      teams: null,
      source: 'pvp',
      opponentUserId: data.p2.userId,
      playedAt: data.playedAt,
      deletedAt: null,
    });

    // Create replay for player 2, linked to player 1.
    await this.db.insert(battlesimReplays).values({
      id: replayId2,
      userId: data.p2.userId,
      clientId: randomUUID(), // Server-generated client ID for PvP replays.
      format: data.format,
      p1Name: data.p1.name,
      p2Name: data.p2.name,
      winner: data.winner,
      log: data.log,
      teams: null,
      source: 'pvp',
      opponentUserId: data.p1.userId,
      playedAt: data.playedAt,
      deletedAt: null,
    });

    return { p1: replayId1, p2: replayId2 };
  }
}
