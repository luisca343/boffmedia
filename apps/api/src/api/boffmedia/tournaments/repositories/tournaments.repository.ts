import { Inject, Injectable } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import {
  and,
  desc,
  eq,
  inArray,
  isNull,
  like,
  lt,
  notInArray,
  sql,
} from 'drizzle-orm';
import { alias } from 'drizzle-orm/mysql-core';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import {
  boffMediaTournaments,
  boffMediaTournamentParticipants,
  boffMediaTournamentRoster,
  boffMediaTournamentGroups,
  boffMediaTournamentMatches,
  boffMediaTournamentPhases,
  boffMediaTournamentPhaseEntrants,
  boffMediaTournamentMatchMessages,
  Tournament,
  TournamentParticipant,
  TournamentGroup,
  TournamentMatch,
  TournamentRosterMember,
  TournamentPhase,
  TournamentPhaseEntrant,
  TournamentMatchMessage,
} from '@/_db/schema/BoffMediaTournaments';
import {
  boffMediaGames,
  boffMediaEvents,
  boffMediaEventParticipants,
  boffMediaParticipants,
} from '@/_db/schema/BoffMediaEvents';
import { boffMediaUsers } from '@/_db/schema/BoffMedia';
import type {
  MatchSlot,
  MatchStatus,
  TournamentFormat,
  TournamentStatus,
} from '../tournaments.types';

export interface TournamentListRow extends Tournament {
  gameTitle: string | null;
  championName: string | null;
}

@Injectable()
export class TournamentsRepository {
  constructor(
    @Inject(DRIZZLE) private readonly db: MySql2Database<Record<string, never>>,
  ) {}

  /**
   * Run `fn` against a transaction-scoped repository. All writes commit together
   * or roll back — used for the advancement flow (dozens of inserts/updates).
   */
  async transaction<T>(
    fn: (repo: TournamentsRepository) => Promise<T>,
  ): Promise<T> {
    return this.db.transaction((tx) =>
      fn(
        new TournamentsRepository(
          tx as unknown as MySql2Database<Record<string, never>>,
        ),
      ),
    );
  }

  // ── tournaments ────────────────────────────────────────────────────────────
  async create(
    values: typeof boffMediaTournaments.$inferInsert,
  ): Promise<number> {
    const [res] = await this.db.insert(boffMediaTournaments).values(values);
    return res.insertId;
  }

  async findById(id: number): Promise<Tournament | undefined> {
    const [row] = await this.db
      .select()
      .from(boffMediaTournaments)
      .where(
        and(
          eq(boffMediaTournaments.id, id),
          isNull(boffMediaTournaments.deletedAt),
        ),
      );
    return row;
  }

  async findBySlug(slug: string): Promise<TournamentListRow | undefined> {
    const champ = alias(boffMediaTournamentParticipants, 'champ');
    const [row] = await this.db
      .select({
        t: boffMediaTournaments,
        gameTitle: boffMediaGames.title,
        championName: champ.name,
      })
      .from(boffMediaTournaments)
      .leftJoin(
        boffMediaGames,
        eq(boffMediaTournaments.gameId, boffMediaGames.id),
      )
      .leftJoin(champ, eq(boffMediaTournaments.championParticipantId, champ.id))
      .where(
        and(
          eq(boffMediaTournaments.slug, slug),
          isNull(boffMediaTournaments.deletedAt),
        ),
      );
    if (!row) return undefined;
    return {
      ...row.t,
      gameTitle: row.gameTitle,
      championName: row.championName,
    };
  }

  async findByIdRow(id: number): Promise<TournamentListRow | undefined> {
    const champ = alias(boffMediaTournamentParticipants, 'champ');
    const [row] = await this.db
      .select({
        t: boffMediaTournaments,
        gameTitle: boffMediaGames.title,
        championName: champ.name,
      })
      .from(boffMediaTournaments)
      .leftJoin(
        boffMediaGames,
        eq(boffMediaTournaments.gameId, boffMediaGames.id),
      )
      .leftJoin(champ, eq(boffMediaTournaments.championParticipantId, champ.id))
      .where(
        and(
          eq(boffMediaTournaments.id, id),
          isNull(boffMediaTournaments.deletedAt),
        ),
      );
    if (!row) return undefined;
    return {
      ...row.t,
      gameTitle: row.gameTitle,
      championName: row.championName,
    };
  }

