import { Inject, Injectable } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import {
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

  async create(
    order: {
      code: string;
      buyerUuid: string;
      subtotal: number;
      fee: number;
      total: number;
      status: string;
    },
    lines: NewOrderLine[],
  ): Promise<OrderWithLines> {
    const inserted = await this.db.insert(wigglypopOrders).values({
      code: order.code,
      buyerUuid: order.buyerUuid,
      subtotal: order.subtotal,
      fee: order.fee,
      total: order.total,
      status: order.status,
    });
    const orderId = inserted[0].insertId;

    if (lines.length > 0) {
      await this.db
        .insert(wigglypopOrderLines)
        .values(lines.map((l) => ({ ...l, orderId })));
    }

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
    if (extra?.takenPayload !== undefined) set.takenPayload = extra.takenPayload;

    await this.db
      .update(wigglypopOrderLines)
      .set(set)
      .where(eq(wigglypopOrderLines.id, lineId));
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
