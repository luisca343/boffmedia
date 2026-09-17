import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, gt, inArray, isNotNull, or, sql } from 'drizzle-orm';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import {
  boffMediaChangelogCtas,
  boffMediaChangelogTranslations,
  boffMediaChangelogs,
  boffMediaUserChangelogState,
  type ChangelogPlatform,
  type ChangelogProduct,
  type ChangelogStatus,
} from '@/_db/schema/BoffMediaChangelog';

export type ChangelogRow = typeof boffMediaChangelogs.$inferSelect;
export type ChangelogTranslationRow =
  typeof boffMediaChangelogTranslations.$inferSelect;
export type ChangelogCtaRow = typeof boffMediaChangelogCtas.$inferSelect;
export type ChangelogStateRow = typeof boffMediaUserChangelogState.$inferSelect;

export interface ChangelogCursor {
  publishedAt: Date;
  entryId: number;
}

@Injectable()
export class ChangelogRepository {
  constructor(
    @Inject(DRIZZLE) private readonly db: MySql2Database<Record<string, never>>,
  ) {}

  async listPublished(
    product: ChangelogProduct,
    platform: ChangelogPlatform,
    limit: number,
  ): Promise<ChangelogRow[]> {
    return this.db
      .select()
      .from(boffMediaChangelogs)
      .where(
        and(
          eq(boffMediaChangelogs.status, 'published'),
          isNotNull(boffMediaChangelogs.publishedAt),
          or(
            eq(boffMediaChangelogs.product, product),
            eq(boffMediaChangelogs.product, 'all'),
          ),
          or(
            eq(boffMediaChangelogs.platform, platform),
            eq(boffMediaChangelogs.platform, 'all'),
          ),
        ),
      )
      .orderBy(
        desc(boffMediaChangelogs.publishedAt),
        desc(boffMediaChangelogs.id),
      )
      .limit(limit);
  }

  async countPublishedAfter(
    product: ChangelogProduct,
    platform: ChangelogPlatform,
    cursor: ChangelogCursor | null,
  ): Promise<number> {
    const conditions = [
      eq(boffMediaChangelogs.status, 'published'),
      isNotNull(boffMediaChangelogs.publishedAt),
      or(
        eq(boffMediaChangelogs.product, product),
        eq(boffMediaChangelogs.product, 'all'),
      ),
      or(
        eq(boffMediaChangelogs.platform, platform),
        eq(boffMediaChangelogs.platform, 'all'),
      ),
    ];
    if (cursor) {
      conditions.push(
        or(
          gt(boffMediaChangelogs.publishedAt, cursor.publishedAt),
          and(
            eq(boffMediaChangelogs.publishedAt, cursor.publishedAt),
            gt(boffMediaChangelogs.id, cursor.entryId),
          ),
        )!,
      );
    }

    const [row] = await this.db
      .select({ count: sql<number>`COUNT(DISTINCT ${boffMediaChangelogs.id})` })
      .from(boffMediaChangelogs)
      .innerJoin(
        boffMediaChangelogTranslations,
        and(
          eq(
            boffMediaChangelogTranslations.changelogId,
            boffMediaChangelogs.id,
          ),
          eq(boffMediaChangelogTranslations.locale, 'es'),
          eq(boffMediaChangelogTranslations.status, 'reviewed'),
        ),
      )
      .where(and(...conditions));
    return Number(row?.count ?? 0);
  }

  async translationsFor(ids: number[]): Promise<ChangelogTranslationRow[]> {
    if (ids.length === 0) return [];
    return this.db
      .select()
      .from(boffMediaChangelogTranslations)
      .where(inArray(boffMediaChangelogTranslations.changelogId, ids));
  }

  async ctasFor(ids: number[]): Promise<ChangelogCtaRow[]> {
    if (ids.length === 0) return [];
    return this.db
      .select()
      .from(boffMediaChangelogCtas)
      .where(inArray(boffMediaChangelogCtas.changelogId, ids));
  }

  async getState(
    userId: number,
    product: Exclude<ChangelogProduct, 'all'>,
  ): Promise<ChangelogStateRow | null> {
    const [row] = await this.db
      .select()
      .from(boffMediaUserChangelogState)
      .where(
        and(
          eq(boffMediaUserChangelogState.userId, userId),
          eq(boffMediaUserChangelogState.product, product),
        ),
      )
      .limit(1);
    return row ?? null;
  }

