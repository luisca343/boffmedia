import { Injectable, Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and, isNull, or, inArray, exists, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/mysql-core';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import {
  boffMediaEvents,
  boffMediaGames,
  boffMediaParticipants,
  boffMediaEventParticipants,
  Event,
  PARTICIPANT_STATUS,
} from '@/_db/schema/BoffMediaEvents';
// Schema-level import only, exactly like the packs entitlement predicate below:
// depending on the randomizer *module* here would close a cycle, since the
// randomizer already depends on events.
import { randomizerConfigs } from '@/_db/schema/Randomizer';
import { boffMediaTournaments } from '@/_db/schema/BoffMediaTournaments';

const ACTIVE_MEMBERSHIP_STATUSES = [
  PARTICIPANT_STATUS.REGISTERED,
  PARTICIPANT_STATUS.CONFIRMED,
] as const;

export interface EventWithGameNameAndParent extends Event {
  gameName?: string;
  parentEventName?: string;
}

export interface FindEventsFilters {
  status?: 'upcoming' | 'active' | 'completed';
  gameId?: number;
  type?: 'event' | 'server';
  limit?: number;
  offset?: number;
  /** When false/undefined, only `public`-visibility events are returned. */
  includePrivate?: boolean;
  /** Requester: private events they actively participate in are listed too. */
  userId?: number;
}

@Injectable()
export class EventsRepository {
  constructor(
    @Inject(DRIZZLE) private db: MySql2Database<Record<string, never>>,
  ) {}

  private readonly eventSelect = {
    id: boffMediaEvents.id,
    parentId: boffMediaEvents.parentId,
    title: boffMediaEvents.title,
    description: boffMediaEvents.description,
    gameId: boffMediaEvents.gameId,
    icon: boffMediaEvents.icon,
    banner: boffMediaEvents.banner,
    startDate: boffMediaEvents.startDate,
    endDate: boffMediaEvents.endDate,
    status: boffMediaEvents.status,
    visibility: boffMediaEvents.visibility,
    type: boffMediaEvents.type,
    // Exposed because entitlement now derives from event membership: a client
    // that cannot see which pack an event carries cannot explain the access.
    packId: boffMediaEvents.packId,
    createdAt: boffMediaEvents.createdAt,
    updatedAt: boffMediaEvents.updatedAt,
    deletedAt: boffMediaEvents.deletedAt,
  };

  async findAll(
    filters: FindEventsFilters = {},
  ): Promise<EventWithGameNameAndParent[]> {
    const parentEvent = alias(boffMediaEvents, 'parentEvent');

    const conditions = [
      isNull(boffMediaEvents.deletedAt),
      or(isNull(boffMediaEvents.gameId), isNull(boffMediaGames.deletedAt)),
    ];
    if (filters.status) {
      conditions.push(eq(boffMediaEvents.status, filters.status));
    }
    if (filters.gameId !== undefined) {
      conditions.push(eq(boffMediaEvents.gameId, filters.gameId));
    }
    if (filters.type) {
      conditions.push(eq(boffMediaEvents.type, filters.type));
    }
    if (!filters.includePrivate) {
      if (filters.userId) {
        conditions.push(
          or(
            eq(boffMediaEvents.visibility, 'public'),
            exists(this.activeMembershipSubquery(filters.userId)),
          )!,
        );
      } else {
        conditions.push(eq(boffMediaEvents.visibility, 'public'));
      }
    }

    // Subquery: count participants per event (those with active membership)
    const participantCountSubquery = this.db
      .select({
        eventId: boffMediaEventParticipants.eventId,
        count: sql<number>`COUNT(*)`,
      })
      .from(boffMediaEventParticipants)
      .groupBy(boffMediaEventParticipants.eventId)
      .as('participant_count');

    const query = this.db
      .select({
        ...this.eventSelect,
        gameName: boffMediaGames.title,
        parentEventName: parentEvent.title,
        participantCount: participantCountSubquery.count,
      })
      .from(boffMediaEvents)
      .leftJoin(boffMediaGames, eq(boffMediaGames.id, boffMediaEvents.gameId))
      .leftJoin(parentEvent, eq(parentEvent.id, boffMediaEvents.parentId))
      .leftJoin(
        participantCountSubquery,
        eq(participantCountSubquery.eventId, boffMediaEvents.id),
      )
      .where(and(...conditions))
      // Deterministic order so pagination is stable (matches prior PK order).
      .orderBy(boffMediaEvents.id)
      .$dynamic();

    // MySQL needs a LIMIT to accept an OFFSET; use a large sentinel when only
    // offset is given.
    if (filters.limit !== undefined || filters.offset !== undefined) {
      query.limit(filters.limit ?? Number.MAX_SAFE_INTEGER);
      if (filters.offset !== undefined) query.offset(filters.offset);
    }

    return (await query) as unknown as EventWithGameNameAndParent[];
  }

