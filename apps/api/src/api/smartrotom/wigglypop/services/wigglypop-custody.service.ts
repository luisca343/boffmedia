import { BadRequestException, Injectable } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { env } from '@/config/env';
import { WingullFacadeService } from '../../wingull/wingull.facade.service';
import { WigglypopEscrowService } from './wigglypop-escrow.service';
import {
  OrderWithLines,
  WigglypopOrdersRepository,
} from '../repositories/wigglypop-orders.repository';
import {
  ListingWithContents,
  WigglypopListingsRepository,
} from '../repositories/wigglypop-listings.repository';
import { isItemsKind } from '../dto/wigglypop.dto';

// ─────────────────────────────────────────────────────────────────────────────
// Settlement. The single most dangerous code in Wigglypop, and the reason the whole feature
// is behind a flag.
//
// The Pixelmon server can currently only GIVE a Pokémon. It cannot TAKE one. So if a sale
// called givePokemon() today, the buyer would receive a copy and the seller would keep the
// original: the market would print Pokémon. That is not a bug we can patch around — it is the
// absence of a plugin route.
//
// Hence two paths, chosen by WIGGLYPOP_ATOMIC_CUSTODY (default FALSE):
//
//   MANUAL (today) — the API moves MONEY ONLY. Buyer → escrow at purchase; escrow → seller
//     when the buyer confirms they received the mon in-game; escrow → buyer on cancel. The two
//     players hand the Pokémon over themselves. This path MUST NEVER CALL givePokemon().
//
//   ATOMIC (once /takepokemon + /takeitems ship) — the API takes the goods off the seller,
//     THEN takes the money, THEN gives the goods to the buyer, THEN pays the seller. Takes come
//     first precisely so that a failed take charges the buyer nothing at all.
//
// Both paths are idempotent: replaying any step must never move money twice. The guards are the
// persisted status columns (order.status, order.escrowTxId, line.deliveryStatus,
// line.settleTxId), never in-memory state.
// ─────────────────────────────────────────────────────────────────────────────

// What a successful take handed back, kept so a later failure can be undone against the real
// thing that left the seller's PC rather than against the listing snapshot.
interface TakenLine {
  lineId: number;
  sellerUuid: string;
  kind: string;
  pokespec?: string;
  items?: Array<{ id: string; amount: number }>;
}

// The house's cut, kept by the escrow account. The buyer pays subtotal + fee; the seller is
// paid the line's subtotal. The difference simply stays in the MARKET account.
export const WIGGLYPOP_FEE_RATE = 0.025;

export function computeFee(subtotal: number): number {
  return Math.round(subtotal * WIGGLYPOP_FEE_RATE);
}

@Injectable()
export class WigglypopCustodyService {
  constructor(
    private readonly logger: Logger,
    private readonly escrow: WigglypopEscrowService,
    private readonly wingull: WingullFacadeService,
    private readonly ordersRepository: WigglypopOrdersRepository,
    private readonly listingsRepository: WigglypopListingsRepository,
  ) {}

  isAtomic(): boolean {
    return env.WIGGLYPOP_ATOMIC_CUSTODY === true;
  }

  /**
   * Called right after the order row exists. Routes to whichever custody path is enabled and
   * returns the order in its settled state.
   */
  async settleNewOrder(order: OrderWithLines): Promise<OrderWithLines> {
    return this.isAtomic()
      ? this.settleAtomic(order)
      : this.settleManual(order);
  }

  // ─── MANUAL ─────────────────────────────────────────────────────────────────

  /**
   * Money only: buyer → escrow. The order parks at `escrow` until the seller marks the in-game
   * hand-off (/transferred) and the buyer confirms it (/confirm).
   *
   * It does not touch the game server AT ALL. No givePokemon, no takePokemon — calling
   * givePokemon here without a matching take is exactly the duplication bug the flag exists to
   * prevent.
   */
  private async settleManual(order: OrderWithLines): Promise<OrderWithLines> {
    await this.holdEscrow(order);
    return (await this.ordersRepository.findById(order.id)) as OrderWithLines;
  }

