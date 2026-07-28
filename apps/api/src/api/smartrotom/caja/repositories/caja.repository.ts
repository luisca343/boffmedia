import { Inject, Injectable, ConflictException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { and, eq, gt, inArray, isNull, or, sql, SQL } from 'drizzle-orm';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import {
  rotomInventory,
  RotomInventoryItem,
} from '@/_db/schema/SmartRotom';
import { CajaSource } from '../dto/claim-caja.dto';

/** How long a reservation stays exclusive before its rows become reclaimable (DARCAJA.md §7). */
export const RESERVATION_TTL_MINUTES = 5;

/**
 * The single spend path for `rotom_inventory`. Two shapes: one-shot (`spend`/`spendByIds`)
 * marks `used` on read, so a failed delivery loses the reward; two-phase
 * (`reserve` → `confirm`, the mod path) soft-locks first, and an unconfirmed reservation
 * expires after the TTL and frees its rows, so a dropped delivery loses nothing (DARCAJA.md §7).
 *
 * `used` is read two ways: mine as a flag (`used = 0`), arcade as a counter (`amount > used`).
 * They only agree at amount 1, and mine rows can be up to 8 — so both shapes select on
 * `amount > used` and spend by writing `used = COALESCE(amount, 1)`. `source` is required
 * because "everything owed" is undefined across the two readings.
 */
@Injectable()
export class CajaRepository {
  constructor(
    @Inject(DRIZZLE) private readonly db: MySql2Database<Record<string, never>>,
  ) {}

  // ---- One-shot: spend on read (the /caja/claim route) --------------------

  /** Atomically spends everything `uuid` is owed from `source`. Empty array = nothing owed. */
  async spend(uuid: string, source: CajaSource): Promise<ClaimedRow[]> {
    return await this.spendWhere(
      and(
        this.claimable(),
        eq(rotomInventory.uuid, uuid),
        eq(rotomInventory.sourceType, source),
      ),
    );
  }

  /** Spends specific rows this player owns. `ids` only selects — deliver from the returned rows, never from the client's list. */
  async spendByIds(uuid: string, ids: number[]): Promise<ClaimedRow[]> {
    if (ids.length === 0) return [];
    return await this.spendWhere(
      and(
        this.claimable(),
        eq(rotomInventory.uuid, uuid),
        inArray(rotomInventory.id, ids),
      ),
    );
  }

  private async spendWhere(where: SQL | undefined): Promise<ClaimedRow[]> {
    return await this.db.transaction(async (tx) => {
      const rows = await tx
        .select()
        .from(rotomInventory)
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
   * Soft-locks everything `uuid` is owed from `source` under a new reservation id without
   * spending it. Rows held by a live reservation are skipped, so a double-submit reserves
   * nothing the second time. `reservationId` is null iff `rows` is empty.
   */
  async reserve(
    uuid: string,
    source: CajaSource,
  ): Promise<{ reservationId: string | null; rows: ClaimedRow[] }> {
    return await this.reserveWhere(
      and(
        this.claimable(),
        eq(rotomInventory.uuid, uuid),
        eq(rotomInventory.sourceType, source),
      ),
    );
  }

  /** Reserve, narrowed to specific rows the player owns. See `spendByIds` for the selector contract. */
  async reserveByIds(
    uuid: string,
    ids: number[],
  ): Promise<{ reservationId: string | null; rows: ClaimedRow[] }> {
    if (ids.length === 0) return { reservationId: null, rows: [] };
    return await this.reserveWhere(
      and(
        this.claimable(),
        eq(rotomInventory.uuid, uuid),
        inArray(rotomInventory.id, ids),
      ),
    );
  }

  private async reserveWhere(
    where: SQL | undefined,
  ): Promise<{ reservationId: string | null; rows: ClaimedRow[] }> {
    return await this.db.transaction(async (tx) => {
      const rows = await tx
        .select()
        .from(rotomInventory)
        .where(where)
        .for('update');

      if (rows.length === 0) return { reservationId: null, rows: [] };

      const reservationId = randomUUID();
      const [res] = await tx
        .update(rotomInventory)
        .set({
          reservationId,
          reservedAt: sql`NOW()`,
        } as unknown as RotomInventoryItem)
        .where(
          inArray(
            rotomInventory.id,
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
   * Spends the still-owed rows of `reservationId` and clears the hold. Returns rows
   * spent — 0 on replay or an expired/reclaimed reservation. `uuid` scoping is defence in depth.
   */
  async confirm(uuid: string, reservationId: string): Promise<number> {
    const [res] = await this.db
      .update(rotomInventory)
      .set({
        used: sql`COALESCE(${rotomInventory.amount}, 1)`,
        reservationId: null,
        reservedAt: null,
      } as unknown as RotomInventoryItem)
      .where(
        and(
          eq(rotomInventory.uuid, uuid),
          eq(rotomInventory.reservationId, reservationId),
          gt(rotomInventory.amount, rotomInventory.used),
        ),
      );
    return res.affectedRows;
  }

  /**
   * Clears stamps of unconfirmed reservations past the TTL. Housekeeping only —
   * `claimable()` already treats an expired hold as free. Returns rows reclaimed.
   */
  async sweepExpiredReservations(): Promise<number> {
    const [res] = await this.db
      .update(rotomInventory)
      .set({
        reservationId: null,
        reservedAt: null,
      } as unknown as RotomInventoryItem)
      .where(
        and(
          this.reservationExpired(),
          gt(rotomInventory.amount, rotomInventory.used),
        ),
      );
    return res.affectedRows;
  }

  // ---- Shared predicates ---------------------------------------------------

  /** A row that is still owed and not held by a live reservation. */
  private claimable(): SQL {
    return and(
      gt(rotomInventory.amount, rotomInventory.used),
      or(isNull(rotomInventory.reservationId), this.reservationExpired()),
    ) as SQL;
  }

  /** A reservation stamp older than the TTL — i.e. a stale hold, treated as free. */
  private reservationExpired(): SQL {
    return sql`${rotomInventory.reservedAt} < (NOW() - INTERVAL ${sql.raw(
      String(RESERVATION_TTL_MINUTES),
    )} MINUTE)`;
  }

  private async markSpent(
    tx: Parameters<Parameters<MySql2Database['transaction']>[0]>[0],
    row: RotomInventoryItem,
  ): Promise<void> {
    const [res] = await tx
      .update(rotomInventory)
      .set({
        used: sql`COALESCE(${rotomInventory.amount}, 1)`,
        reservationId: null,
        reservedAt: null,
      } as unknown as RotomInventoryItem)
      .where(
        and(
          eq(rotomInventory.id, row.id),
          eq(rotomInventory.used, row.used ?? 0),
        ),
      );

    if (res.affectedRows !== 1) {
      throw new ConflictException('Inventory changed during the claim');
    }
  }
}

/** A granted row as the database has it — the only safe source for a payout. */
function toClaimedRow(row: RotomInventoryItem): ClaimedRow {
  return {
    id: row.id,
    itemId: row.itemId,
    itemType: row.itemType,
    itemData: row.itemData,
    granted: (row.amount ?? 1) - (row.used ?? 0),
  };
}

/** A row as the database has it, after it was spent. */
export interface ClaimedRow {
  id: number;
  itemId: string;
  itemType: string;
  itemData: string | null;
  granted: number;
}
