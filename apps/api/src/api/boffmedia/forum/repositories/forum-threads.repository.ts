import { Injectable, Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { SQL, and, desc, eq, isNull, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/mysql-core';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import {
  boffMediaForumCategories,
  boffMediaForumPosts,
  boffMediaForumThreads,
} from '@/_db/schema/Forum';
import { boffMediaUsers } from '@/_db/schema/BoffMedia';
import { ThreadSort } from '../dto/list-threads-query.dto';

export interface ThreadRow {
  id: number;
  categoryId: number;
  title: string;
  pinned: boolean;
  locked: boolean;
  solved: boolean;
  viewCount: number;
  replyCount: number;
  voteCount: number;
  createdAt: Date;
  lastPostAt: Date | null;
  catSlug: string;
  catName: string;
  catHue: number;
  authorId: number;
  authorUsername: string;
  authorPicture: string | null;
  lastUserId: number | null;
  lastUsername: string | null;
  lastPicture: string | null;
}

// Minimal thread state for write-path validation and authorization (no joins).
export interface ThreadState {
  id: number;
  userId: number;
  locked: boolean;
  pinned: boolean;
  solved: boolean;
}

// Recipient + link context for producing a forum notification about a thread.
export interface ThreadNotifyRef {
  authorId: number;
  title: string;
  catSlug: string;
}

export interface CreateThreadInput {
  categoryId: number;
  userId: number;
  title: string;
  body: string;
}

@Injectable()
export class ForumThreadsRepository {
  constructor(
    @Inject(DRIZZLE) private db: MySql2Database<Record<string, never>>,
  ) {}

  // Author is the thread owner; lastPostUser is the last replier (aliased so the
  // same users table can be joined twice).
  private readonly lastPostUser = alias(boffMediaUsers, 'lastPostUser');

  private readonly threadSelect = {
    id: boffMediaForumThreads.id,
    categoryId: boffMediaForumThreads.categoryId,
    title: boffMediaForumThreads.title,
    pinned: boffMediaForumThreads.pinned,
    locked: boffMediaForumThreads.locked,
    solved: boffMediaForumThreads.solved,
    viewCount: boffMediaForumThreads.viewCount,
    replyCount: boffMediaForumThreads.replyCount,
    voteCount: boffMediaForumThreads.voteCount,
    createdAt: boffMediaForumThreads.createdAt,
    lastPostAt: boffMediaForumThreads.lastPostAt,
    catSlug: boffMediaForumCategories.slug,
    catName: boffMediaForumCategories.name,
    catHue: boffMediaForumCategories.hue,
    authorId: boffMediaUsers.id,
    authorUsername: boffMediaUsers.username,
    authorPicture: boffMediaUsers.profilePicture,
    lastUserId: this.lastPostUser.id,
    lastUsername: this.lastPostUser.username,
    lastPicture: this.lastPostUser.profilePicture,
  };

  private baseQuery() {
    return this.db
      .select(this.threadSelect)
      .from(boffMediaForumThreads)
      .innerJoin(
        boffMediaForumCategories,
        eq(boffMediaForumCategories.id, boffMediaForumThreads.categoryId),
      )
      .innerJoin(
        boffMediaUsers,
        eq(boffMediaUsers.id, boffMediaForumThreads.userId),
      )
      .leftJoin(
        this.lastPostUser,
        eq(this.lastPostUser.id, boffMediaForumThreads.lastPostUserId),
      );
  }

  private orderFor(sort: ThreadSort): SQL[] {
    // Pinned threads always float to the top, then the requested sort, then id
    // as a deterministic tie-break so pagination is stable.
    const order: SQL[] = [desc(boffMediaForumThreads.pinned)];
    if (sort === 'top') {
      order.push(desc(boffMediaForumThreads.voteCount));
    } else if (sort === 'new') {
      order.push(desc(boffMediaForumThreads.createdAt));
    } else {
      // recent: last activity desc with nulls last, then createdAt desc.
      order.push(sql`${boffMediaForumThreads.lastPostAt} IS NULL`);
      order.push(desc(boffMediaForumThreads.lastPostAt));
      order.push(desc(boffMediaForumThreads.createdAt));
    }
    order.push(desc(boffMediaForumThreads.id));
    return order;
  }

  async findByCategoryId(
    categoryId: number,
    page: number,
    limit: number,
    sort: ThreadSort,
  ): Promise<ThreadRow[]> {
    const rows = await this.baseQuery()
      .where(
        and(
          eq(boffMediaForumThreads.categoryId, categoryId),
          isNull(boffMediaForumThreads.deletedAt),
        ),
      )
      .orderBy(...this.orderFor(sort))
      .limit(limit)
      .offset((page - 1) * limit);
    return rows as unknown as ThreadRow[];
  }

  async countByCategoryId(categoryId: number): Promise<number> {
    const [row] = await this.db
      .select({ count: sql<number>`COUNT(*)`.as('count') })
      .from(boffMediaForumThreads)
      .where(
        and(
          eq(boffMediaForumThreads.categoryId, categoryId),
          isNull(boffMediaForumThreads.deletedAt),
        ),
      );
    return Number(row?.count ?? 0);
  }

  async findById(id: number): Promise<ThreadRow | null> {
    const rows = await this.baseQuery().where(
      and(
        eq(boffMediaForumThreads.id, id),
        isNull(boffMediaForumThreads.deletedAt),
      ),
    );
    return rows.length ? (rows[0] as unknown as ThreadRow) : null;
  }

  async existsById(id: number): Promise<boolean> {
    const rows = await this.db
      .select({ id: boffMediaForumThreads.id })
      .from(boffMediaForumThreads)
      .where(
        and(
          eq(boffMediaForumThreads.id, id),
          isNull(boffMediaForumThreads.deletedAt),
        ),
      )
      .limit(1);
    return rows.length > 0;
  }

  async incrementViewCount(id: number): Promise<void> {
    await this.db
      .update(boffMediaForumThreads)
      .set({ viewCount: sql`${boffMediaForumThreads.viewCount} + 1` })
      .where(eq(boffMediaForumThreads.id, id));
  }

  // Lightweight non-deleted thread row for write-path checks (locked/owner).
  async findState(id: number): Promise<ThreadState | null> {
    const rows = await this.db
      .select({
        id: boffMediaForumThreads.id,
        userId: boffMediaForumThreads.userId,
        locked: boffMediaForumThreads.locked,
        pinned: boffMediaForumThreads.pinned,
        solved: boffMediaForumThreads.solved,
      })
      .from(boffMediaForumThreads)
      .where(
        and(
          eq(boffMediaForumThreads.id, id),
          isNull(boffMediaForumThreads.deletedAt),
        ),
      )
      .limit(1);
    return rows.length ? (rows[0] as ThreadState) : null;
  }

  async findNotifyRef(id: number): Promise<ThreadNotifyRef | null> {
    const rows = await this.db
      .select({
        authorId: boffMediaForumThreads.userId,
        title: boffMediaForumThreads.title,
        catSlug: boffMediaForumCategories.slug,
      })
      .from(boffMediaForumThreads)
      .innerJoin(
        boffMediaForumCategories,
        eq(boffMediaForumCategories.id, boffMediaForumThreads.categoryId),
      )
      .where(
        and(
          eq(boffMediaForumThreads.id, id),
          isNull(boffMediaForumThreads.deletedAt),
        ),
      )
      .limit(1);
    return rows.length ? rows[0] : null;
  }

  // Creates the thread and its OP post atomically. The OP's createdAt doubles as
  // the thread's lastPostAt (single `now` so they never drift), and the author
  // is the initial lastPostUser. Returns the new thread id.
  async createThreadWithOp(input: CreateThreadInput): Promise<number> {
    return this.db.transaction(async (tx) => {
      const now = new Date();
      const [threadResult] = await tx.insert(boffMediaForumThreads).values({
        categoryId: input.categoryId,
        userId: input.userId,
        title: input.title,
        pinned: false,
        locked: false,
        solved: false,
        viewCount: 0,
        replyCount: 0,
        voteCount: 0,
        lastPostAt: now,
        lastPostUserId: input.userId,
        createdAt: now,
        updatedAt: now,
      });
      const threadId = threadResult.insertId;

      await tx.insert(boffMediaForumPosts).values({
        threadId,
        userId: input.userId,
        body: input.body,
        isSolution: false,
        createdAt: now,
        updatedAt: now,
      });

      return threadId;
    });
  }

  // A new reply bumps the count and moves the thread's last-activity pointer.
  async registerReply(
    threadId: number,
    userId: number,
    at: Date,
  ): Promise<void> {
    await this.db
      .update(boffMediaForumThreads)
      .set({
        replyCount: sql`${boffMediaForumThreads.replyCount} + 1`,
        lastPostAt: at,
        lastPostUserId: userId,
      })
      .where(eq(boffMediaForumThreads.id, threadId));
  }

  // Clamped at >= 0 so a deleted reply can never drive the count negative.
  async decrementReply(threadId: number): Promise<void> {
    await this.db
      .update(boffMediaForumThreads)
      .set({
        replyCount: sql`GREATEST(${boffMediaForumThreads.replyCount} - 1, 0)`,
      })
      .where(eq(boffMediaForumThreads.id, threadId));
  }

  async setLastPost(
    threadId: number,
    at: Date,
    userId: number,
  ): Promise<void> {
    await this.db
      .update(boffMediaForumThreads)
      .set({ lastPostAt: at, lastPostUserId: userId })
      .where(eq(boffMediaForumThreads.id, threadId));
  }

  // Clamped at >= 0 so an out-of-band delete can't push votes negative.
  async adjustVoteCount(threadId: number, delta: number): Promise<void> {
    await this.db
      .update(boffMediaForumThreads)
      .set({
        voteCount: sql`GREATEST(${boffMediaForumThreads.voteCount} + ${delta}, 0)`,
      })
      .where(eq(boffMediaForumThreads.id, threadId));
  }

  async getVoteCount(threadId: number): Promise<number> {
    const [row] = await this.db
      .select({ voteCount: boffMediaForumThreads.voteCount })
      .from(boffMediaForumThreads)
      .where(eq(boffMediaForumThreads.id, threadId))
      .limit(1);
    return Number(row?.voteCount ?? 0);
  }

  async setSolved(threadId: number, solved: boolean): Promise<void> {
    await this.db
      .update(boffMediaForumThreads)
      .set({ solved })
      .where(eq(boffMediaForumThreads.id, threadId));
  }

  async setPinned(threadId: number, pinned: boolean): Promise<void> {
    await this.db
      .update(boffMediaForumThreads)
      .set({ pinned })
      .where(eq(boffMediaForumThreads.id, threadId));
  }

  async setLocked(threadId: number, locked: boolean): Promise<void> {
    await this.db
      .update(boffMediaForumThreads)
      .set({ locked })
      .where(eq(boffMediaForumThreads.id, threadId));
  }
}
