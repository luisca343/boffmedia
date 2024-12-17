/*
import { Injectable } from '@nestjs/common';
import { MySQL2Service } from '@/_utils/MySQL2Service';
import { boffMediaEvents, boffMediaGames, boffMediaAchievements, Event, Game, Achievement } from 'src/_db/schema/Events';
import { eq } from 'drizzle-orm';

@Injectable()
export class EventsService {
  constructor(private db: MySQL2Service) {}

  async getEvents(): Promise<Event[]> {
    return this.db.getDrizzle().select().from(boffMediaEvents).execute();
  }

  async getEvent(id: number): Promise<Event | null> {
    const events = await this.db.getDrizzle()
      .select()
      .from(boffMediaEvents)
      .where(eq(boffMediaEvents.id, id))
      .execute();
    return events[0] || null;
  }

  async createEvent(eventData: Omit<Event, 'id'>) {
    const [createdEvent] = await this.db.getDrizzle()
      .insert(boffMediaEvents)
      .values(eventData)
      .execute();
    return createdEvent;
  }

  async getGames(): Promise<Game[]> {
    return this.db.getDrizzle().select().from(boffMediaGames).execute();
  }

  async getAchievements(eventId: number): Promise<Achievement[]> {
    return this.db.getDrizzle()
      .select()
      .from(boffMediaAchievements)
      .where(eq(boffMediaAchievements.eventId, eventId))
      .execute();
  }
}*/