  async slugExists(slug: string): Promise<boolean> {
    const [row] = await this.db
      .select({ id: boffMediaTournaments.id })
      .from(boffMediaTournaments)
      .where(eq(boffMediaTournaments.slug, slug));
    return !!row;
  }

  async list(filters: {
    status?: TournamentStatus;
    format?: TournamentFormat;
    gameId?: number;
    q?: string;
    limit: number;
    offset: number;
  }): Promise<TournamentListRow[]> {
    const champ = alias(boffMediaTournamentParticipants, 'champ');
    const where = [isNull(boffMediaTournaments.deletedAt)];
    if (filters.status)
      where.push(eq(boffMediaTournaments.status, filters.status));
    if (filters.format)
      where.push(eq(boffMediaTournaments.format, filters.format));
    if (filters.gameId != null)
      where.push(eq(boffMediaTournaments.gameId, filters.gameId));
    if (filters.q)
      where.push(like(boffMediaTournaments.name, `%${filters.q}%`));

    const rows = await this.db
      .select({
        t: boffMediaTournaments,
        gameTitle: boffMediaGames.title,
        championName: champ.name,
      })
      .from(boffMediaTournaments)
      .leftJoin(
        boffMediaGames,
        eq(boffMediaTournaments.gameId, boffMediaGames.id),
      )
      .leftJoin(champ, eq(boffMediaTournaments.championParticipantId, champ.id))
      .where(and(...where))
      .orderBy(desc(boffMediaTournaments.createdAt))
      .limit(filters.limit)
      .offset(filters.offset);

    return rows.map((r) => ({
      ...r.t,
      gameTitle: r.gameTitle,
      championName: r.championName,
    }));
  }

  async participantCounts(
    tournamentIds: number[],
  ): Promise<Map<number, number>> {
    if (tournamentIds.length === 0) return new Map();
    const rows = await this.db
      .select({
        tournamentId: boffMediaTournamentParticipants.tournamentId,
        count: sql<number>`COUNT(*)`,
      })
      .from(boffMediaTournamentParticipants)
      .where(
        inArray(boffMediaTournamentParticipants.tournamentId, tournamentIds),
      )
      .groupBy(boffMediaTournamentParticipants.tournamentId);
    return new Map(rows.map((r) => [r.tournamentId, Number(r.count)]));
  }

  async update(
    id: number,
    patch: Partial<typeof boffMediaTournaments.$inferInsert>,
  ): Promise<void> {
    await this.db
      .update(boffMediaTournaments)
      .set(patch)
      .where(eq(boffMediaTournaments.id, id));
  }

  /**
   * Take a write lock on the tournament row for the rest of the transaction.
   *
   * Bracket generation and phase advancement are multi-statement reads-then-writes
   * over the same rows: without this, two concurrent generates (an admin
   * double-click is enough) interleave their entrant freeze and match inserts,
   * and the orphan back-tag can claim the other's matches. Serialising on the
   * parent row is cheaper than locking every match, and every writer of a
   * tournament's structure passes through here.
   *
   * Must be called inside a transaction — outside one the lock is released
   * immediately and buys nothing.
   */
  async lockTournament(id: number): Promise<Tournament | undefined> {
    const [row] = await this.db
      .select()
      .from(boffMediaTournaments)
      .where(eq(boffMediaTournaments.id, id))
      .for('update');
    return row;
  }

  /**
   * Does this user hold an active membership (registered|confirmed) in the
   * event the tournament hangs off?
   *
   * Schema-level import of the events tables rather than a dependency on the
   * events module: the events module already reaches into the randomizer schema
   * the same way, and a Nest-level dependency here would be a new cycle.
   */
  /** The event a tournament hangs off, for the detail's cross-link + gating. */
  async findEventContext(
    eventId: number,
  ): Promise<
    | { id: number; title: string; visibility: string; status: string }
    | undefined
  > {
    const [row] = await this.db
      .select({
        id: boffMediaEvents.id,
        title: boffMediaEvents.title,
        visibility: boffMediaEvents.visibility,
        status: boffMediaEvents.status,
      })
      .from(boffMediaEvents)
      .where(
        and(eq(boffMediaEvents.id, eventId), isNull(boffMediaEvents.deletedAt)),
      );
    return row;
  }

