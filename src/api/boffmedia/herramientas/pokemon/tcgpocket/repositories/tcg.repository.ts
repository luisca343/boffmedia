import { Injectable, Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, sql } from 'drizzle-orm';
import { tcgSeries, TcgSeries, tcgCards, tcgSets } from '@/_db/schema/TCG';
import { ITcgRepository } from './interfaces/tcg.repository.interface';
import { TcgSeriesDto } from '../dto/tcg-series.dto';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';

@Injectable()
export class TcgRepository implements ITcgRepository {
  constructor(@Inject(DRIZZLE) private readonly db: MySql2Database<Record<string, never>>) {}

  // ==================== SERIES OPERATIONS ====================

  async insertSeries(series: TcgSeriesDto[]): Promise<void> {
    try {
      if (series.length === 0) return;

      const existing = await this.db.select({ id: tcgSeries.id }).from(tcgSeries);
      const existingIds = new Set(existing.map(s => s.id));

      const newSeries = series.filter(s => !existingIds.has(s.id));
      if (newSeries.length > 0) {
        const insertData = newSeries.map(s => ({
          id: s.id,
          name_en: s.name_en,
          name_es: s.name_es,
          logo: s.logo || null,
        }));
        await this.db.insert(tcgSeries).values(insertData);
      }
    } catch (error) {
      console.error('[TcgRepository] Error inserting series:', error);
      throw error;
    }
  }

  async findAll(): Promise<TcgSeries[]> {
    try {
      return await this.db.select().from(tcgSeries);
    } catch (error) {
      console.error('[TcgRepository] Error finding all series:', error);
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
    } catch (error) {
      console.error(`[TcgRepository] Error finding series by ID ${id}:`, error);
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
    } catch (error) {
      console.error(`[TcgRepository] Error checking if series exists ${id}:`, error);
      return false;
    }
  }

  // ==================== SETS OPERATIONS ====================

  async getSetsBySeriesId(seriesId: string): Promise<any[]> {
    try {
      return await this.db
        .select()
        .from(tcgSets)
        .where(eq(tcgSets.series_id, seriesId));
    } catch (error) {
      console.error(`[TcgRepository] Error getting sets for series ${seriesId}:`, error);
      throw error;
    }
  }

  async insertSets(sets: any[]): Promise<void> {
    try {
      if (sets.length === 0) return;
      
      const existing = await this.db.select({ id: tcgSets.id }).from(tcgSets);
      const existingIds = new Set(existing.map(s => s.id));

      const newSets = sets.filter(s => !existingIds.has(s.id));
      if (newSets.length > 0) {
        await this.db.insert(tcgSets).values(newSets);
      }
    } catch (error) {
      console.error('[TcgRepository] Error inserting sets:', error);
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
    } catch (error) {
      console.error(`[TcgRepository] Error finding set by ID ${id}:`, error);
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
    } catch (error) {
      console.error(`[TcgRepository] Error checking if set exists ${id}:`, error);
      return false;
    }
  }

  async checkExistingSets(seriesId: string): Promise<any[]> {
    try {
      return await this.db
        .select({ id: tcgSets.id })
        .from(tcgSets)
        .where(eq(tcgSets.series_id, seriesId));
    } catch (error) {
      console.error(`[TcgRepository] Error checking existing sets for series ${seriesId}:`, error);
      throw error;
    }
  }

  // ==================== CARDS OPERATIONS ====================

  async getCardsBySetId(setId: string): Promise<any[]> {
    try {
      return await this.db
        .select()
        .from(tcgCards)
        .where(eq(tcgCards.set_id, setId));
    } catch (error) {
      console.error(`[TcgRepository] Error getting cards for set ${setId}:`, error);
      throw error;
    }
  }

  async insertCards(cards: any[]): Promise<void> {
    try {
      if (cards.length === 0) return;
      
      const existing = await this.db.select({ id: tcgCards.id }).from(tcgCards);
      const existingIds = new Set(existing.map(c => c.id));

      const newCards = cards.filter(c => !existingIds.has(c.id));
      if (newCards.length > 0) {
        await this.db.insert(tcgCards).values(newCards);
      }
    } catch (error) {
      console.error('[TcgRepository] Error inserting cards:', error);
      throw error;
    }
  }

  async findCardById(id: string): Promise<any | null> {
    try {
      const result = await this.db
        .select()
        .from(tcgCards)
        .where(eq(tcgCards.id, id))
        .limit(1);

      return result[0] || null;
    } catch (error) {
      console.error(`[TcgRepository] Error finding card by ID ${id}:`, error);
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
    } catch (error) {
      console.error(`[TcgRepository] Error checking if card exists ${id}:`, error);
      return false;
    }
  }

  async checkExistingCards(setId: string): Promise<any[]> {
    try {
      return await this.db
        .select({ id: tcgCards.id })
        .from(tcgCards)
        .where(eq(tcgCards.set_id, setId));
    } catch (error) {
      console.error(`[TcgRepository] Error checking existing cards for set ${setId}:`, error);
      throw error;
    }
  }
}