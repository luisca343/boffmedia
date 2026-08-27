import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { and, desc, eq, inArray, lt, sql } from 'drizzle-orm';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import {
  wigglypopListings,
  wigglypopOrderLines,
  wigglypopOrders,
  WigglypopOrder,
  WigglypopOrderLine,
} from '@/_db/schema/SmartRotomWigglypop';

export interface OrderWithLines extends WigglypopOrder {
  lines: WigglypopOrderLine[];
}

export interface NewOrderLine {
  listingId: number;
  sellerUuid: string;
  kind: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
}

@Injectable()
export class WigglypopOrdersRepository {
  constructor(
    @Inject(DRIZZLE) private readonly db: MySql2Database<Record<string, never>>,
  ) {}

  private async withLines(orders: WigglypopOrder[]): Promise<OrderWithLines[]> {
    if (orders.length === 0) return [];
    const lines = await this.db
      .select()
      .from(wigglypopOrderLines)
      .where(
        inArray(
          wigglypopOrderLines.orderId,
          orders.map((o) => o.id),
        ),
      );

    const by = new Map<number, WigglypopOrderLine[]>();
    for (const l of lines) {
      const bucket = by.get(l.orderId) ?? [];
      bucket.push(l);
      by.set(l.orderId, bucket);
    }
    return orders.map((o) => ({ ...o, lines: by.get(o.id) ?? [] }));
  }

  /**
   * Creates the order, its lines AND takes every listing off the shelf in ONE
   * transaction.
   *
   * Flipping the listings in a service-side loop after the order commits is
   * wrong: a failure between the two leaves a paid-for order whose listings are
   * still `disponible`, i.e. sellable twice.
   *
   * If an idempotency key is provided and an order with that key already exists,
   * returns the existing order without creating a duplicate.
   */
  async create(
    order: {
      code: string;
      buyerUuid: string;
      subtotal: number;
      fee: number;
      total: number;
      status: string;
      idempotencyKey?: string;
    },
    lines: NewOrderLine[],
    reserveListings: number[] = [],
  ): Promise<OrderWithLines> {
    const { idempotencyKey } = order;

    // If an idempotency key is provided, check if this order already exists.
    // MySQL allows NULL in UNIQUE indexes, so only non-NULL keys trigger the lookup.
    if (idempotencyKey) {
      const existing = await this.db
        .select({ id: wigglypopOrders.id })
        .from(wigglypopOrders)
        .where(
          and(
            eq(wigglypopOrders.idempotencyKey, idempotencyKey),
            // Scoped to the buyer: without this, a key collision would hand one
            // buyer another buyer's full order — lines, totals and all.
            eq(wigglypopOrders.buyerUuid, order.buyerUuid),
          ),
        )
        .limit(1);

      if (existing.length > 0) {
        // Idempotent replay: return the existing order without creating a duplicate.
        return (await this.findById(existing[0].id)) as OrderWithLines;
      }
    }

    const orderId = await this.db.transaction(async (tx) => {
      const inserted = await tx.insert(wigglypopOrders).values({
        code: order.code,
        buyerUuid: order.buyerUuid,
        subtotal: order.subtotal,
        fee: order.fee,
        total: order.total,
        status: order.status,
        idempotencyKey: idempotencyKey ?? null,
      });
      const id = inserted[0].insertId;

      if (lines.length > 0) {
        await tx
          .insert(wigglypopOrderLines)
          .values(lines.map((l) => ({ ...l, orderId: id })));
      }

      // Atomically claim every listing from 'activo' to 'reservado' in the same transaction.
      // The priceLine() check outside this tx is a fast-fail optimization, but this conditional
      // UPDATE is the only place that actually prevents a race — two concurrent buyers both
      // seeing 'activo' and both trying to claim the same listing. If any listing fails to claim
      // (already reserved by another buyer), roll back the entire order.
      for (const listingId of reserveListings) {
        const result = await tx
          .update(wigglypopListings)
          .set({ status: 'reservado' })
          .where(
            and(
              eq(wigglypopListings.id, listingId),
              eq(wigglypopListings.status, 'activo'),
            ),
          );

        if (result[0].affectedRows === 0) {
          throw new BadRequestException(
            'One or more listings are no longer available (reservado)',
          );
        }
      }

      return id;
    });

    return (await this.findById(orderId)) as OrderWithLines;
  }

  async findById(id: number): Promise<OrderWithLines | null> {
    const rows = await this.db
      .select()
      .from(wigglypopOrders)
      .where(eq(wigglypopOrders.id, id));
    if (rows.length === 0) return null;
    const [hydrated] = await this.withLines(rows);
    return hydrated;
  }

  async findByBuyer(uuid: string): Promise<OrderWithLines[]> {
    const rows = await this.db
      .select()
      .from(wigglypopOrders)
      .where(eq(wigglypopOrders.buyerUuid, uuid))
      .orderBy(desc(wigglypopOrders.createdAt));
    return this.withLines(rows);
  }

