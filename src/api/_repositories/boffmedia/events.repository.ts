import { Injectable, Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and, isNull } from 'drizzle-orm';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import { boffMediaEvents, boffMediaGames, Event } from '@/_db/schema/Events';

export interface EventWithGameName extends Event {
  gameName?: string;
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

  private readonly eventWithGameSelect = {
    ...this.eventSelect,
    gameName: boffMediaGames.title
  };

  async findAll(): Promise<EventWithGameName[]> {
    return this.db.select(this.eventWithGameSelect)
      .from(boffMediaEvents)
      .leftJoin(boffMediaGames, eq(boffMediaGames.id, boffMediaEvents.gameId))
      .where(and(
        isNull(boffMediaEvents.deletedAt), 
        isNull(boffMediaGames.deletedAt)
      ));
  }

  async findById(id: number): Promise<EventWithGameName | null> {
    const result = await this.db.select(this.eventWithGameSelect)
      .from(boffMediaEvents)
      .leftJoin(boffMediaGames, eq(boffMediaGames.id, boffMediaEvents.gameId))
      .where(and(
        eq(boffMediaEvents.id, id), 
        isNull(boffMediaEvents.deletedAt),
        isNull(boffMediaGames.deletedAt)
      ));
      
    if (!result.length) return null;
    return result[0];
  }

  async findChildEvents(parentId: number): Promise<EventWithGameName[]> {
    return this.db.select(this.eventWithGameSelect)
      .from(boffMediaEvents)
      .leftJoin(boffMediaGames, eq(boffMediaGames.id, boffMediaEvents.gameId))
      .where(and(
        eq(boffMediaEvents.parentId, parentId), 
        isNull(boffMediaEvents.deletedAt),
        isNull(boffMediaGames.deletedAt)
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

  async softDelete(id: number): Promise<void> {
    const now = new Date();
    await this.db.update(boffMediaEvents)
      .set({ deletedAt: now } as Event)
      .where(eq(boffMediaEvents.id, id));
  }

  async softDeleteChildren(parentId: number): Promise<void> {
    const now = new Date();
    await this.db.update(boffMediaEvents)
      .set({ deletedAt: now } as Event)
      .where(eq(boffMediaEvents.parentId, parentId));
  }
}