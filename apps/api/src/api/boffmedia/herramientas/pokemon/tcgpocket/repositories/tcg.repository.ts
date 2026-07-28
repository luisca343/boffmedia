import { Injectable, Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, sql, and } from 'drizzle-orm';
import {
  tcgSeries,
  TcgSeries,
  tcgCards,
  tcgSets,
  tcgUserCards,
  tcgUserCardHistory,
  TcgUserCard,
  TcgUserCardHistory,
} from '@/_db/schema/Tcg';
import { ITcgRepository } from './interfaces/tcg.repository.interface';
import { TcgSeriesDto } from '../dto/tcg-series.dto';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import { Logger } from 'nestjs-pino';

@Injectable()
export class TcgRepository implements ITcgRepository {
  constructor(
    private readonly logger: Logger,

    @Inject(DRIZZLE) private readonly db: MySql2Database<Record<string, never>>,
  ) {}

  // ==================== SERIES OPERATIONS ====================

  async insertSeries(series: TcgSeriesDto[]): Promise<void> {
    try {
      if (series.length === 0) return;

      const existing = await this.db
        .select({ id: tcgSeries.id })
        .from(tcgSeries);
      const existingIds = new Set(existing.map((s) => s.id));

      const newSeries = series.filter((s) => !existingIds.has(s.id));
      if (newSeries.length > 0) {
        const insertData = newSeries.map((s) => ({
          id: s.id,
          nameEn: s.name_en,
          nameEs: s.name_es,
          logo: s.logo || null,
        }));
        await this.db.insert(tcgSeries).values(insertData);
      }
    } catch (error: any) {
      this.logger.error('[TcgRepository] Error inserting series:', error);
      throw error;
    }
  }

  async findAll(): Promise<TcgSeries[]> {
    try {
      return await this.db.select().from(tcgSeries);
    } catch (error: any) {
      this.logger.error('[TcgRepository] Error finding all series:', error);
      throw error;
    }
  }

  async findSeriesById(id: string): Promise<TcgSeries | null> {
    try {
      const result = await this.db
        .select()
        .from(tcgSeries)
        .where(eq(tcgSeries.id, id))
        .limit(1);

      return result[0] || null;
    } catch (error: any) {
      this.logger.error(
        `[TcgRepository] Error finding series by ID ${id}:`,
        error,
      );
      throw error;
    }
  }

  async checkIfSeriesExists(id: string): Promise<boolean> {
    try {
      const result = await this.db
        .select({ count: sql`COUNT(*)` })
        .from(tcgSeries)
        .where(eq(tcgSeries.id, id));

      return Number(result[0]?.count) > 0;
    } catch (error: any) {
      this.logger.error(
        `[TcgRepository] Error checking if series exists ${id}:`,
        error,
      );
      return false;
    }
  }

  // ==================== SETS OPERATIONS ====================

  async getSetsBySeriesId(seriesId: string): Promise<any[]> {
    try {
      return await this.db
        .select()
        .from(tcgSets)
        .where(eq(tcgSets.seriesId, seriesId));
    } catch (error: any) {
      this.logger.error(
        `[TcgRepository] Error getting sets for series ${seriesId}:`,
        error,
      );
      throw error;
    }
  }

  async insertSets(sets: any[]): Promise<void> {
    try {
      if (sets.length === 0) return;

      const existing = await this.db.select({ id: tcgSets.id }).from(tcgSets);
      const existingIds = new Set(existing.map((s) => s.id));

      const newSets = sets.filter((s) => !existingIds.has(s.id));
      if (newSets.length > 0) {
        await this.db.insert(tcgSets).values(newSets);
      }
    } catch (error: any) {
      this.logger.error('[TcgRepository] Error inserting sets:', error);
      throw error;
    }
  }

