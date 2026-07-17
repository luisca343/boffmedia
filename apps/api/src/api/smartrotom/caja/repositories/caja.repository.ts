import { Inject, Injectable, ConflictException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { and, eq, gt, inArray, sql, SQL } from 'drizzle-orm';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import {
  smartRotomInventory,
  SmartRotomInventoryItem,
} from '@/_db/schema/SmartRotom';
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
   * Atomically spends everything `uuid` is owed from `source`, returning the rows
   * as the DB has them. An empty array means nothing was owed.
   */
  async spend(uuid: string, source: CajaSource): Promise<ClaimedRow[]> {
    return await this.spendWhere(
      and(
        eq(smartRotomInventory.uuid, uuid),
        eq(smartRotomInventory.sourceType, source),
        gt(smartRotomInventory.amount, smartRotomInventory.used),
      ),
    );
  }

  /**
   * Spends specific rows this player owns. `ids` only selects — deliver from the
   * returned rows, never from what the client sent. Rows not owned, unknown or
   * already spent do not come back.
   */
  async spendByIds(uuid: string, ids: number[]): Promise<ClaimedRow[]> {
    if (ids.length === 0) return [];
    return await this.spendWhere(
      and(
        eq(smartRotomInventory.uuid, uuid),
        inArray(smartRotomInventory.id, ids),
        gt(smartRotomInventory.amount, smartRotomInventory.used),
      ),
    );
  }

  private async spendWhere(where: SQL | undefined): Promise<ClaimedRow[]> {
    return await this.db.transaction(async (tx) => {
      const rows = await tx
        .select()
        .from(smartRotomInventory)
        .where(where)
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
        id: row.id,
        itemId: row.itemId,
        itemType: row.itemType,
        itemData: row.itemData,
        granted: (row.amount ?? 1) - (row.used ?? 0),
      }));
    });
  }
}

/** A row as the database has it, after it was spent. The only safe source for a payout. */
export interface ClaimedRow {
  id: number;
  itemId: string;
  itemType: string;
  itemData: string | null;
  granted: number;
}