  /** Orders a player is on the SELLING side of — they own at least one line. */
  async findBySeller(uuid: string): Promise<OrderWithLines[]> {
    const lineRows = await this.db
      .selectDistinct({ orderId: wigglypopOrderLines.orderId })
      .from(wigglypopOrderLines)
      .where(eq(wigglypopOrderLines.sellerUuid, uuid));
    const ids = lineRows.map((r) => r.orderId);
    if (ids.length === 0) return [];

    const rows = await this.db
      .select()
      .from(wigglypopOrders)
      .where(inArray(wigglypopOrders.id, ids))
      .orderBy(desc(wigglypopOrders.createdAt));
    return this.withLines(rows);
  }

  async setEscrowTx(id: number, escrowTxId: number): Promise<void> {
    await this.db
      .update(wigglypopOrders)
      .set({ escrowTxId })
      .where(eq(wigglypopOrders.id, id));
  }

  async setStatus(id: number, status: string): Promise<void> {
    await this.db
      .update(wigglypopOrders)
      .set({ status })
      .where(eq(wigglypopOrders.id, id));
  }

  async setLineDelivery(
    lineId: number,
    deliveryStatus: string,
    extra?: { settleTxId?: number; confirmedAt?: Date; takenPayload?: unknown },
  ): Promise<void> {
    const set: Record<string, unknown> = { deliveryStatus };
    if (extra?.settleTxId !== undefined) set.settleTxId = extra.settleTxId;
    if (extra?.confirmedAt !== undefined) set.confirmedAt = extra.confirmedAt;
    if (extra?.takenPayload !== undefined)
      set.takenPayload = extra.takenPayload;

    await this.db
      .update(wigglypopOrderLines)
      .set(set)
      .where(eq(wigglypopOrderLines.id, lineId));
  }

  /**
   * Move a line's delivery state ONLY if it is still in one of `expected`, and
   * report whether this call is the one that moved it.
   *
   * This is the saga's claim primitive, and the reason it is a conditional
   * UPDATE rather than a read-then-write: two dispatcher instances (or a retry
   * racing the original request) can reach the same line at the same moment,
   * and an unconditional write would let both proceed to give the same Pokémon
   * away. Losing the race returns `false`, which every caller treats as "someone
   * else owns this line now" — never as an error.
   */
  async setLineDeliveryIf(
    lineId: number,
    expected: string | string[],
    deliveryStatus: string,
    extra?: { settleTxId?: number; confirmedAt?: Date; takenPayload?: unknown },
  ): Promise<boolean> {
    const from = Array.isArray(expected) ? expected : [expected];
    const set: Record<string, unknown> = { deliveryStatus };
    if (extra?.settleTxId !== undefined) set.settleTxId = extra.settleTxId;
    if (extra?.confirmedAt !== undefined) set.confirmedAt = extra.confirmedAt;
    if (extra?.takenPayload !== undefined)
      set.takenPayload = extra.takenPayload;

    const [result] = await this.db
      .update(wigglypopOrderLines)
      .set(set)
      .where(
        and(
          eq(wigglypopOrderLines.id, lineId),
          inArray(wigglypopOrderLines.deliveryStatus, from),
        ),
      );
    return (result as { affectedRows?: number }).affectedRows === 1;
  }

  /**
   * Orders parked in a non-terminal state and untouched for `staleMs`.
   *
   * The staleness window is what separates a crashed attempt from one that is
   * simply still running: an order the current process is working on right now
   * has just been written to, so it never appears here. Without the window the
   * sweeper would escalate live orders out from under themselves.
   */
  async findStalled(staleMs: number, limit = 50): Promise<OrderWithLines[]> {
    const cutoff = new Date(Date.now() - staleMs);
    const orders = await this.db
      .select()
      .from(wigglypopOrders)
      .where(
        and(
          inArray(wigglypopOrders.status, ['escrow', 'transferido']),
          lt(wigglypopOrders.updatedAt, cutoff),
        ),
      )
      .orderBy(wigglypopOrders.id)
      .limit(limit);
    return this.withLines(orders);
  }

  /** Bumps `updatedAt` so an order the saga is actively working is not swept. */
  async touch(id: number): Promise<void> {
    await this.db
      .update(wigglypopOrders)
      .set({ updatedAt: new Date() })
      .where(eq(wigglypopOrders.id, id));
  }

  async setAllLinesDelivery(
    orderId: number,
    deliveryStatus: string,
  ): Promise<void> {
    await this.db
      .update(wigglypopOrderLines)
      .set({ deliveryStatus })
      .where(eq(wigglypopOrderLines.orderId, orderId));
  }

  /**
   * How many order lines a seller has actually COMPLETED. This is the only definition of
   * "sales" anywhere in Wigglypop — there is no cached counter to drift out of sync.
   */
  async countCompletedSales(sellerUuid: string): Promise<number> {
    const rows = await this.db
      .select({ total: sql<number>`count(*)` })
      .from(wigglypopOrderLines)
      .where(
        and(
          eq(wigglypopOrderLines.sellerUuid, sellerUuid),
          eq(wigglypopOrderLines.deliveryStatus, 'confirmado'),
        ),
      );
    return Number(rows[0]?.total ?? 0);
  }

  /** Did this buyer actually buy from this seller on this order? Gates review creation. */
  async findLinesByOrder(orderId: number): Promise<WigglypopOrderLine[]> {
    return this.db
      .select()
      .from(wigglypopOrderLines)
      .where(eq(wigglypopOrderLines.orderId, orderId));
  }
}
