import { Injectable, Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, sql, and, inArray } from 'drizzle-orm';
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
        await this.db.insert(tcgSets).values(newSets.map((x) => this.toSetRow(x)));
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
        await this.db
          .insert(tcgCards)
          .values(newCards.map((x) => this.toCardRow(x)));
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
  // ==================== ROW MAPPING ====================

  // The fetch services build cards and sets with the API's snake_case field
  // names, but Drizzle matches `values()` against the table's JS PROPERTY names
  // (`setId`, `nameEn`, ...). Every unmatched key is dropped silently and the
  // column falls back to `default` — which is how an INSERT ended up writing
  // `default` into `set_id` and `name_en`. Both shapes are mapped here, once, so
  // no caller can reintroduce it.

  private toSetRow(set: any) {
    return {
      id: set.id,
      seriesId: set.series_id ?? set.seriesId,
      nameEn: set.name_en ?? set.nameEn ?? '',
      nameEs: set.name_es ?? set.nameEs ?? '',
      logo: set.logo ?? null,
      symbol: set.symbol ?? null,
      cardCountOfficial: set.card_count_official ?? set.cardCountOfficial ?? 0,
      cardCountTotal: set.card_count_total ?? set.cardCountTotal ?? 0,
    };
  }

  private toCardRow(card: any) {
    return {
      id: card.id,
      setId: card.set_id ?? card.setId,
      localId: card.local_id ?? card.localId ?? null,
      nameEn: card.name_en ?? card.nameEn ?? '',
      nameEs: card.name_es ?? card.nameEs ?? '',
      imageLocalEn: card.image_local_en ?? card.imageLocalEn ?? null,
      imageLocalEs: card.image_local_es ?? card.imageLocalEs ?? null,
      category: card.category ?? null,
      illustrator: card.illustrator ?? null,
      rarity: card.rarity ?? null,
      hp: card.hp ?? null,
      stage: card.stage ?? null,
      descriptionEn: card.description_en ?? card.descriptionEn ?? null,
      descriptionEs: card.description_es ?? card.descriptionEs ?? null,
      updated: card.updated ?? null,
      types: card.types ?? null,
      weaknesses: card.weaknesses ?? null,
      attacks: card.attacks ?? null,
      boosters: card.boosters ?? null,
      variants: card.variants ?? null,
      legal: card.legal ?? null,
      retreat: card.retreat ?? null,
    };
  }

  // ==================== SELECTIVE SYNC OPERATIONS ====================

  /**
   * Per-set row/asset counts for one series, in a single grouped query.
   * This is what the admin sync screen compares against the remote catalogue to
   * decide whether a set is missing, partial or up to date — doing it per set
   * would be one query per expansion on every status refresh.
   */
  async getSyncStatsBySeries(seriesId: string): Promise<
    Array<{
      setId: string;
      cards: number;
      imagesEn: number;
      imagesEs: number;
      imagesAny: number;
    }>
  > {
    try {
      const rows = await this.db
        .select({
          setId: tcgCards.setId,
          cards: sql<number>`COUNT(*)`,
          imagesEn: sql<number>`SUM(CASE WHEN ${tcgCards.imageLocalEn} IS NOT NULL THEN 1 ELSE 0 END)`,
          imagesEs: sql<number>`SUM(CASE WHEN ${tcgCards.imageLocalEs} IS NOT NULL THEN 1 ELSE 0 END)`,
          // Cards with artwork in AT LEAST one locale. This is the number that
          // decides whether a set is complete: tcgdex genuinely has no EN asset
          // for many promos, so "two files per card" is a target that can never
          // be reached and would keep re-requesting the same 404s forever.
          imagesAny: sql<number>`SUM(CASE WHEN ${tcgCards.imageLocalEn} IS NOT NULL OR ${tcgCards.imageLocalEs} IS NOT NULL THEN 1 ELSE 0 END)`,
        })
        .from(tcgCards)
        .innerJoin(tcgSets, eq(tcgCards.setId, tcgSets.id))
        .where(eq(tcgSets.seriesId, seriesId))
        .groupBy(tcgCards.setId);

      return rows.map((r) => ({
        setId: r.setId,
        cards: Number(r.cards) || 0,
        imagesEn: Number(r.imagesEn) || 0,
        imagesEs: Number(r.imagesEs) || 0,
        imagesAny: Number(r.imagesAny) || 0,
      }));
    } catch (error: any) {
      this.logger.error(
        `[TcgRepository] Error getting sync stats for series ${seriesId}:`,
        error,
      );
      throw error;
    }
  }

  /** Which of these card ids already exist. Scoped by id, not a full-table scan. */
  private async existingCardIds(ids: string[]): Promise<Set<string>> {
    if (ids.length === 0) return new Set();
    const rows = await this.db
      .select({ id: tcgCards.id })
      .from(tcgCards)
      .where(inArray(tcgCards.id, ids));
    return new Set(rows.map((r) => r.id));
  }

  /**
   * Insert new sets and refresh the ones already stored. `insertSets` skips
   * anything that exists, so a set whose card count grew (a new booster wave)
   * never picked up the new total — the sync flow needs the update.
   */
  async upsertSets(
    sets: any[],
  ): Promise<{ inserted: number; updated: number }> {
    try {
      if (sets.length === 0) return { inserted: 0, updated: 0 };

      const ids = sets.map((s) => s.id);
      const existing = await this.db
        .select({ id: tcgSets.id })
        .from(tcgSets)
        .where(inArray(tcgSets.id, ids));
      const existingIds = new Set(existing.map((s) => s.id));

      await this.db
        .insert(tcgSets)
        .values(sets.map((x) => this.toSetRow(x)))
        .onDuplicateKeyUpdate({
          set: {
            seriesId: sql`VALUES(series_id)`,
            nameEn: sql`VALUES(name_en)`,
            nameEs: sql`VALUES(name_es)`,
            logo: sql`VALUES(logo)`,
            symbol: sql`VALUES(symbol)`,
            cardCountOfficial: sql`VALUES(card_count_official)`,
            cardCountTotal: sql`VALUES(card_count_total)`,
          },
        });

      return {
        inserted: sets.length - existingIds.size,
        updated: existingIds.size,
      };
    } catch (error: any) {
      this.logger.error('[TcgRepository] Error upserting sets:', error);
      throw error;
    }
  }

  /**
   * Insert new cards and refresh existing ones. The image columns are left out
   * of the UPDATE on purpose: the images stage owns them, so re-running a
   * cards-only sync never wipes artwork that is already on disk.
   */
  async upsertCards(
    cards: any[],
  ): Promise<{ inserted: number; updated: number }> {
    try {
      if (cards.length === 0) return { inserted: 0, updated: 0 };

      const existingIds = await this.existingCardIds(cards.map((c) => c.id));

      await this.db
        .insert(tcgCards)
        .values(cards.map((x) => this.toCardRow(x)))
        .onDuplicateKeyUpdate({
          set: {
            setId: sql`VALUES(set_id)`,
            localId: sql`VALUES(local_id)`,
            nameEn: sql`VALUES(name_en)`,
            nameEs: sql`VALUES(name_es)`,
            category: sql`VALUES(category)`,
            illustrator: sql`VALUES(illustrator)`,
            rarity: sql`VALUES(rarity)`,
            hp: sql`VALUES(hp)`,
            stage: sql`VALUES(stage)`,
            descriptionEn: sql`VALUES(description_en)`,
            descriptionEs: sql`VALUES(description_es)`,
            updated: sql`VALUES(updated)`,
            types: sql`VALUES(types)`,
            weaknesses: sql`VALUES(weaknesses)`,
            attacks: sql`VALUES(attacks)`,
            boosters: sql`VALUES(boosters)`,
            variants: sql`VALUES(variants)`,
            legal: sql`VALUES(legal)`,
            retreat: sql`VALUES(retreat)`,
          },
        });

      return {
        inserted: cards.length - existingIds.size,
        updated: existingIds.size,
      };
    } catch (error: any) {
      this.logger.error('[TcgRepository] Error upserting cards:', error);
      throw error;
    }
  }

  /**
   * Rewrites artwork paths left over from the pre-reorg public/ layout.
   *
   * The files themselves never moved names, only the prefix that serves them, so
   * this is a string swap and not a re-download: every row still pointing at
   * `/img/games/tcg/...` is repointed at `/boffmedia/tools/tcg/...`. Idempotent
   * — the LIKE matches nothing on a second run.
   */
  async repairLegacyImagePaths(): Promise<number> {
    try {
      const legacy = '/img/games/tcg/';
      const current = '/boffmedia/tools/tcg/';
      let fixed = 0;

      for (const column of ['image_local_en', 'image_local_es']) {
        const result: any = await this.db.execute(
          sql`UPDATE tools_tcg_cards
              SET ${sql.raw(column)} = REPLACE(${sql.raw(column)}, ${legacy}, ${current})
              WHERE ${sql.raw(column)} LIKE ${legacy + '%'}`,
        );
        fixed += Number(result?.[0]?.affectedRows ?? result?.affectedRows ?? 0);
      }

      if (fixed > 0) {
        this.logger.log(
          `[TcgRepository] Repointed ${fixed} artwork path(s) to ${current}`,
        );
      }
      return fixed;
    } catch (error: any) {
      this.logger.error(
        '[TcgRepository] Error repairing legacy image paths:',
        error,
      );
      throw error;
    }
  }

  /** Ids + current artwork paths for one set, for the images stage. */
  async getCardImageStateForSet(setId: string): Promise<
    Array<{ id: string; imageLocalEn: string | null; imageLocalEs: string | null }>
  > {
    try {
      return await this.db
        .select({
          id: tcgCards.id,
          imageLocalEn: tcgCards.imageLocalEn,
          imageLocalEs: tcgCards.imageLocalEs,
        })
        .from(tcgCards)
        .where(eq(tcgCards.setId, setId));
    } catch (error: any) {
      this.logger.error(
        `[TcgRepository] Error reading image state for set ${setId}:`,
        error,
      );
      throw error;
    }
  }

  /** Writes the artwork paths for one card. Only the locales passed are touched. */
  async updateCardImages(
    cardId: string,
    images: { imageLocalEn?: string | null; imageLocalEs?: string | null },
  ): Promise<void> {
    try {
      const set: Record<string, string | null> = {};
      if (images.imageLocalEn !== undefined)
        set.imageLocalEn = images.imageLocalEn;
      if (images.imageLocalEs !== undefined)
        set.imageLocalEs = images.imageLocalEs;
      if (Object.keys(set).length === 0) return;

      await this.db.update(tcgCards).set(set).where(eq(tcgCards.id, cardId));
    } catch (error: any) {
      this.logger.error(
        `[TcgRepository] Error updating images for card ${cardId}:`,
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

  async getUserCard(
    userId: number,
    cardId: string,
  ): Promise<TcgUserCard | null> {
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
