import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { MySql2Database } from 'drizzle-orm/mysql2';

import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import { boffMediaUsers } from '@/_db/schema/BoffMedia';

/** Writes the bounce flag Resend's webhooks report (A14). */
@Injectable()
export class EmailBounceRepository {
  constructor(
    @Inject(DRIZZLE)
    private readonly db: MySql2Database<Record<string, never>>,
  ) {}

  /**
   * Mark the account at `email` as bouncing. Returns the account's id, or null
   * when no account has that address.
   *
   * One statement, not a lookup followed by an update. The webhook endpoint is
   * reachable by anyone who can post to it, and the previous version selected
   * EVERY column of the matching user purely to decide whether to continue —
   * so an attacker replaying bounce events for a known address paid us the cost
   * of a full row read each time and learned that the address exists from the
   * timing. `affectedRows` answers the same question at no extra cost.
   */
  async markBounced(email: string, at: Date): Promise<boolean> {
    const [result] = await this.db
      .update(boffMediaUsers)
      .set({ emailBounced: true, emailBouncedAt: at })
      .where(eq(boffMediaUsers.email, email));

    return result.affectedRows > 0;
  }
}
