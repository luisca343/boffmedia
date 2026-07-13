import { Injectable, Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { and, desc, eq, inArray, isNotNull, isNull, sql } from 'drizzle-orm';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import {
  boffMediaForumCategories,
  boffMediaForumPosts,
  boffMediaForumThreads,
  ForumCategory as ForumCategoryRow,
} from '@/_db/schema/Forum';
import { boffMediaUsers } from '@/_db/schema/BoffMedia';

export interface CategoryCount {
  categoryId: number;
  count: number;
}

export interface CategoryActivity {
  categoryId: number;
  lastAt: Date | null;
  userId: number | null;
  username: string | null;
  picture: string | null;
}

@Injectable()
export class ForumCategoriesRepository {
  constructor(
    @Inject(DRIZZLE) private db: MySql2Database<Record<string, never>>,
  ) {}

  async findAll(): Promise<ForumCategoryRow[]> {
    return (
      this.db
        .select()
        .from(boffMediaForumCategories)
        .where(isNull(boffMediaForumCategories.deletedAt))
        // Curated order, then id as a deterministic tie-break.
        .orderBy(boffMediaForumCategories.position, boffMediaForumCategories.id)
    );
  }

  async findById(id: number): Promise<ForumCategoryRow | null> {
    const rows = await this.db
      .select()
      .from(boffMediaForumCategories)
      .where(
        and(
          eq(boffMediaForumCategories.id, id),
          isNull(boffMediaForumCategories.deletedAt),
        ),
      );
    return rows.length ? rows[0] : null;
  }

  async findBySlug(slug: string): Promise<ForumCategoryRow | null> {
    const rows = await this.db
      .select()
      .from(boffMediaForumCategories)
      .where(
        and(
          eq(boffMediaForumCategories.slug, slug),
          isNull(boffMediaForumCategories.deletedAt),
        ),
      );
    return rows.length ? rows[0] : null;
  }

  async threadCounts(categoryIds: number[]): Promise<CategoryCount[]> {
    if (categoryIds.length === 0) return [];
    return this.db
      .select({
        categoryId: boffMediaForumThreads.categoryId,
        count: sql<number>`COUNT(*)`.as('count'),
      })
      .from(boffMediaForumThreads)
      .where(
        and(
          isNull(boffMediaForumThreads.deletedAt),
          inArray(boffMediaForumThreads.categoryId, categoryIds),
        ),
      )
      .groupBy(boffMediaForumThreads.categoryId);
  }

  async postCounts(categoryIds: number[]): Promise<CategoryCount[]> {
    if (categoryIds.length === 0) return [];
    // Posts joined to their (non-deleted) thread so a category's post total only
    // counts live posts in live threads.
    return this.db
      .select({
        categoryId: boffMediaForumThreads.categoryId,
        count: sql<number>`COUNT(*)`.as('count'),
      })
      .from(boffMediaForumPosts)
      .innerJoin(
        boffMediaForumThreads,
        eq(boffMediaForumThreads.id, boffMediaForumPosts.threadId),
      )
      .where(
        and(
          isNull(boffMediaForumPosts.deletedAt),
          isNull(boffMediaForumThreads.deletedAt),
          inArray(boffMediaForumThreads.categoryId, categoryIds),
        ),
      )
      .groupBy(boffMediaForumThreads.categoryId);
  }

  async latestActivity(categoryIds: number[]): Promise<CategoryActivity[]> {
    if (categoryIds.length === 0) return [];
    // Every non-deleted thread with activity, newest first. The service takes the
    // first row per category (a batched lookup, not per-category N+1).
    return this.db
      .select({
        categoryId: boffMediaForumThreads.categoryId,
        lastAt: boffMediaForumThreads.lastPostAt,
        userId: boffMediaUsers.id,
        username: boffMediaUsers.username,
        picture: boffMediaUsers.profilePicture,
      })
      .from(boffMediaForumThreads)
      .leftJoin(
        boffMediaUsers,
        eq(boffMediaUsers.id, boffMediaForumThreads.lastPostUserId),
      )
      .where(
        and(
          isNull(boffMediaForumThreads.deletedAt),
          isNotNull(boffMediaForumThreads.lastPostAt),
          inArray(boffMediaForumThreads.categoryId, categoryIds),
        ),
      )
      .orderBy(desc(boffMediaForumThreads.lastPostAt));
  }
}