  async hasActiveEventMembership(
    eventId: number,
    userId: number,
  ): Promise<boolean> {
    const [row] = await this.db
      .select({ one: sql`1` })
      .from(boffMediaEventParticipants)
      .innerJoin(
        boffMediaParticipants,
        eq(boffMediaParticipants.id, boffMediaEventParticipants.participantId),
      )
      .where(
        and(
          eq(boffMediaEventParticipants.eventId, eventId),
          eq(boffMediaParticipants.userId, userId),
          inArray(boffMediaEventParticipants.status, [
            'registered',
            'confirmed',
          ]),
        ),
      )
      .limit(1);
    return row != null;
  }

  async softDelete(id: number): Promise<void> {
    // When soft-deleting, rename the slug to free it for reuse. A deleted
    // tournament is invisible to all queries (filtered by isNull(deletedAt)),
    // but the slug column is globally unique. By appending a deleted marker,
    // we keep the row findable by id and audit logs while unblocking the slug.
    await this.db
      .update(boffMediaTournaments)
      .set({
        deletedAt: new Date(),
        slug: sql`CONCAT(${boffMediaTournaments.slug}, '__deleted_', ${id})`,
      })
      .where(eq(boffMediaTournaments.id, id));
  }

  // ── participants ────────────────────────────────────────────────────────────
  async addParticipant(
    values: typeof boffMediaTournamentParticipants.$inferInsert,
  ): Promise<number> {
    const [res] = await this.db
      .insert(boffMediaTournamentParticipants)
      .values(values);
    return res.insertId;
  }

  async listParticipants(
    tournamentId: number,
  ): Promise<TournamentParticipant[]> {
    return this.db
      .select()
      .from(boffMediaTournamentParticipants)
      .where(eq(boffMediaTournamentParticipants.tournamentId, tournamentId))
      .orderBy(
        boffMediaTournamentParticipants.seed,
        boffMediaTournamentParticipants.id,
      );
  }

  async findParticipant(
    id: number,
  ): Promise<TournamentParticipant | undefined> {
    const [row] = await this.db
      .select()
      .from(boffMediaTournamentParticipants)
      .where(eq(boffMediaTournamentParticipants.id, id));
    return row;
  }

  async findParticipantByUser(
    tournamentId: number,
    userId: number,
  ): Promise<TournamentParticipant | undefined> {
    const [row] = await this.db
      .select()
      .from(boffMediaTournamentParticipants)
      .where(
        and(
          eq(boffMediaTournamentParticipants.tournamentId, tournamentId),
          eq(boffMediaTournamentParticipants.userId, userId),
        ),
      );
    return row;
  }

  async updateParticipant(
    id: number,
    patch: Partial<typeof boffMediaTournamentParticipants.$inferInsert>,
  ): Promise<void> {
    await this.db
      .update(boffMediaTournamentParticipants)
      .set(patch)
      .where(eq(boffMediaTournamentParticipants.id, id));
  }

  /**
   * Hard-delete a participant only if they have no matches referencing them.
   * Use a row lock to make the check and delete atomic. The check prevents a
   * participant who was seeded into a bracket from being deleted, which would
   * leave matches with empty slots that standings and advancement silently skip.
   *
   * Returns false if the delete was refused (participant in matches);
   * true if the delete succeeded.
   */
  async removeParticipant(
    id: number,
  ): Promise<{ success: boolean; reason?: string }> {
    return this.db.transaction(async (tx) => {
      const [p] = await tx
        .select()
        .from(boffMediaTournamentParticipants)
        .where(eq(boffMediaTournamentParticipants.id, id))
        .for('update');

      if (!p) {
        return { success: false, reason: 'not_found' };
      }

      // Check if this participant is referenced by any match as a player or result.
      // This must be under the lock to prevent a concurrent bracket generation
      // from seeding this participant between the check and the delete.
      const matches = await tx
        .select({ id: boffMediaTournamentMatches.id })
        .from(boffMediaTournamentMatches)
        .where(
          and(
            eq(boffMediaTournamentMatches.tournamentId, p.tournamentId),
            sql`(
              ${boffMediaTournamentMatches.topParticipantId} = ${id}
              OR ${boffMediaTournamentMatches.botParticipantId} = ${id}
              OR ${boffMediaTournamentMatches.winnerParticipantId} = ${id}
              OR ${boffMediaTournamentMatches.proposedByParticipantId} = ${id}
            )`,
          ),
        )
        .limit(1);

      if (matches.length > 0) {
        return {
          success: false,
          reason: 'in_bracket',
        };
      }

      await tx
        .delete(boffMediaTournamentParticipants)
        .where(eq(boffMediaTournamentParticipants.id, id));

      return { success: true };
    });
  }

