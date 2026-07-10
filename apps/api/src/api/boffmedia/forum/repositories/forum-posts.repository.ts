import { Injectable, Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { and, asc, desc, eq, isNull, sql } from 'drizzle-orm';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import { boffMediaForumPosts } from '@/_db/schema/Forum';
import { boffMediaUsers } from '@/_db/schema/BoffMedia';

export interface PostRow {
  id: number;
  threadId: number;
  body: string;
  isSolution: boolean;
  createdAt: Date;
  updatedAt: Date;
  authorId: number;
  authorUsername: string;
  authorPicture: string | null;
}

// Minimal post state for write-path validation/authorization (no author join).
export interface PostState {
  id: number;
  threadId: number;
  userId: number;
  createdAt: Date;
}

@Injectable()
export class ForumPostsRepository {
  constructor(
    @Inject(DRIZZLE) private db: MySql2Database<Record<string, never>>,
  ) {}

  private readonly postSelect = {
    id: boffMediaForumPosts.id,
    threadId: boffMediaForumPosts.threadId,
    body: boffMediaForumPosts.body,
    isSolution: boffMediaForumPosts.isSolution,
    createdAt: boffMediaForumPosts.createdAt,
    updatedAt: boffMediaForumPosts.updatedAt,
    authorId: boffMediaUsers.id,
    authorUsername: boffMediaUsers.username,
    authorPicture: boffMediaUsers.profilePicture,
  };

  async findByThreadId(
    threadId: number,
    page: number,
    limit: number,
  ): Promise<PostRow[]> {
    // createdAt asc keeps the OP first; id asc is a deterministic tie-break.
    const rows = await this.db
      .select(this.postSelect)
      .from(boffMediaForumPosts)
      .innerJoin(
        boffMediaUsers,
        eq(boffMediaUsers.id, boffMediaForumPosts.userId),
      )
      .where(
        and(
          eq(boffMediaForumPosts.threadId, threadId),
          isNull(boffMediaForumPosts.deletedAt),
        ),
      )
      .orderBy(asc(boffMediaForumPosts.createdAt), asc(boffMediaForumPosts.id))
      .limit(limit)
      .offset((page - 1) * limit);
    return rows as unknown as PostRow[];
  }

  async countByThreadId(threadId: number): Promise<number> {
    const [row] = await this.db
      .select({ count: sql<number>`COUNT(*)`.as('count') })
      .from(boffMediaForumPosts)
      .where(
        and(
          eq(boffMediaForumPosts.threadId, threadId),
          isNull(boffMediaForumPosts.deletedAt),
        ),
      );
    return Number(row?.count ?? 0);
  }

  // Id of the OP (earliest non-deleted post) so isOp can be flagged on any page.
  async findOpId(threadId: number): Promise<number | null> {
    const rows = await this.db
      .select({ id: boffMediaForumPosts.id })
      .from(boffMediaForumPosts)
      .where(
        and(
          eq(boffMediaForumPosts.threadId, threadId),
          isNull(boffMediaForumPosts.deletedAt),
        ),
      )
      .orderBy(asc(boffMediaForumPosts.createdAt), asc(boffMediaForumPosts.id))
      .limit(1);
    return rows.length ? rows[0].id : null;
  }

  // Inserts a reply; `at` is passed explicitly so the caller can reuse the same
  // instant for the thread's lastPostAt pointer. Returns the new post id.
  async insertReply(
    threadId: number,
    userId: number,
    body: string,
    at: Date,
  ): Promise<number> {
    const [result] = await this.db.insert(boffMediaForumPosts).values({
      threadId,
      userId,
      body,
      isSolution: false,
      createdAt: at,
      updatedAt: at,
    });
    return result.insertId;
  }

  // Full (author-joined) row for mapping a single non-deleted post to a ForumPost.
  async findRowById(id: number): Promise<PostRow | null> {
    const rows = await this.db
      .select(this.postSelect)
      .from(boffMediaForumPosts)
      .innerJoin(
        boffMediaUsers,
        eq(boffMediaUsers.id, boffMediaForumPosts.userId),
      )
      .where(
        and(
          eq(boffMediaForumPosts.id, id),
          isNull(boffMediaForumPosts.deletedAt),
        ),
      )
      .limit(1);
    return rows.length ? (rows[0] as unknown as PostRow) : null;
  }

  async findState(id: number): Promise<PostState | null> {
    const rows = await this.db
      .select({
        id: boffMediaForumPosts.id,
        threadId: boffMediaForumPosts.threadId,
        userId: boffMediaForumPosts.userId,
        createdAt: boffMediaForumPosts.createdAt,
      })
      .from(boffMediaForumPosts)
      .where(
        and(
          eq(boffMediaForumPosts.id, id),
          isNull(boffMediaForumPosts.deletedAt),
        ),
      )
      .limit(1);
    return rows.length ? (rows[0] as PostState) : null;
  }

  // Whether a non-deleted post with this id belongs to the given thread.
  async existsInThread(postId: number, threadId: number): Promise<boolean> {
    const rows = await this.db
      .select({ id: boffMediaForumPosts.id })
      .from(boffMediaForumPosts)
      .where(
        and(
          eq(boffMediaForumPosts.id, postId),
          eq(boffMediaForumPosts.threadId, threadId),
          isNull(boffMediaForumPosts.deletedAt),
        ),
      )
      .limit(1);
    return rows.length > 0;
  }

  async updateBody(id: number, body: string): Promise<void> {
    // updatedAt is maintained by the column's ON UPDATE CURRENT_TIMESTAMP.
    await this.db
      .update(boffMediaForumPosts)
      .set({ body })
      .where(eq(boffMediaForumPosts.id, id));
  }

  async softDelete(id: number): Promise<void> {
    await this.db
      .update(boffMediaForumPosts)
      .set({ deletedAt: new Date() })
      .where(eq(boffMediaForumPosts.id, id));
  }

  // Clears the accepted-solution flag from every post in the thread.
  async clearSolutionForThread(threadId: number): Promise<void> {
    await this.db
      .update(boffMediaForumPosts)
      .set({ isSolution: false })
      .where(
        and(
          eq(boffMediaForumPosts.threadId, threadId),
          eq(boffMediaForumPosts.isSolution, true),
        ),
      );
  }

  async setSolution(postId: number, value: boolean): Promise<void> {
    await this.db
      .update(boffMediaForumPosts)
      .set({ isSolution: value })
      .where(eq(boffMediaForumPosts.id, postId));
  }

  // Newest non-deleted post in the thread (for recomputing lastPost after a
  // delete). Mirrors findOpId's tie-break, reversed.
  async newestPost(threadId: number): Promise<PostState | null> {
    const rows = await this.db
      .select({
        id: boffMediaForumPosts.id,
        threadId: boffMediaForumPosts.threadId,
        userId: boffMediaForumPosts.userId,
        createdAt: boffMediaForumPosts.createdAt,
      })
      .from(boffMediaForumPosts)
      .where(
        and(
          eq(boffMediaForumPosts.threadId, threadId),
          isNull(boffMediaForumPosts.deletedAt),
        ),
      )
      .orderBy(desc(boffMediaForumPosts.createdAt), desc(boffMediaForumPosts.id))
      .limit(1);
    return rows.length ? (rows[0] as PostState) : null;
  }
}
