import { Injectable, Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and, isNull } from 'drizzle-orm';
import { DRIZZLE } from '@/drizzle/drizzle.module';
import { 
  boffMediaEvents, 
  boffMediaGames, 
  Event 
} from '@/_db/schema/Events';

@Injectable()
export class EventsRepository {
  constructor(
    @Inject(DRIZZLE) private db: MySql2Database<Record<string, never>>,
  ) {}

  async findAll(): Promise<Event[]> {
    return this.db.select({
      id: boffMediaEvents.id,
      parentId: boffMediaEvents.parentId,
      title: boffMediaEvents.title,
      description: boffMediaEvents.description,
      gameId: boffMediaEvents.gameId,
      gameName: boffMediaGames.title,
      icon: boffMediaEvents.icon,
      banner: boffMediaEvents.banner,
      startDate: boffMediaEvents.startDate,
      endDate: boffMediaEvents.endDate,
      status: boffMediaEvents.status,
      visibility: boffMediaEvents.visibility,
      type: boffMediaEvents.type,
      createdAt: boffMediaEvents.createdAt,
      updatedAt: boffMediaEvents.updatedAt,boffMediaEvents,
      deletedAt: boffMediaEvents.deletedAt,
    })
    .from(boffMediaEvents)
    .leftJoin(boffMediaGames, eq(boffMediaGames.id, boffMediaEvents.gameId))
    .where(and(isNull(boffMediaEvents.deletedAt), isNull(boffMediaGames.deletedAt)));
  }

  async findById(id: number): Promise<Event> {
    const result = await this.db.select()
      .from(boffMediaEvents)
      .leftJoin(boffMediaGames, eq(boffMediaGames.id, boffMediaEvents.gameId))
      .where(and(
        eq(boffMediaEvents.id, id), 
        isNull(boffMediaEvents.deletedAt),
        isNull(boffMediaGames.deletedAt)
      ));
      
    if (!result.length) return null;
    
    const eventData = result[0].boffmedia_events;
    const gameData = result[0].boffmedia_games;
    
    return {
      id: eventData.id,
      parentId: eventData.parentId,
      title: eventData.title,
      description: eventData.description,
      gameId: eventData.gameId,
      gameName: gameData?.title,
      icon: eventData.icon,
      banner: eventData.banner,
      startDate: eventData.startDate,
      endDate: eventData.endDate,
      status: eventData.status,
      visibility: eventData.visibility,
      type: eventData.type,
      createdAt: eventData.createdAt,
      updatedAt: eventData.updatedAt,
      deletedAt: eventData.deletedAt,
    } as Event;
  }

  async findChildEvents(parentId: number): Promise<Event[]> {
    return this.db.select({
      id: boffMediaEvents.id,
      parentId: boffMediaEvents.parentId,
      title: boffMediaEvents.title,
      description: boffMediaEvents.description,
      gameId: boffMediaEvents.gameId,
      gameName: boffMediaGames.title,
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
    })
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