  // ── roster ──────────────────────────────────────────────────────────────────
  async addRosterMembers(
    rows: (typeof boffMediaTournamentRoster.$inferInsert)[],
  ): Promise<void> {
    if (rows.length === 0) return;
    await this.db.insert(boffMediaTournamentRoster).values(rows);
  }

  async listRoster(
    participantIds: number[],
  ): Promise<TournamentRosterMember[]> {
    if (participantIds.length === 0) return [];
    return this.db
      .select()
      .from(boffMediaTournamentRoster)
      .where(inArray(boffMediaTournamentRoster.participantId, participantIds));
  }

  async clearRoster(participantId: number): Promise<void> {
    await this.db
      .delete(boffMediaTournamentRoster)
      .where(eq(boffMediaTournamentRoster.participantId, participantId));
  }

  // ── groups ──────────────────────────────────────────────────────────────────
  async createGroup(
    values: typeof boffMediaTournamentGroups.$inferInsert,
  ): Promise<number> {
    const [res] = await this.db
      .insert(boffMediaTournamentGroups)
      .values(values);
    return res.insertId;
  }

  async listGroups(tournamentId: number): Promise<TournamentGroup[]> {
    return this.db
      .select()
      .from(boffMediaTournamentGroups)
      .where(eq(boffMediaTournamentGroups.tournamentId, tournamentId))
      .orderBy(boffMediaTournamentGroups.order);
  }

  async deleteGroups(tournamentId: number): Promise<void> {
    await this.db
      .delete(boffMediaTournamentGroups)
      .where(eq(boffMediaTournamentGroups.tournamentId, tournamentId));
  }

  async deleteGroupsByPhase(phaseId: number): Promise<void> {
    await this.db
      .delete(boffMediaTournamentGroups)
      .where(eq(boffMediaTournamentGroups.phaseId, phaseId));
  }

  // ── matches ──────────────────────────────────────────────────────────────────
  async insertMatch(
    values: typeof boffMediaTournamentMatches.$inferInsert,
  ): Promise<number> {
    const [res] = await this.db
      .insert(boffMediaTournamentMatches)
      .values(values);
    return res.insertId;
  }

  async listMatches(tournamentId: number): Promise<TournamentMatch[]> {
    return this.db
      .select()
      .from(boffMediaTournamentMatches)
      .where(eq(boffMediaTournamentMatches.tournamentId, tournamentId))
      .orderBy(
        boffMediaTournamentMatches.bracket,
        boffMediaTournamentMatches.roundNumber,
        boffMediaTournamentMatches.position,
      );
  }

  async findMatch(id: number): Promise<TournamentMatch | undefined> {
    const [row] = await this.db
      .select()
      .from(boffMediaTournamentMatches)
      .where(eq(boffMediaTournamentMatches.id, id));
    return row;
  }

  async updateMatch(
    id: number,
    patch: Partial<typeof boffMediaTournamentMatches.$inferInsert>,
  ): Promise<void> {
    await this.db
      .update(boffMediaTournamentMatches)
      .set(patch)
      .where(eq(boffMediaTournamentMatches.id, id));
  }

