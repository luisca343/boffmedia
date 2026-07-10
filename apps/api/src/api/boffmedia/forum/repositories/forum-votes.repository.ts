import { Injectable, Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { and, eq } from 'drizzle-orm';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import { boffMediaForumVotes } from '@/_db/schema/Forum';

@Injectable()
export class ForumVotesRepository {
  constructor(
    @Inject(DRIZZLE) private db: MySql2Database<Record<string, never>>,
  ) {}

  async find(userId: number, threadId: number): Promise<{ id: number } | null> {
    const rows = await this.db
      .select({ id: boffMediaForumVotes.id })
      .from(boffMediaForumVotes)
      .where(
        and(
          eq(boffMediaForumVotes.userId, userId),
          eq(boffMediaForumVotes.threadId, threadId),
        ),
      )
      .limit(1);
    return rows.length ? rows[0] : null;
  }

  async add(userId: number, threadId: number): Promise<void> {
    await this.db.insert(boffMediaForumVotes).values({
      userId,
      threadId,
      createdAt: new Date(),
    });
  }

  async remove(userId: number, threadId: number): Promise<void> {
    await this.db
      .delete(boffMediaForumVotes)
      .where(
        and(
          eq(boffMediaForumVotes.userId, userId),
          eq(boffMediaForumVotes.threadId, threadId),
        ),
      );
  }
}
