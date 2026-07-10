import { Injectable, Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { and, desc, eq, isNull, sql } from 'drizzle-orm';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import {
  boffMediaForumPosts,
  boffMediaForumThreads,
} from '@/_db/schema/Forum';
import { boffMediaUsers } from '@/_db/schema/BoffMedia';

export interface OnlineRow {
  id: number;
  username: string;
  picture: string | null;
  // 1 when active within the last 5 minutes, else 0 (idle).
  isOnline: number;
}

@Injectable()
export class ForumPresenceRepository {
  constructor(
    @Inject(DRIZZLE) private db: MySql2Database<Record<string, never>>,
  ) {}

  async postCount(): Promise<number> {
    const [row] = await this.db
      .select({ count: sql<number>`COUNT(*)`.as('count') })
      .from(boffMediaForumPosts)
      .where(isNull(boffMediaForumPosts.deletedAt));
    return Number(row?.count ?? 0);
  }

  async threadCount(): Promise<number> {
    const [row] = await this.db
      .select({ count: sql<number>`COUNT(*)`.as('count') })
      .from(boffMediaForumThreads)
      .where(isNull(boffMediaForumThreads.deletedAt));
    return Number(row?.count ?? 0);
  }

  async memberCount(): Promise<number> {
    const [row] = await this.db
      .select({ count: sql<number>`COUNT(*)`.as('count') })
      .from(boffMediaUsers)
      .where(isNull(boffMediaUsers.deletedAt));
    return Number(row?.count ?? 0);
  }

  // Comparisons stay server-side (NOW()) to avoid client/server timezone drift.
  async onlineCount(): Promise<number> {
    const [row] = await this.db
      .select({ count: sql<number>`COUNT(*)`.as('count') })
      .from(boffMediaUsers)
      .where(
        and(
          isNull(boffMediaUsers.deletedAt),
          sql`${boffMediaUsers.lastSeenAt} >= (NOW() - INTERVAL 5 MINUTE)`,
        ),
      );
    return Number(row?.count ?? 0);
  }

  async newestUsername(): Promise<string | null> {
    const rows = await this.db
      .select({ username: boffMediaUsers.username })
      .from(boffMediaUsers)
      .where(isNull(boffMediaUsers.deletedAt))
      .orderBy(desc(boffMediaUsers.createdAt))
      .limit(1);
    return rows.length ? rows[0].username : null;
  }

  // Members seen within the last 15 minutes; isOnline flags the last-5-min set.
  async findOnline(): Promise<OnlineRow[]> {
    const rows = await this.db
      .select({
        id: boffMediaUsers.id,
        username: boffMediaUsers.username,
        picture: boffMediaUsers.profilePicture,
        isOnline:
          sql<number>`(${boffMediaUsers.lastSeenAt} >= (NOW() - INTERVAL 5 MINUTE))`.as(
            'is_online',
          ),
      })
      .from(boffMediaUsers)
      .where(
        and(
          isNull(boffMediaUsers.deletedAt),
          sql`${boffMediaUsers.lastSeenAt} >= (NOW() - INTERVAL 15 MINUTE)`,
        ),
      )
      .orderBy(desc(boffMediaUsers.lastSeenAt))
      .limit(12);
    return rows as unknown as OnlineRow[];
  }

  // Server-side NOW() keeps presence timestamps free of client/server drift.
  async touchLastSeen(userId: number): Promise<void> {
    await this.db
      .update(boffMediaUsers)
      .set({ lastSeenAt: sql`NOW()` })
      .where(eq(boffMediaUsers.id, userId));
  }
}