  /**
   * Atomically write a settlement onto a match. A normal settle refuses a match
   * that is already resolved, so the three writers that can land on one match
   * (rival confirm, proposal expiry, admin report) cannot each propagate the
   * same result — the loser gets `false` instead of silently re-advancing a
   * winner into the next round. An amend deliberately targets a resolved match,
   * so it skips the status guard; `matches.report` gates that on `assertAmendable`.
   *
   * Every settlement patch carries a fresh `reportedAt`, so the row always
   * changes when it matches and mysql2's `affectedRows` is a faithful "I won".
   *
   * For amends (allowResolved=true), optional `expectedVersion` enables
   * optimistic concurrency: the update succeeds only if the match has not been
   * amended again since the admin last loaded it. Omit for non-amend paths.
   */
  async claimSettlement(
    matchId: number,
    patch: Partial<typeof boffMediaTournamentMatches.$inferInsert>,
    opts: {
      allowResolved: boolean;
      expectedVersion?: number;
    },
  ): Promise<boolean> {
    const conditions = [eq(boffMediaTournamentMatches.id, matchId)];

    // For non-amend paths: enforce that the match is not yet settled.
    if (!opts.allowResolved) {
      conditions.push(
        notInArray(boffMediaTournamentMatches.status, ['completed', 'bye']),
      );
    }

    // For amend paths with optimistic concurrency: enforce version match.
    //
    // Fail closed. `allowResolved` drops the status guard, so the version IS the
    // guard on this path; treating a missing version as "no condition" would
    // leave the bare `WHERE id = ?` that lets two concurrent amends overwrite
    // one another. A caller that reaches here without one is a programming
    // error, not a request to skip the check.
    if (opts.allowResolved) {
      if (opts.expectedVersion === undefined) {
        throw new Error(
          'claimSettlement: an amend requires expectedVersion (optimistic concurrency)',
        );
      }
      conditions.push(
        eq(boffMediaTournamentMatches.version, opts.expectedVersion),
      );
    }

    const [res] = await this.db
      .update(boffMediaTournamentMatches)
      .set(patch)
      .where(and(...conditions));

    return res.affectedRows > 0;
  }

  async setMatchSlot(
    matchId: number,
    slot: MatchSlot,
    participantId: number,
  ): Promise<void> {
    const patch =
      slot === 'top'
        ? { topParticipantId: participantId }
        : { botParticipantId: participantId };
    await this.db
      .update(boffMediaTournamentMatches)
      .set(patch)
      .where(eq(boffMediaTournamentMatches.id, matchId));
  }

  async deleteMatches(tournamentId: number): Promise<void> {
    await this.db
      .delete(boffMediaTournamentMatches)
      .where(eq(boffMediaTournamentMatches.tournamentId, tournamentId));
  }

  async deleteMatchesByPhase(phaseId: number): Promise<void> {
    await this.db
      .delete(boffMediaTournamentMatches)
      .where(eq(boffMediaTournamentMatches.phaseId, phaseId));
  }

  /** Tag freshly-built (untagged) matches with the phase that generated them. */
  async assignOrphanMatchesToPhase(
    tournamentId: number,
    phaseId: number,
  ): Promise<void> {
    await this.db
      .update(boffMediaTournamentMatches)
      .set({ phaseId })
      .where(
        and(
          eq(boffMediaTournamentMatches.tournamentId, tournamentId),
          isNull(boffMediaTournamentMatches.phaseId),
        ),
      );
  }

  async listMatchesByPhase(phaseId: number): Promise<TournamentMatch[]> {
    return this.db
      .select()
      .from(boffMediaTournamentMatches)
      .where(eq(boffMediaTournamentMatches.phaseId, phaseId))
      .orderBy(
        boffMediaTournamentMatches.bracket,
        boffMediaTournamentMatches.roundNumber,
        boffMediaTournamentMatches.position,
      );
  }

  async setMatchStatus(id: number, status: MatchStatus): Promise<void> {
    await this.db
      .update(boffMediaTournamentMatches)
      .set({ status })
      .where(eq(boffMediaTournamentMatches.id, id));
  }

  // ── self-report proposals ─────────────────────────────────────────────────────
  /**
   * Atomically claim an open match for a new proposal (no active proposal,
   * match still playable). True when this call won the slot — a concurrent
   * rival proposal loses instead of silently overwriting.
   */
  async claimProposal(
    matchId: number,
    values: {
      proposedByParticipantId: number;
      proposedTopScore: number;
      proposedBotScore: number;
      proposedGames: string;
      proposedAt: Date;
      proposalExpiresAt: Date;
    },
  ): Promise<boolean> {
    const [res] = await this.db
      .update(boffMediaTournamentMatches)
      .set({ ...values, proposalState: 'pending' })
      .where(
        and(
          eq(boffMediaTournamentMatches.id, matchId),
          isNull(boffMediaTournamentMatches.proposedByParticipantId),
          inArray(boffMediaTournamentMatches.status, ['ready', 'live']),
        ),
      );
    return res.affectedRows > 0;
  }

