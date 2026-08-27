import { Inject, Injectable } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';

export type EventsTx = Parameters<
  Parameters<MySql2Database<Record<string, never>>['transaction']>[0]
>[0];

/**
 * The transaction boundary the events facade opens when it has to compose two
 * services into one atomic step.
 *
 * ⚠️  KNOWN LIMITATION — read before relying on this for atomicity.
 *
 * Opening a transaction here only protects work done through the `tx` handle it
 * hands to the callback. A service called from inside that callback runs its own
 * queries through its own injected connection, which is a DIFFERENT connection
 * from the pool: those writes are NOT part of this transaction and will neither
 * commit nor roll back with it.
 *
 * The invite-redemption path in `EventsFacadeService.redeemInvite` is in exactly
 * that position today. Making it genuinely atomic means threading `tx` down
 * through `EventInvitesService.consume` and the whole `joinEvent` chain, which is
 * a wider change than the one that introduced this file. Until that happens,
 * treat this as a marker of intent, not a guarantee.
 */
@Injectable()
export class EventsUnitOfWorkRepository {
  constructor(
    @Inject(DRIZZLE) private readonly db: MySql2Database<Record<string, never>>,
  ) {}

  async run<T>(work: (tx: EventsTx) => Promise<T>): Promise<T> {
    return this.db.transaction(async (tx) => work(tx));
  }
}