  /** Buyer → escrow, once. Idempotent: an order that already has an escrowTxId is left alone. */
  private async holdEscrow(order: OrderWithLines): Promise<number> {
    if (order.escrowTxId) {
      this.logger.warn(
        `Order ${order.code} already holds escrow tx #${order.escrowTxId} — not charging again`,
      );
      return order.escrowTxId;
    }

    const txId = await this.escrow.hold(
      order.buyerUuid,
      order.total,
      `Wigglypop ${order.code} — compra`,
    );
    await this.ordersRepository.setEscrowTx(order.id, txId);
    return txId;
  }

  /**
   * The seller says they handed the goods over in-game. Money does NOT move here — this is a
   * claim, not a settlement. Only the buyer's /confirm releases the escrow.
   */
  async markTransferred(order: OrderWithLines): Promise<void> {
    if (order.status === 'completado' || order.status === 'cancelado') {
      throw new BadRequestException(
        `Order ${order.code} is already ${order.status}`,
      );
    }
    if (order.status === 'transferido') return; // idempotent

    await this.ordersRepository.setAllLinesDelivery(order.id, 'transferido');
    await this.ordersRepository.setStatus(order.id, 'transferido');
  }

  /**
   * The buyer confirms receipt: escrow → seller, per line. Idempotent per line — a line that
   * already carries a settleTxId is skipped, so a double /confirm cannot pay a seller twice.
   */
  async confirmOrder(order: OrderWithLines): Promise<void> {
    if (order.status === 'cancelado') {
      throw new BadRequestException(`Order ${order.code} was cancelled`);
    }
    if (order.status === 'completado') return; // idempotent
    if (!order.escrowTxId) {
      throw new BadRequestException(
        `Order ${order.code} never took the buyer's money — nothing to release`,
      );
    }

    for (const line of order.lines) {
      if (line.settleTxId) continue; // already paid out
      await this.payOutLine(order, line.id, line.sellerUuid, line.lineTotal);
    }

    await this.ordersRepository.setStatus(order.id, 'completado');
    await this.markListingsSold(order);
  }

  /** Escrow → buyer. The refund. Idempotent: a cancelled order is not refunded twice. */
  async cancelOrder(order: OrderWithLines): Promise<void> {
    if (order.status === 'cancelado') return; // idempotent
    if (order.status === 'completado') {
      throw new BadRequestException(
        `Order ${order.code} is already completed — it cannot be cancelled`,
      );
    }

    // Only refund what was actually taken. An order that never managed to hold escrow has
    // nothing to give back, and refunding it would MINT money into the buyer's account.
    if (order.escrowTxId) {
      await this.escrow.refund(
        order.buyerUuid,
        order.total,
        `Wigglypop ${order.code} — reembolso`,
      );
    }

    await this.ordersRepository.setAllLinesDelivery(order.id, 'cancelado');
    await this.ordersRepository.setStatus(order.id, 'cancelado');
    await this.releaseListings(order);
  }

  // ─── ATOMIC ─────────────────────────────────────────────────────────────────

