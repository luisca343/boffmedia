import { Inject, Injectable } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { and, eq, sql } from 'drizzle-orm';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import {
  EventInvite,
  boffMediaEventInvites,
} from '@/_db/schema/BoffMediaEvents';

@Injectable()
export class EventInvitesRepository {
  constructor(
    @Inject(DRIZZLE) private db: MySql2Database<Record<string, never>>,
  ) {}

  async create(invite: {
    code: string;
    eventId: number;
    createdBy: number | null;
    expiresAt: Date | null;
    maxUses: number;
  }): Promise<void> {
    await this.db.insert(boffMediaEventInvites).values(invite);
  }

  async findByCode(code: string): Promise<EventInvite | undefined> {
    const rows = await this.db
      .select()
      .from(boffMediaEventInvites)
      .where(eq(boffMediaEventInvites.code, code));
    return rows[0];
  }

  async findByEvent(eventId: number): Promise<EventInvite[]> {
    return this.db
      .select()
      .from(boffMediaEventInvites)
      .where(eq(boffMediaEventInvites.eventId, eventId));
  }

  async revoke(code: string): Promise<void> {
    await this.db
      .update(boffMediaEventInvites)
      .set({ revoked: true })
      .where(eq(boffMediaEventInvites.code, code));
  }

  /**
   * Increments `uses` only while the invite is still live, and reports whether
   * it won. Doing the check inside the UPDATE is what stops two concurrent
   * redemptions of a single-use code from both succeeding.
   */
  async consume(code: string): Promise<boolean> {
    const result = await this.db
      .update(boffMediaEventInvites)
      .set({ uses: sql`${boffMediaEventInvites.uses} + 1` })
      .where(
        and(
          eq(boffMediaEventInvites.code, code),
          eq(boffMediaEventInvites.revoked, false),
          sql`${boffMediaEventInvites.uses} < ${boffMediaEventInvites.maxUses}`,
          sql`(${boffMediaEventInvites.expiresAt} IS NULL OR ${boffMediaEventInvites.expiresAt} > NOW())`,
        ),
      );
    return result[0].affectedRows > 0;
  }
}
