import { Injectable, Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and, isNull } from 'drizzle-orm';
import { DRIZZLE } from '@/drizzle/drizzle.module';
import { 
  boffMediaGames, 
  boffMediaEvents, 
  Game 
} from '@/_db/schema/Events';

@Injectable()
export class GamesRepository {
  constructor(
    @Inject(DRIZZLE) private db: MySql2Database<Record<string, never>>,
  ) {}

  async findAll(): Promise<Game[]> {
    return this.db.select()
      .from(boffMediaGames)
      .where(isNull(boffMediaGames.deletedAt));
  }

  async findById(id: number): Promise<Game> {
    const result = await this.db.select()
      .from(boffMediaGames)
      .where(and(eq(boffMediaGames.id, id), isNull(boffMediaGames.deletedAt)));
    return result[0];
  }

  async create(gameData: Partial<Game>): Promise<{ insertId: number }> {
    const result = await this.db.insert(boffMediaGames)
      .values({
        ...gameData,
        createdAt: new Date(),
        updatedAt: new Date()
      } as Game);
    
    return { insertId: result[0].insertId };
  }

  async update(id: number, gameData: Partial<Game>): Promise<void> {
    await this.db.update(boffMediaGames)
      .set({
        ...gameData,
        updatedAt: new Date()
      } as Game)
      .where(eq(boffMediaGames.id, id));
  }

  async softDelete(id: number): Promise<void> {
    const now = new Date();
    await this.db.update(boffMediaGames)
      .set({ deletedAt: now } as Game)
      .where(eq(boffMediaGames.id, id));
  }

  async softDeleteEventsByGame(gameId: number): Promise<void> {
    const now = new Date();
    await this.db.update(boffMediaEvents)
      .set({ deletedAt: now } as any)
      .where(eq(boffMediaEvents.game, gameId));
  }
}