  async findById(
    id: number,
    includePrivate = false,
  ): Promise<EventWithGameNameAndParent | null> {
    const parentEvent = alias(boffMediaEvents, 'parentEvent');

    const conditions = [
      eq(boffMediaEvents.id, id),
      isNull(boffMediaEvents.deletedAt),
      or(isNull(boffMediaEvents.gameId), isNull(boffMediaGames.deletedAt)),
    ];
    // Non-admins can't fetch a private event by id (returned as not-found so it
    // leaks nothing — same shape as a missing/soft-deleted event).
    if (!includePrivate) {
      conditions.push(eq(boffMediaEvents.visibility, 'public'));
    }

    const result = await this.db
      .select({
        ...this.eventSelect,
        gameName: boffMediaGames.title,
        parentEventName: parentEvent.title,
      })
      .from(boffMediaEvents)
      .leftJoin(boffMediaGames, eq(boffMediaGames.id, boffMediaEvents.gameId))
      .leftJoin(parentEvent, eq(parentEvent.id, boffMediaEvents.parentId))
      .where(and(...conditions));

    return (result.length
      ? result[0]
      : null) as unknown as EventWithGameNameAndParent | null;
  }

  /**
   * Which optional modules the event has. Nothing is stored on the event row:
   * the satellite tables keyed on `event_id` are the source of truth, so this
   * cannot go stale the way a declared-state column would.
   *
   * `draft` collapses to null on purpose. Drafts are admin-only, and the admin
   * panel reads the randomizer's own endpoint rather than this field — mapping
   * it here keeps a draft out of every public payload by construction instead
   * of relying on each caller to filter it.
   */
  async findModules(eventId: number): Promise<{
    randomizer: 'open' | 'closed' | 'published' | null;
    tournament: {
      id: number;
      slug: string;
      name: string;
      status: string;
    } | null;
  }> {
    const [rows, tournaments] = await Promise.all([
      this.db
        .select({ status: randomizerConfigs.status })
        .from(randomizerConfigs)
        .where(eq(randomizerConfigs.eventId, eventId))
        .limit(1),
      // Same schema-level reach as the randomizer above, and for the same
      // reason: the tournaments module already depends on events.
      this.db
        .select({
          id: boffMediaTournaments.id,
          slug: boffMediaTournaments.slug,
          name: boffMediaTournaments.name,
          status: boffMediaTournaments.status,
        })
        .from(boffMediaTournaments)
        .where(
          and(
            eq(boffMediaTournaments.eventId, eventId),
            isNull(boffMediaTournaments.deletedAt),
          ),
        )
        .limit(1),
    ]);

    const status = rows[0]?.status;
    return {
      randomizer:
        status === 'open' || status === 'closed' || status === 'published'
          ? status
          : null,
      tournament: tournaments[0] ?? null,
    };
  }

  /**
   * Check if any non-soft-deleted tournaments are attached to this event.
   * The lifecycle rule is: an event cannot be deleted while tournaments depend on it.
   */
  async hasAttachedTournaments(eventId: number): Promise<boolean> {
    const [row] = await this.db
      .select({ count: sql<number>`1` })
      .from(boffMediaTournaments)
      .where(
        and(
          eq(boffMediaTournaments.eventId, eventId),
          isNull(boffMediaTournaments.deletedAt),
        ),
      )
      .limit(1);
    return !!row;
  }

  /** Correlated EXISTS: the user holds an active membership in the outer event. */
  private activeMembershipSubquery(userId: number) {
    return this.db
      .select({ one: sql`1` })
      .from(boffMediaEventParticipants)
      .innerJoin(
        boffMediaParticipants,
        eq(boffMediaParticipants.id, boffMediaEventParticipants.participantId),
      )
      .where(
        and(
          eq(boffMediaEventParticipants.eventId, boffMediaEvents.id),
          eq(boffMediaParticipants.userId, userId),
          inArray(boffMediaEventParticipants.status, [
            ...ACTIVE_MEMBERSHIP_STATUSES,
          ]),
        ),
      );
  }