  /**
   * Take → charge → give → pay. Ordered so the buyer's money is only ever touched once every
   * seller's goods are already in the market's hands.
   *
   * If ANY take fails, everything already taken is handed straight back to its seller and the
   * buyer is charged NOTHING — no escrow hold has happened yet at that point.
   *
   * ⚠️  CRITICAL: Failure modes when WIGGLYPOP_ATOMIC_CUSTODY is ON.
   *
   * The atomic path has NO outbox pattern and NO compensation saga. A failure between
   * phases leaves goods and money separated and unreconcilable:
   *
   * • Phase A (TAKE) succeeds, Phase B (CHARGE) fails → Phase A is reversed (giveLine restores).
   *   SAFE.
   *
   * • Phase B (CHARGE) succeeds, Phase C (GIVE) fails BEFORE payment → goods are with market,
   *   money is in escrow, but buyer has nothing and seller is not paid. The line is marked
   *   'pendiente' with takenPayload persisted, but recovery requires MANUAL intervention or a
   *   replay mechanism (the code here does NOT auto-retry).
   *   UNSAFE. Goods and money are separated with no automatic path to reconciliation.
   *
   * • Phase B (CHARGE) succeeds, Phase C (GIVE) fails AFTER at least one payout → goods and
   *   money are both out but UNEVENLY DISTRIBUTED. Some sellers are paid while buyers are
   *   incomplete. Recovery by hand.
   *   UNSAFE. The invariant (goods paid, or money refunded) is broken.
   *
   * A follow-up saga MUST:
   *
   *   1. Wrap take+charge+give+payout in an outbox transaction: a single row inserted ATOMICALLY
   *      with the escrow hold, keyed by (orderId, lineId), marked with the phase number it
   *      reached.
   *
   *   2. On restart or error, query the outbox to detect incomplete orders and replay from the
   *      last-completed phase. Replays are idempotent because every phase is guarded by the DB
   *      state it changed (order.status, line.deliveryStatus, settleTxId).
   *
   *   3. CRITICAL: take and charge MUST be atomic (same transaction), so a charge-failed recovery
   *      can assume all takes were rolled back. TODAY they are separate phases — Phase A's success
   *      triggers a restore on Phase B's failure, but if the restore call itself is lost (network
   *      failure, process crash), goods are orphaned.
   *
   *   4. The saga must run either on a cron (every N minutes, pick up incomplete outbox rows) or
   *      as part of order teardown (POST /order/:id/confirm/retry or similar), never inside
   *      settleNewOrder — that leaves the buyer's request hanging if the saga fails.
   */
  private async settleAtomic(order: OrderWithLines): Promise<OrderWithLines> {
    if (order.status === 'completado') return order; // idempotent

    const listings = await this.listingsRepository.findManyByIds(
      order.lines.map((l) => l.listingId),
    );
    const byListing = new Map(listings.map((l) => [l.id, l]));

    // Phase A — take everything off the sellers. No money has moved yet.
    const taken: TakenLine[] = [];
    try {
      for (const line of order.lines) {
        if (line.deliveryStatus === 'confirmado') continue; // replay guard
        const listing = byListing.get(line.listingId);
        if (!listing) {
          throw new BadRequestException(
            `Listing ${line.listingId} vanished mid-order`,
          );
        }
        taken.push(await this.takeLine(line.id, line.sellerUuid, listing));
      }
    } catch (error: any) {
      // Nothing was charged. Put back whatever we already took, and stop.
      // GUARD: if restore fails, we stop here and fail HARD. See settleAtomic docstring.
      await this.restore(taken);
      await this.ordersRepository.setAllLinesDelivery(order.id, 'cancelado');
      await this.ordersRepository.setStatus(order.id, 'cancelado');
      await this.releaseListings(order);
      throw new BadRequestException(
        `Wigglypop could not take the goods from the seller, so you were not charged: ${error?.message}`,
      );
    }

    // Phase B — now, and only now, take the buyer's money.
    try {
      await this.holdEscrow(order);
    } catch (error: any) {
      // The buyer cannot pay. The sellers must not lose their Pokémon over it.
      await this.restore(taken);
      await this.ordersRepository.setAllLinesDelivery(order.id, 'cancelado');
      await this.ordersRepository.setStatus(order.id, 'cancelado');
      await this.releaseListings(order);
      throw new BadRequestException(
        `Payment failed, so nothing left the sellers: ${error?.message}`,
      );
    }

    // Phase C — hand the goods to the buyer and pay the sellers.
    //
    // Past this point a failure can no longer be undone cleanly: the money is in escrow and the
    // goods are out of the sellers' PCs. A give that fails is logged loudly and the line is left
    // `pendiente` with its takenPayload persisted, so it can be replayed or refunded by hand
    // against what actually left the PC. It is deliberately NOT silently swallowed.
    for (const t of taken) {
      const line = order.lines.find((l) => l.id === t.lineId);
      if (!line) continue;
      try {
        await this.giveLine(order.buyerUuid, t);
        await this.payOutLine(
          order,
          line.id,
          line.sellerUuid,
          line.lineTotal,
          t,
        );
      } catch (error: any) {
        this.logger.error(
          `Wigglypop ${order.code} line #${line.id}: goods were taken and the buyer was charged, ` +
            `but delivery/payout failed (${error?.message}). Payload persisted for manual replay.`,
        );
        await this.ordersRepository.setLineDelivery(line.id, 'pendiente', {
          takenPayload: t as unknown,
        });
      }
    }

    const settled = (await this.ordersRepository.findById(
      order.id,
    )) as OrderWithLines;
    const allDone = settled.lines.every(
      (l) => l.deliveryStatus === 'confirmado',
    );
    await this.ordersRepository.setStatus(
      order.id,
      allDone ? 'completado' : 'transferido',
    );
    if (allDone) await this.markListingsSold(settled);

    return (await this.ordersRepository.findById(order.id)) as OrderWithLines;
  }