  /**
   * Atomically claim an expired pending proposal for auto-verification (state
   * flips pending→null so concurrent settlers can't double-finalize).
   */
  async claimExpiredProposal(matchId: number, now: Date): Promise<boolean> {
    const [res] = await this.db
      .update(boffMediaTournamentMatches)
      .set({ proposalState: null })
      .where(
        and(
          eq(boffMediaTournamentMatches.id, matchId),
          eq(boffMediaTournamentMatches.proposalState, 'pending'),
          lt(boffMediaTournamentMatches.proposalExpiresAt, now),
          inArray(boffMediaTournamentMatches.status, ['ready', 'live']),
        ),
      );
    return res.affectedRows > 0;
  }

  /**
   * Atomically flip a still-pending proposal to disputed. Guarded the same way
   * as the claims above: an admin report or an expiry sweep that lands first
   * must not be re-opened into a dispute on an already-settled match.
   */
  async claimDispute(
    matchId: number,
    proposedByParticipantId: number,
    judgeRequestedAt: Date,
  ): Promise<boolean> {
    const [res] = await this.db
      .update(boffMediaTournamentMatches)
      .set({ proposalState: 'disputed', judgeRequestedAt })
      .where(
        and(
          eq(boffMediaTournamentMatches.id, matchId),
          eq(boffMediaTournamentMatches.proposalState, 'pending'),
          eq(
            boffMediaTournamentMatches.proposedByParticipantId,
            proposedByParticipantId,
          ),
          inArray(boffMediaTournamentMatches.status, ['ready', 'live']),
        ),
      );
    return res.affectedRows > 0;
  }

  async listExpiredProposalMatches(
    tournamentId: number,
    now: Date,
  ): Promise<TournamentMatch[]> {
    return this.db
      .select()
      .from(boffMediaTournamentMatches)
      .where(
        and(
          eq(boffMediaTournamentMatches.tournamentId, tournamentId),
          eq(boffMediaTournamentMatches.proposalState, 'pending'),
          lt(boffMediaTournamentMatches.proposalExpiresAt, now),
          inArray(boffMediaTournamentMatches.status, ['ready', 'live']),
        ),
      );
  }

  // ── match chat ────────────────────────────────────────────────────────────────
  async addMatchMessage(
    values: typeof boffMediaTournamentMatchMessages.$inferInsert,
  ): Promise<number> {
    const [res] = await this.db
      .insert(boffMediaTournamentMatchMessages)
      .values(values);
    return res.insertId;
  }

  async listMatchMessages(
    matchId: number,
    afterId = 0,
  ): Promise<TournamentMatchMessage[]> {
    return this.db
      .select()
      .from(boffMediaTournamentMatchMessages)
      .where(
        and(
          eq(boffMediaTournamentMatchMessages.matchId, matchId),
          sql`${boffMediaTournamentMatchMessages.id} > ${afterId}`,
        ),
      )
      .orderBy(boffMediaTournamentMatchMessages.id);
  }

  /** Tournaments the user has entered, newest first (for the profile panel). */
  async listByParticipantUser(userId: number): Promise<
    (TournamentListRow & {
      myParticipantId: number;
      myStatus: string;
    })[]
  > {
    const champ = alias(boffMediaTournamentParticipants, 'champ');
    const rows = await this.db
      .select({
        t: boffMediaTournaments,
        gameTitle: boffMediaGames.title,
        championName: champ.name,
        myParticipantId: boffMediaTournamentParticipants.id,
        myStatus: boffMediaTournamentParticipants.status,
      })
      .from(boffMediaTournamentParticipants)
      .innerJoin(
        boffMediaTournaments,
        eq(
          boffMediaTournamentParticipants.tournamentId,
          boffMediaTournaments.id,
        ),
      )
      .leftJoin(
        boffMediaGames,
        eq(boffMediaTournaments.gameId, boffMediaGames.id),
      )
      .leftJoin(champ, eq(boffMediaTournaments.championParticipantId, champ.id))
      .where(
        and(
          eq(boffMediaTournamentParticipants.userId, userId),
          isNull(boffMediaTournaments.deletedAt),
        ),
      )
      .orderBy(desc(boffMediaTournaments.createdAt));
    return rows.map((r) => ({
      ...r.t,
      gameTitle: r.gameTitle,
      championName: r.championName,
      myParticipantId: r.myParticipantId,
      myStatus: r.myStatus,
    }));
  }

