import { Inject, Injectable } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { and, desc, eq, inArray, isNull, like, lt, sql } from 'drizzle-orm';
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
} from '@/_db/schema/Tournaments';
import { boffMediaGames } from '@/_db/schema/Events';
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
      .leftJoin(
        champ,
        eq(boffMediaTournaments.championParticipantId, champ.id),
      )
      .where(
        and(
          eq(boffMediaTournaments.slug, slug),
          isNull(boffMediaTournaments.deletedAt),
        ),
      );
    if (!row) return undefined;
    return { ...row.t, gameTitle: row.gameTitle, championName: row.championName };
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
    return { ...row.t, gameTitle: row.gameTitle, championName: row.championName };
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
    if (filters.status) where.push(eq(boffMediaTournaments.status, filters.status));
    if (filters.format) where.push(eq(boffMediaTournaments.format, filters.format));
    if (filters.gameId != null)
      where.push(eq(boffMediaTournaments.gameId, filters.gameId));
    if (filters.q) where.push(like(boffMediaTournaments.name, `%${filters.q}%`));

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
      .where(inArray(boffMediaTournamentParticipants.tournamentId, tournamentIds))
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

  async softDelete(id: number): Promise<void> {
    await this.db
      .update(boffMediaTournaments)
      .set({ deletedAt: new Date() })
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

  async removeParticipant(id: number): Promise<void> {
    await this.db
      .delete(boffMediaTournamentParticipants)
      .where(eq(boffMediaTournamentParticipants.id, id));
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

  async listPhaseEntrants(
    phaseId: number,
  ): Promise<TournamentPhaseEntrant[]> {
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
