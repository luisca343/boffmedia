import { Inject, Injectable, ConflictException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { and, eq, gt, inArray, isNull, or, sql, SQL } from 'drizzle-orm';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import {
  smartRotomInventory,
  SmartRotomInventoryItem,
} from '@/_db/schema/SmartRotom';
import { CajaSource } from '../dto/claim-caja.dto';

/**
 * How long a reservation stays exclusive before it is reclaimable (DARCAJA.md §7).
 * The happy path clears a reservation in seconds (reserve → deliver → confirm), so
 * this only governs recovery: after a lost delivery the player waits this long,
 * then the rows free up and a re-claim redelivers them. Long enough to swallow a
 * few confirm retries; short enough that a disconnected player is not stuck.
 */
export const RESERVATION_TTL_MINUTES = 5;

/**
 * The single spend path for `rotom_inventory`, in two shapes:
 *
 *  - **One-shot** (`spend`/`spendByIds`): reads and marks `used` in one step. Simple,
 *    but the caller must deliver what it gets — if delivery fails the reward is gone
 *    (the `/caja/claim` route; kept for callers that accept that).
 *  - **Two-phase** (`reserve` → `confirm`): `reserve` soft-locks the rows and returns
 *    the grant without spending; the deliverer `confirm`s only after the items are in
 *    the player's hands. A reservation that is never confirmed expires
 *    (`RESERVATION_TTL_MINUTES`) and the rows are claimable again — so a dropped
 *    connection loses nothing (DARCAJA.md §7). This is the path the mod uses.
 *
 * `used` is read two different ways in this ledger and always has been: **mine**
 * treats it as a flag (`used = 0` means unclaimed) while the **arcade** treats it
 * as a consumed counter (`amount > used`). They only agree for `amount: 1` rows,
 * and mine rows are NOT always amount 1 — the live table holds mine rows with
 * amount up to 8. Both shapes below therefore:
 *  - select on the **counter** reading (`amount > used`), correct for both — an
 *    unclaimed mine row is `1 > 0` / `5 > 0`;
 *  - spend by writing `used = COALESCE(amount, 1)`, correct under both readings and
 *    leaving nothing behind for the other reader to offer.
 *
 * `source` is mandatory for the same reason: "everything owed" is not
 * well-defined across sources that disagree about what `used` means.
 *
 * Reservation is orthogonal to `used`: `reserve` never touches `used`, only stamps
 * `reservation_id`/`reserved_at`; `confirm` is the write that spends. A row is
 * *claimable* when `amount > used` AND it is not held by a live reservation.
 */
@Injectable()
export class CajaRepository {
  constructor(
    @Inject(DRIZZLE) private readonly db: MySql2Database<Record<string, never>>,
  ) {}

  // ---- One-shot: spend on read (the /caja/claim route) --------------------

  /**
   * Atomically spends everything `uuid` is owed from `source`, returning the rows
   * as the DB has them. An empty array means nothing was owed.
   */
  async spend(uuid: string, source: CajaSource): Promise<ClaimedRow[]> {
    return await this.spendWhere(
      and(this.claimable(), eq(smartRotomInventory.uuid, uuid), eq(smartRotomInventory.sourceType, source)),
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
      and(this.claimable(), eq(smartRotomInventory.uuid, uuid), inArray(smartRotomInventory.id, ids)),
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
        await this.markSpent(tx, row);
      }

      return rows.map(toClaimedRow);
    });
  }

  // ---- Two-phase: reserve, deliver, confirm (the mod path) ----------------

  /**
   * Soft-locks everything `uuid` is owed from `source` under a fresh reservation
   * id and returns the grant WITHOUT spending it. Rows already held by a live
   * reservation are skipped, so a double-submit reserves nothing the second time.
   * `reservationId` is null exactly when `rows` is empty.
   */
  async reserve(
    uuid: string,
    source: CajaSource,
  ): Promise<{ reservationId: string | null; rows: ClaimedRow[] }> {
    return await this.reserveWhere(
      and(this.claimable(), eq(smartRotomInventory.uuid, uuid), eq(smartRotomInventory.sourceType, source)),
    );
  }

  /** Reserve, narrowed to specific rows the player owns. See `spendByIds` for the selector contract. */
  async reserveByIds(
    uuid: string,
    ids: number[],
  ): Promise<{ reservationId: string | null; rows: ClaimedRow[] }> {
    if (ids.length === 0) return { reservationId: null, rows: [] };
    return await this.reserveWhere(
      and(this.claimable(), eq(smartRotomInventory.uuid, uuid), inArray(smartRotomInventory.id, ids)),
    );
  }

  private async reserveWhere(
    where: SQL | undefined,
  ): Promise<{ reservationId: string | null; rows: ClaimedRow[] }> {
    return await this.db.transaction(async (tx) => {
      const rows = await tx
        .select()
        .from(smartRotomInventory)
        .where(where)
        .for('update');

      if (rows.length === 0) return { reservationId: null, rows: [] };

      const reservationId = randomUUID();
      const [res] = await tx
        .update(smartRotomInventory)
        .set({
          reservationId,
          reservedAt: sql`NOW()`,
        } as unknown as SmartRotomInventoryItem)
        .where(
          inArray(
            smartRotomInventory.id,
            rows.map((r) => r.id),
          ),
        );

      // We locked these rows FOR UPDATE, so nothing else can have touched them.
      if (res.affectedRows !== rows.length) {
        throw new ConflictException('Inventory changed during the reservation');
      }

      return { reservationId, rows: rows.map(toClaimedRow) };
    });
  }

  /**
   * Turns a reservation into a spend: marks every still-owed row of `reservationId`
   * as `used` and clears the reservation. Returns how many rows were spent — 0 if
   * the reservation was already confirmed or has expired and been reclaimed, so a
   * replay is a harmless no-op. Scoped to `uuid` as defence in depth (the id is
   * already an unguessable UUID).
   */
  async confirm(uuid: string, reservationId: string): Promise<number> {
    const [res] = await this.db
      .update(smartRotomInventory)
      .set({
        used: sql`COALESCE(${smartRotomInventory.amount}, 1)`,
        reservationId: null,
        reservedAt: null,
      } as unknown as SmartRotomInventoryItem)
      .where(
        and(
          eq(smartRotomInventory.uuid, uuid),
          eq(smartRotomInventory.reservationId, reservationId),
          gt(smartRotomInventory.amount, smartRotomInventory.used),
        ),
      );
    return res.affectedRows;
  }

  /**
   * Clears reservation stamps that were never confirmed and are older than the TTL,
   * returning them to the claimable pool. Correctness does not depend on this — the
   * `claimable()` predicate already treats an expired reservation as free — it just
   * keeps the columns tidy and observable. Returns how many rows were reclaimed.
   */
  async sweepExpiredReservations(): Promise<number> {
    const [res] = await this.db
      .update(smartRotomInventory)
      .set({
        reservationId: null,
        reservedAt: null,
      } as unknown as SmartRotomInventoryItem)
      .where(
        and(
          this.reservationExpired(),
          gt(smartRotomInventory.amount, smartRotomInventory.used),
        ),
      );
    return res.affectedRows;
  }

  // ---- Shared predicates ---------------------------------------------------

  /** A row that is still owed and not held by a live reservation. */
  private claimable(): SQL {
    return and(
      gt(smartRotomInventory.amount, smartRotomInventory.used),
      or(isNull(smartRotomInventory.reservationId), this.reservationExpired()),
    ) as SQL;
  }

  /** A reservation stamp older than the TTL — i.e. a stale hold, treated as free. */
  private reservationExpired(): SQL {
    return sql`${smartRotomInventory.reservedAt} < (NOW() - INTERVAL ${sql.raw(
      String(RESERVATION_TTL_MINUTES),
    )} MINUTE)`;
  }

  private async markSpent(
    tx: Parameters<Parameters<MySql2Database['transaction']>[0]>[0],
    row: SmartRotomInventoryItem,
  ): Promise<void> {
    const [res] = await tx
      .update(smartRotomInventory)
      .set({
        used: sql`COALESCE(${smartRotomInventory.amount}, 1)`,
        reservationId: null,
        reservedAt: null,
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
}

/** A row as the database has it, granted (or about to be). The only safe source for a payout. */
function toClaimedRow(row: SmartRotomInventoryItem): ClaimedRow {
  return {
    id: row.id,
    itemId: row.itemId,
    itemType: row.itemType,
    itemData: row.itemData,
    granted: (row.amount ?? 1) - (row.used ?? 0),
  };
}

/** A row as the database has it, after it was spent. The only safe source for a payout. */
export interface ClaimedRow {
  id: number;
  itemId: string;
  itemType: string;
  itemData: string | null;
  granted: number;
}