  // ── phases ──────────────────────────────────────────────────────────────────
  async createPhase(
    values: typeof boffMediaTournamentPhases.$inferInsert,
  ): Promise<number> {
    const [res] = await this.db
      .insert(boffMediaTournamentPhases)
      .values(values);
    return res.insertId;
  }

  async listPhases(tournamentId: number): Promise<TournamentPhase[]> {
    return this.db
      .select()
      .from(boffMediaTournamentPhases)
      .where(eq(boffMediaTournamentPhases.tournamentId, tournamentId))
      .orderBy(boffMediaTournamentPhases.phaseOrder);
  }

  async findPhase(id: number): Promise<TournamentPhase | undefined> {
    const [row] = await this.db
      .select()
      .from(boffMediaTournamentPhases)
      .where(eq(boffMediaTournamentPhases.id, id));
    return row;
  }

  async findLivePhase(
    tournamentId: number,
  ): Promise<TournamentPhase | undefined> {
    const [row] = await this.db
      .select()
      .from(boffMediaTournamentPhases)
      .where(
        and(
          eq(boffMediaTournamentPhases.tournamentId, tournamentId),
          eq(boffMediaTournamentPhases.status, 'live'),
        ),
      )
      .orderBy(boffMediaTournamentPhases.phaseOrder);
    return row;
  }

  async updatePhase(
    id: number,
    patch: Partial<typeof boffMediaTournamentPhases.$inferInsert>,
  ): Promise<void> {
    await this.db
      .update(boffMediaTournamentPhases)
      .set(patch)
      .where(eq(boffMediaTournamentPhases.id, id));
  }

  async deletePhase(id: number): Promise<void> {
    await this.db
      .delete(boffMediaTournamentPhases)
      .where(eq(boffMediaTournamentPhases.id, id));
  }

  // ── phase entrants ────────────────────────────────────────────────────────────
  async addPhaseEntrants(
    rows: (typeof boffMediaTournamentPhaseEntrants.$inferInsert)[],
  ): Promise<void> {
    if (rows.length === 0) return;
    await this.db.insert(boffMediaTournamentPhaseEntrants).values(rows);
  }

  async clearPhaseEntrants(phaseId: number): Promise<void> {
    await this.db
      .delete(boffMediaTournamentPhaseEntrants)
      .where(eq(boffMediaTournamentPhaseEntrants.phaseId, phaseId));
  }

  async listPhaseEntrants(phaseId: number): Promise<TournamentPhaseEntrant[]> {
    return this.db
      .select()
      .from(boffMediaTournamentPhaseEntrants)
      .where(eq(boffMediaTournamentPhaseEntrants.phaseId, phaseId))
      .orderBy(boffMediaTournamentPhaseEntrants.seed);
  }

  /** All entrants across a tournament's phases (one query, grouped by caller). */
  async listPhaseEntrantsForTournament(
    tournamentId: number,
  ): Promise<TournamentPhaseEntrant[]> {
    return this.db
      .select({
        id: boffMediaTournamentPhaseEntrants.id,
        phaseId: boffMediaTournamentPhaseEntrants.phaseId,
        participantId: boffMediaTournamentPhaseEntrants.participantId,
        seed: boffMediaTournamentPhaseEntrants.seed,
        sourceRank: boffMediaTournamentPhaseEntrants.sourceRank,
        sourceRecord: boffMediaTournamentPhaseEntrants.sourceRecord,
        createdAt: boffMediaTournamentPhaseEntrants.createdAt,
      })
      .from(boffMediaTournamentPhaseEntrants)
      .innerJoin(
        boffMediaTournamentPhases,
        eq(
          boffMediaTournamentPhaseEntrants.phaseId,
          boffMediaTournamentPhases.id,
        ),
      )
      .where(eq(boffMediaTournamentPhases.tournamentId, tournamentId))
      .orderBy(boffMediaTournamentPhaseEntrants.seed);
  }

  // ── users (display defaults for self-registration) ───────────────────────────
  async findUserBasic(
    userId: number,
  ): Promise<{ username: string; profilePicture: string | null } | undefined> {
    const [row] = await this.db
      .select({
        username: boffMediaUsers.username,
        profilePicture: boffMediaUsers.profilePicture,
      })
      .from(boffMediaUsers)
      .where(eq(boffMediaUsers.id, userId));
    return row;
  }
}
