import { Injectable, Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and, isNull } from 'drizzle-orm';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import {
  boffMediaGames,
  boffMediaEvents,
  Game,
  Event,
} from '@/_db/schema/Events';

@Injectable()
export class GamesRepository {
  constructor(
    @Inject(DRIZZLE) private db: MySql2Database<Record<string, never>>,
  ) {}

  private readonly gameSelect = {
    id: boffMediaGames.id,
    title: boffMediaGames.title,
    description: boffMediaGames.description,
    icon: boffMediaGames.icon,
    createdAt: boffMediaGames.createdAt,
    updatedAt: boffMediaGames.updatedAt,
    deletedAt: boffMediaGames.deletedAt,
  };

  async findAll(): Promise<Game[]> {
    return this.db
      .select(this.gameSelect)
      .from(boffMediaGames)
      .where(isNull(boffMediaGames.deletedAt));
  }

  async findById(id: number): Promise<Game | null> {
    const result = await this.db
      .select(this.gameSelect)
      .from(boffMediaGames)
      .where(and(eq(boffMediaGames.id, id), isNull(boffMediaGames.deletedAt)));

    if (!result.length) return null;
    return result[0];
  }

  async create(gameData: Partial<Game>): Promise<{ insertId: number }> {
    const result = await this.db.insert(boffMediaGames).values({
      ...gameData,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Game);

    return { insertId: result[0].insertId };
  }

  async update(id: number, gameData: Partial<Game>): Promise<void> {
    await this.db
      .update(boffMediaGames)
      .set({
        ...gameData,
        updatedAt: new Date(),
      } as Game)
      .where(eq(boffMediaGames.id, id));
  }

  async softDelete(id: number): Promise<void> {
    const now = new Date();
    await this.db
      .update(boffMediaGames)
      .set({ deletedAt: now } as Game)
      .where(eq(boffMediaGames.id, id));
  }

  async softDeleteEventsByGame(gameId: number): Promise<void> {
    const now = new Date();
    await this.db
      .update(boffMediaEvents)
      .set({ deletedAt: now } as Event)
      .where(eq(boffMediaEvents.gameId, gameId)); // Fixed field reference
  }

  async checkGameExists(gameId: number): Promise<boolean> {
    const gameCheck = await this.db
      .select({ id: boffMediaGames.id })
      .from(boffMediaGames)
      .where(
        and(eq(boffMediaGames.id, gameId), isNull(boffMediaGames.deletedAt)),
      );

    return gameCheck.length > 0;
  }
}
