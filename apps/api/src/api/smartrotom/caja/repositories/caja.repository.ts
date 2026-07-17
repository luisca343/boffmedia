import { Inject, Injectable, ConflictException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { and, eq, gt, sql } from 'drizzle-orm';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import {
  smartRotomInventory,
  SmartRotomInventoryItem,
} from '@/_db/schema/SmartRotom';
import { ObjetoMC } from '../entities/objeto-mc.entity';
import { CajaSource } from '../dto/claim-caja.dto';

/**
 * The single spend path for `rotom_inventory`.
 *
 * `used` is read two different ways in this ledger and always has been: **mine**
 * treats it as a flag (`used = 0` means unclaimed) while the **arcade** treats it
 * as a consumed counter (`amount > used`). They only agree for `amount: 1` rows,
 * and mine rows are NOT always amount 1 — the live table holds mine rows with
 * amount up to 8. Spending an `{amount: 5, used: 0}` row by writing `used = 1`
 * therefore hands over all 5 and leaves the arcade offering 4 more.
 *
 * This class resolves it once, for every source:
 *  - select on the **counter** reading (`amount > used`), which is correct for
 *    both — an unclaimed mine row is `1 > 0` / `5 > 0`;
 *  - write `used = COALESCE(amount, 1)`, which is correct under both readings and
 *    leaves nothing behind for the other reader to offer.
 *
 * `source` is mandatory for the same reason: "everything owed" is not
 * well-defined across sources that disagree about what `used` means.
 */
@Injectable()
export class CajaRepository {
  constructor(
    @Inject(DRIZZLE) private readonly db: MySql2Database<Record<string, never>>,
  ) {}

  /**
   * Atomically spends everything `uuid` is owed from `source` and returns what
   * was spent. An empty array means nothing was owed — the caller must grant
   * nothing rather than fall back to any other view of the player's inventory.
   */
  async spend(uuid: string, source: CajaSource): Promise<ObjetoMC[]> {
    return await this.db.transaction(async (tx) => {
      const rows = await tx
        .select()
        .from(smartRotomInventory)
        .where(
          and(
            eq(smartRotomInventory.uuid, uuid),
            eq(smartRotomInventory.sourceType, source),
            gt(smartRotomInventory.amount, smartRotomInventory.used),
          ),
        )
        .for('update');

      if (rows.length === 0) return [];

      for (const row of rows) {
        const [res] = await tx
          .update(smartRotomInventory)
          .set({
            used: sql`COALESCE(${smartRotomInventory.amount}, 1)`,
          } as unknown as SmartRotomInventoryItem)
          .where(
            and(
              eq(smartRotomInventory.id, row.id),
              eq(smartRotomInventory.used, row.used ?? 0),
            ),
          );

        if (res.affectedRows !== 1) {
          throw new ConflictException('Inventory changed during the claim');
        }
      }

      return rows.map((row) => ({
        id: row.itemId,
        // What is still owed on this row, not its whole amount: a partially
        // consumed arcade row must not re-grant what was already handed over.
        cantidad: (row.amount ?? 1) - (row.used ?? 0),
      }));
    });
  }
}
