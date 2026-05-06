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

  async findAll(): Promise<EventWithGameNameAndParent[]> {
    const parentEvent = alias(boffMediaEvents, 'parentEvent') as any;

    return this.db.select({
      ...this.eventSelect,
      gameName: boffMediaGames.title,
      parentEventName: parentEvent.title,
    })
      .from(boffMediaEvents)
      .leftJoin(boffMediaGames, eq(boffMediaGames.id, boffMediaEvents.gameId))
      .leftJoin(parentEvent, eq(parentEvent.id, boffMediaEvents.parentId))
      .where(and(
        isNull(boffMediaEvents.deletedAt),
        or(isNull(boffMediaEvents.gameId), isNull(boffMediaGames.deletedAt))
      ));
  }

  async findById(id: number): Promise<EventWithGameNameAndParent | null> {
    const parentEvent = alias(boffMediaEvents, 'parentEvent') as any;

    const result = await this.db.select({
      ...this.eventSelect,
      gameName: boffMediaGames.title,
      parentEventName: parentEvent.title,
    })
      .from(boffMediaEvents)
      .leftJoin(boffMediaGames, eq(boffMediaGames.id, boffMediaEvents.gameId))
      .leftJoin(parentEvent, eq(parentEvent.id, boffMediaEvents.parentId))
      .where(and(
        eq(boffMediaEvents.id, id), 
        isNull(boffMediaEvents.deletedAt),
        or(isNull(boffMediaEvents.gameId), isNull(boffMediaGames.deletedAt))
      ));

    return result.length ? result[0] : null;
  }

  async findChildEvents(parentId: number): Promise<EventWithGameNameAndParent[]> {
    const parentEvent = alias(boffMediaEvents, 'parentEvent') as any;

    return this.db.select({
      ...this.eventSelect,
      gameName: boffMediaGames.title,
      parentEventName: parentEvent.title,
    })
      .from(boffMediaEvents)
      .leftJoin(boffMediaGames, eq(boffMediaGames.id, boffMediaEvents.gameId))
      .leftJoin(parentEvent, eq(parentEvent.id, boffMediaEvents.parentId))
      .where(and(
        eq(boffMediaEvents.parentId, parentId), 
        isNull(boffMediaEvents.deletedAt),
        or(isNull(boffMediaEvents.gameId), isNull(boffMediaGames.deletedAt))
      ));
  }

  async create(eventData: Partial<Event>): Promise<{ insertId: number }> {
    const result = await this.db.insert(boffMediaEvents)
      .values({
        ...eventData,
        createdAt: new Date(),
        updatedAt: new Date()
      } as Event);
    
    return { insertId: result[0].insertId };
  }

  async update(id: number, eventData: Partial<Event>): Promise<void> {
    await this.db.update(boffMediaEvents)
      .set({
        ...eventData,
        updatedAt: new Date()
      } as Event)
      .where(eq(boffMediaEvents.id, id));
  }

  async delete(id: number): Promise<void> {
    await this.db.update(boffMediaEvents)
      .set({
        deletedAt: new Date()
      } as Event)
      .where(eq(boffMediaEvents.id, id));
  }

  async softDelete(id: number): Promise<void> {
    await this.db.update(boffMediaEvents)
      .set({
        deletedAt: new Date()
      } as Partial<Event>)
      .where(eq(boffMediaEvents.id, id));
  }

  async softDeleteChildren(parentId: number): Promise<void> {
    await this.db.update(boffMediaEvents)
      .set({
        deletedAt: new Date()
      } as Partial<Event>)
      .where(eq(boffMediaEvents.parentId, parentId));
  }
}
