import { Injectable, Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and, isNull, or } from 'drizzle-orm';
import { alias } from 'drizzle-orm/mysql-core';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import { boffMediaEvents, boffMediaGames, Event } from '@/_db/schema/Events';

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
      conditions.push(eq(boffMediaEvents.visibility, 'public'));
    }

    const query = this.db
      .select({
        ...this.eventSelect,
        gameName: boffMediaGames.title,
        parentEventName: parentEvent.title,
      })
      .from(boffMediaEvents)
      .leftJoin(boffMediaGames, eq(boffMediaGames.id, boffMediaEvents.gameId))
      .leftJoin(parentEvent, eq(parentEvent.id, boffMediaEvents.parentId))
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