  /**
   * True when the user holds an active (`registered`/`confirmed`) membership.
   * `removed`/`declined` rows deliberately do not count: this predicate drives
   * private-event visibility, and an expelled user must lose read access —
   * matching the predicate packs entitlement uses.
   */
  async isParticipant(eventId: number, userId: number): Promise<boolean> {
    if (!eventId || !userId) return false;
    const rows = await this.db
      .select({ id: boffMediaEventParticipants.id })
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
            ...ACTIVE_MEMBERSHIP_STATUSES,
          ]),
        ),
      )
      .limit(1);
    return rows.length > 0;
  }

  /**
   * Of the given event ids, the private ones this viewer may NOT see (i.e. is
   * neither admin — handled by the caller — nor an active participant of).
   */
  async hiddenPrivateEventIds(
    eventIds: (number | null | undefined)[],
    userId?: number,
  ): Promise<Set<number>> {
    const ids = [...new Set(eventIds.filter((id): id is number => !!id))];
    if (ids.length === 0) return new Set();

    const privateRows = await this.db
      .select({ id: boffMediaEvents.id })
      .from(boffMediaEvents)
      .where(
        and(
          inArray(boffMediaEvents.id, ids),
          eq(boffMediaEvents.visibility, 'private'),
        ),
      );
    const hidden = new Set(privateRows.map((r) => r.id));
    if (hidden.size === 0 || !userId) return hidden;

    const memberRows = await this.db
      .select({ eventId: boffMediaEventParticipants.eventId })
      .from(boffMediaEventParticipants)
      .innerJoin(
        boffMediaParticipants,
        eq(boffMediaParticipants.id, boffMediaEventParticipants.participantId),
      )
      .where(
        and(
          inArray(boffMediaEventParticipants.eventId, [...hidden]),
          eq(boffMediaParticipants.userId, userId),
          inArray(boffMediaEventParticipants.status, [
            ...ACTIVE_MEMBERSHIP_STATUSES,
          ]),
        ),
      );
    for (const r of memberRows) hidden.delete(r.eventId);
    return hidden;
  }

  async findChildEvents(
    parentId: number,
    includePrivate = false,
  ): Promise<EventWithGameNameAndParent[]> {
    const parentEvent = alias(boffMediaEvents, 'parentEvent');

    const conditions = [
      eq(boffMediaEvents.parentId, parentId),
      isNull(boffMediaEvents.deletedAt),
      or(isNull(boffMediaEvents.gameId), isNull(boffMediaGames.deletedAt)),
    ];
    if (!includePrivate) {
      conditions.push(eq(boffMediaEvents.visibility, 'public'));
    }

    return this.db
      .select({
        ...this.eventSelect,
        gameName: boffMediaGames.title,
        parentEventName: parentEvent.title,
      })
      .from(boffMediaEvents)
      .leftJoin(boffMediaGames, eq(boffMediaGames.id, boffMediaEvents.gameId))
      .leftJoin(parentEvent, eq(parentEvent.id, boffMediaEvents.parentId))
      .where(and(...conditions)) as unknown as EventWithGameNameAndParent[];
  }

  async create(eventData: Partial<Event>): Promise<{ insertId: number }> {
    const result = await this.db.insert(boffMediaEvents).values({
      ...eventData,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Event);

    return { insertId: result[0].insertId };
  }

  async update(id: number, eventData: Partial<Event>): Promise<void> {
    await this.db
      .update(boffMediaEvents)
      .set({
        ...eventData,
        updatedAt: new Date(),
      } as Event)
      .where(eq(boffMediaEvents.id, id));
  }

  async setStatus(
    id: number,
    status: 'upcoming' | 'active' | 'completed',
  ): Promise<void> {
    await this.db
      .update(boffMediaEvents)
      .set({ status, updatedAt: new Date() } as Partial<Event>)
      .where(eq(boffMediaEvents.id, id));
  }

  async delete(id: number): Promise<void> {
    await this.db
      .update(boffMediaEvents)
      .set({
        deletedAt: new Date(),
      } as Event)
      .where(eq(boffMediaEvents.id, id));
  }

  async softDelete(id: number): Promise<void> {
    await this.db
      .update(boffMediaEvents)
      .set({
        deletedAt: new Date(),
      } as Partial<Event>)
      .where(eq(boffMediaEvents.id, id));
  }

  async softDeleteChildren(parentId: number): Promise<void> {
    await this.db
      .update(boffMediaEvents)
      .set({
        deletedAt: new Date(),
      } as Partial<Event>)
      .where(eq(boffMediaEvents.parentId, parentId));
  }
}