  private async takeLine(
    lineId: number,
    sellerUuid: string,
    listing: ListingWithContents,
  ): Promise<TakenLine> {
    if (isItemsKind(listing.kind)) {
      const { taken } = await this.wingull.takeItems(
        sellerUuid,
        listing.items.map((i) => ({ id: i.itemId, amount: i.qty })),
      );
      await this.ordersRepository.setLineDelivery(lineId, 'transferido', {
        takenPayload: { taken } as unknown,
      });
      return { lineId, sellerUuid, kind: listing.kind, items: taken };
    }

    // A `mon` listing holds exactly one; a `bundle` may hold several. Every one of them is
    // taken against the pokemonKey recorded at listing time — the plugin refuses the take if
    // the slot no longer matches, which is what makes the sale unraceable.
    const specs: string[] = [];
    for (const mon of listing.mons) {
      const { pokespec } = await this.wingull.takePokemon(
        sellerUuid,
        mon.sourceBox,
        mon.sourceIndex,
        mon.pokemonKey,
      );
      specs.push(pokespec);
    }

    const pokespec = specs.join('\n');
    await this.ordersRepository.setLineDelivery(lineId, 'transferido', {
      takenPayload: { specs } as unknown,
    });
    return { lineId, sellerUuid, kind: listing.kind, pokespec };
  }

  private async giveLine(buyerUuid: string, t: TakenLine): Promise<void> {
    if (isItemsKind(t.kind)) {
      if (!t.items?.length) return;
      // Settle against what the plugin ACTUALLY removed, never against what we asked for.
      await this.wingull.giveItems(
        buyerUuid,
        t.items.map((i) => ({ id: i.id, amount: i.amount })),
      );
      return;
    }
    if (!t.pokespec) return;
    for (const spec of t.pokespec.split('\n').filter(Boolean)) {
      await this.wingull.givePokemon(buyerUuid, spec, true);
    }
  }

  /**
   * Hands taken goods back to the sellers they came from. Best-effort per line: one seller's
   * restore failing must not abandon the rest, so each is logged and the loop continues.
   */
  private async restore(taken: TakenLine[]): Promise<void> {
    for (const t of taken) {
      try {
        await this.giveLine(t.sellerUuid, t);
        await this.ordersRepository.setLineDelivery(t.lineId, 'cancelado');
      } catch (error: any) {
        this.logger.error(
          `Wigglypop rollback FAILED for line #${t.lineId}: could not return the goods to ` +
            `seller ${t.sellerUuid} (${error?.message}). Payload: ${JSON.stringify(t)}`,
        );
      }
    }
  }

  // ─── Shared ─────────────────────────────────────────────────────────────────

  /** Escrow → seller for one line. The `settleTxId` it writes is the double-payout guard. */
  private async payOutLine(
    order: OrderWithLines,
    lineId: number,
    sellerUuid: string,
    amount: number,
    takenPayload?: TakenLine,
  ): Promise<void> {
    const txId = await this.escrow.release(
      sellerUuid,
      amount,
      `Wigglypop ${order.code} — venta`,
    );
    await this.ordersRepository.setLineDelivery(lineId, 'confirmado', {
      settleTxId: txId,
      confirmedAt: new Date(),
      takenPayload: takenPayload as unknown,
    });
  }

  private async markListingsSold(order: OrderWithLines): Promise<void> {
    for (const line of order.lines) {
      await this.listingsRepository.markSold(
        line.listingId,
        order.id,
        line.lineTotal,
      );
    }
  }

  /** A cancelled order puts its listings back on the shelf. */
  private async releaseListings(order: OrderWithLines): Promise<void> {
    for (const line of order.lines) {
      const listing = await this.listingsRepository.findById(line.listingId);
      // Do not resurrect a listing that some other order has since legitimately sold.
      if (listing && listing.status === 'reservado') {
        await this.listingsRepository.setStatus(line.listingId, 'activo');
      }
    }
  }
}