  async findSetById(id: string): Promise<any | null> {
    try {
      const result = await this.db
        .select()
        .from(tcgSets)
        .where(eq(tcgSets.id, id))
        .limit(1);

      return result[0] || null;
    } catch (error: any) {
      this.logger.error(
        `[TcgRepository] Error finding set by ID ${id}:`,
        error,
      );
      throw error;
    }
  }

  async checkIfSetExists(id: string): Promise<boolean> {
    try {
      const result = await this.db
        .select({ count: sql`COUNT(*)` })
        .from(tcgSets)
        .where(eq(tcgSets.id, id));

      return Number(result[0]?.count) > 0;
    } catch (error: any) {
      this.logger.error(
        `[TcgRepository] Error checking if set exists ${id}:`,
        error,
      );
      return false;
    }
  }

  async checkExistingSets(seriesId: string): Promise<any[]> {
    try {
      return await this.db
        .select({ id: tcgSets.id })
        .from(tcgSets)
        .where(eq(tcgSets.seriesId, seriesId));
    } catch (error: any) {
      this.logger.error(
        `[TcgRepository] Error checking existing sets for series ${seriesId}:`,
        error,
      );
      throw error;
    }
  }

  // ==================== CARDS OPERATIONS ====================

  private readonly cardSelect = {
    id: tcgCards.id,
    setId: tcgCards.setId,
    localId: tcgCards.localId,
    set_name_en: tcgSets.nameEn,
    set_name_es: tcgSets.nameEs,
    name_en: tcgCards.nameEn,
    name_es: tcgCards.nameEs,
    image_en: tcgCards.imageLocalEn,
    image_es: tcgCards.imageLocalEs,
    category: tcgCards.category,
    illustrator: tcgCards.illustrator,
    rarity: tcgCards.rarity,
    hp: tcgCards.hp,
    stage: tcgCards.stage,
    description_en: tcgCards.descriptionEn,
    description_es: tcgCards.descriptionEs,
    updated: tcgCards.updated,
    retreat: tcgCards.retreat,

    types: tcgCards.types,
    weaknesses: tcgCards.weaknesses,
    attacks: tcgCards.attacks,
    boosters: tcgCards.boosters,
    variants: tcgCards.variants,
    legal: tcgCards.legal,
  };

  async getCardsBySetId(setId: string): Promise<any[]> {
    try {
      return await this.db
        .select(this.cardSelect)
        .from(tcgCards)
        .leftJoin(tcgSets, eq(tcgCards.setId, tcgSets.id))
        .where(eq(tcgCards.setId, setId));
    } catch (error: any) {
      this.logger.error(
        `[TcgRepository] Error getting cards for set ${setId}:`,
        error,
      );
      throw error;
    }
  }

  async insertCards(cards: any[]): Promise<void> {
    try {
      if (cards.length === 0) return;

      const existing = await this.db.select({ id: tcgCards.id }).from(tcgCards);
      const existingIds = new Set(existing.map((c) => c.id));

      const newCards = cards.filter((c) => !existingIds.has(c.id));
      if (newCards.length > 0) {
        await this.db.insert(tcgCards).values(newCards);
      }
    } catch (error: any) {
      this.logger.error('[TcgRepository] Error inserting cards:', error);
      throw error;
    }
  }

  async findCardById(id: string): Promise<any | null> {
    try {
      const result = await this.db
        .select(this.cardSelect)
        .from(tcgCards)
        .leftJoin(tcgSets, eq(tcgCards.setId, tcgSets.id))
        .where(eq(tcgCards.id, id))
        .limit(1);

      return result[0] || null;
    } catch (error: any) {
      this.logger.error(
        `[TcgRepository] Error finding card by ID ${id}:`,
        error,
      );
      throw error;
    }
  }

  async checkIfCardExists(id: string): Promise<boolean> {
    try {
      const result = await this.db
        .select({ count: sql`COUNT(*)` })
        .from(tcgCards)
        .where(eq(tcgCards.id, id));

      return Number(result[0]?.count) > 0;
    } catch (error: any) {
      this.logger.error(
        `[TcgRepository] Error checking if card exists ${id}:`,
        error,
      );
      return false;
    }
  }