  /**
   * Atomic monotonic upsert. The comparison is repeated in both columns so a
   * stale tab cannot move either half of the cursor backwards.
   */
  async advanceState(
    userId: number,
    product: Exclude<ChangelogProduct, 'all'>,
    cursor: ChangelogCursor,
  ): Promise<void> {
    const isNewer = sql`
      ${boffMediaUserChangelogState.lastSeenPublishedAt} IS NULL
      OR ${boffMediaUserChangelogState.lastSeenPublishedAt} < ${cursor.publishedAt}
      OR (
        ${boffMediaUserChangelogState.lastSeenPublishedAt} = ${cursor.publishedAt}
        AND ${boffMediaUserChangelogState.lastSeenEntryId} < ${cursor.entryId}
      )
    `;

    await this.db
      .insert(boffMediaUserChangelogState)
      .values({
        userId,
        product,
        lastSeenPublishedAt: cursor.publishedAt,
        lastSeenEntryId: cursor.entryId,
      })
      .onDuplicateKeyUpdate({
        set: {
          lastSeenPublishedAt: sql`CASE WHEN ${isNewer} THEN ${cursor.publishedAt} ELSE ${boffMediaUserChangelogState.lastSeenPublishedAt} END`,
          lastSeenEntryId: sql`CASE WHEN ${isNewer} THEN ${cursor.entryId} ELSE ${boffMediaUserChangelogState.lastSeenEntryId} END`,
          updatedAt: new Date(),
        },
      });
  }

  async findPublishedById(id: number): Promise<ChangelogRow | null> {
    const [row] = await this.db
      .select()
      .from(boffMediaChangelogs)
      .where(
        and(
          eq(boffMediaChangelogs.id, id),
          eq(boffMediaChangelogs.status, 'published'),
          isNotNull(boffMediaChangelogs.publishedAt),
        ),
      )
      .limit(1);
    return row ?? null;
  }

  async listAdmin(filters: {
    product?: ChangelogProduct;
    platform?: ChangelogPlatform;
    status?: ChangelogStatus;
  }): Promise<ChangelogRow[]> {
    const conditions = [];
    if (filters.product)
      conditions.push(eq(boffMediaChangelogs.product, filters.product));
    if (filters.platform)
      conditions.push(eq(boffMediaChangelogs.platform, filters.platform));
    if (filters.status)
      conditions.push(eq(boffMediaChangelogs.status, filters.status));
    return this.db
      .select()
      .from(boffMediaChangelogs)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(
        desc(boffMediaChangelogs.publishedAt),
        desc(boffMediaChangelogs.updatedAt),
      );
  }

  async findById(id: number): Promise<ChangelogRow | null> {
    const [row] = await this.db
      .select()
      .from(boffMediaChangelogs)
      .where(eq(boffMediaChangelogs.id, id))
      .limit(1);
    return row ?? null;
  }

  async insertChangelog(
    row: typeof boffMediaChangelogs.$inferInsert,
  ): Promise<number> {
    const [result] = await this.db.insert(boffMediaChangelogs).values(row);
    return Number(result.insertId);
  }

  async updateChangelog(
    id: number,
    patch: Partial<typeof boffMediaChangelogs.$inferInsert>,
  ): Promise<void> {
    await this.db
      .update(boffMediaChangelogs)
      .set({ ...patch, updatedAt: new Date() })
      .where(eq(boffMediaChangelogs.id, id));
  }

  async replaceTranslations(
    changelogId: number,
    translations: Array<typeof boffMediaChangelogTranslations.$inferInsert>,
  ): Promise<void> {
    await this.db
      .delete(boffMediaChangelogTranslations)
      .where(eq(boffMediaChangelogTranslations.changelogId, changelogId));
    if (translations.length) {
      await this.db.insert(boffMediaChangelogTranslations).values(translations);
    }
  }

  async replaceCtas(
    changelogId: number,
    ctas: Array<typeof boffMediaChangelogCtas.$inferInsert>,
  ): Promise<void> {
    await this.db
      .delete(boffMediaChangelogCtas)
      .where(eq(boffMediaChangelogCtas.changelogId, changelogId));
    if (ctas.length) await this.db.insert(boffMediaChangelogCtas).values(ctas);
  }

  async deleteDraft(id: number): Promise<void> {
    await this.db
      .delete(boffMediaChangelogs)
      .where(eq(boffMediaChangelogs.id, id));
  }
}
