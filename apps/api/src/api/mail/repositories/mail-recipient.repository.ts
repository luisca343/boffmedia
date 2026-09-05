import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { MySql2Database } from 'drizzle-orm/mysql2';

import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import { boffMediaUsers } from '@/_db/schema/BoffMedia';

/** What the mail sender needs to know about a recipient before sending (A14). */
@Injectable()
export class MailRecipientRepository {
  constructor(
    @Inject(DRIZZLE)
    private readonly db: MySql2Database<Record<string, never>>,
  ) {}

  /**
   * Whether this address has been reported as a hard bounce or a complaint.
   *
   * An address with no account returns false: plenty of legitimate mail goes to
   * addresses that are not Boffmedia accounts, and refusing to send to them
   * would be a worse bug than the one A14 fixes. Only a KNOWN bad address is
   * skipped.
   */
  async isBounced(email: string): Promise<boolean> {
    const [row] = await this.db
      .select({ emailBounced: boffMediaUsers.emailBounced })
      .from(boffMediaUsers)
      .where(eq(boffMediaUsers.email, email))
      .limit(1);

    return row?.emailBounced ?? false;
  }
}