  async checkExistingCards(setId: string): Promise<any[]> {
    try {
      return await this.db
        .select({ id: tcgCards.id })
        .from(tcgCards)
        .where(eq(tcgCards.setId, setId));
    } catch (error: any) {
      this.logger.error(
        `[TcgRepository] Error checking existing cards for set ${setId}:`,
        error,
      );
      throw error;
    }
  }
  // ==================== USER CARDS OPERATIONS ====================

  async getUserCards(userId: number): Promise<TcgUserCard[]> {
    try {
      return await this.db
        .select()
        .from(tcgUserCards)
        .where(eq(tcgUserCards.userId, userId));
    } catch (error: any) {
      this.logger.error(
        `[TcgRepository] Error getting user cards for user ${userId}:`,
        error,
      );
      throw error;
    }
  }

  async getUserCard(userId: number, cardId: string): Promise<TcgUserCard | null> {
    try {
      const result = await this.db
        .select()
        .from(tcgUserCards)
        .where(
          and(eq(tcgUserCards.userId, userId), eq(tcgUserCards.cardId, cardId)),
        )
        .limit(1);

      return result[0] || null;
    } catch (error: any) {
      this.logger.error(
        `[TcgRepository] Error getting user card ${cardId} for user ${userId}:`,
        error,
      );
      throw error;
    }
  }

  async addUserCard(
    userId: number,
    cardId: string,
    quantity: number,
  ): Promise<void> {
    try {
      const now = new Date();
      await this.db.insert(tcgUserCards).values({
        id: `${userId}_${cardId}`,
        userId: userId,
        cardId: cardId,
        quantity: quantity,
        acquiredDate: now,
        createdAt: now,
        updatedAt: now,
      });
    } catch (error: any) {
      this.logger.error(
        `[TcgRepository] Error adding user card ${cardId} for user ${userId}:`,
        error,
      );
      throw error;
    }
  }

  async updateUserCardQuantity(
    userId: number,
    cardId: string,
    quantity: number,
  ): Promise<void> {
    try {
      await this.db
        .update(tcgUserCards)
        .set({
          quantity: quantity,
          updatedAt: new Date(),
        })
        .where(
          and(eq(tcgUserCards.userId, userId), eq(tcgUserCards.cardId, cardId)),
        );
    } catch (error: any) {
      this.logger.error(
        `[TcgRepository] Error updating user card ${cardId} for user ${userId}:`,
        error,
      );
      throw error;
    }
  }

  async removeUserCard(userId: number, cardId: string): Promise<void> {
    try {
      await this.db
        .delete(tcgUserCards)
        .where(
          and(eq(tcgUserCards.userId, userId), eq(tcgUserCards.cardId, cardId)),
        );
    } catch (error: any) {
      this.logger.error(
        `[TcgRepository] Error removing user card ${cardId} for user ${userId}:`,
        error,
      );
      throw error;
    }
  }

  async getUserCardHistory(userId: number): Promise<TcgUserCardHistory[]> {
    try {
      return await this.db
        .select()
        .from(tcgUserCardHistory)
        .where(eq(tcgUserCardHistory.userId, userId));
    } catch (error: any) {
      this.logger.error(
        `[TcgRepository] Error getting user card history for user ${userId}:`,
        error,
      );
      throw error;
    }
  }

  async addUserCardHistory(
    userId: number,
    cardId: string,
    quantityChange: number,
  ): Promise<void> {
    try {
      await this.db.insert(tcgUserCardHistory).values({
        id: `${userId}_${cardId}_${Date.now()}`,
        userId: userId,
        cardId: cardId,
        quantityChange: quantityChange,
        date: new Date(),
      });
    } catch (error: any) {
      this.logger.error(
        `[TcgRepository] Error adding user card history for user ${userId}:`,
        error,
      );
      throw error;
    }
  }
}
