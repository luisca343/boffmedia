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
import { DELIVERY } from '../_shared/custody-state';
import { OutboxRepository } from '@api/outbox/repositories/outbox.repository';
import type { WigglypopOrderLine } from '@/_db/schema/SmartRotomWigglypop';

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
    private readonly outbox: OutboxRepository,
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
   * Take → charge → hand off. Ordered so the buyer's money is only ever touched
   * once every seller's goods are already in the market's hands, and so a failed
   * take charges the buyer nothing at all.
   *
   * **Delivery is deliberately NOT part of this call.** Phases A and B are
   * synchronous because the buyer's request has to end knowing whether they were
   * charged. Phase C — giving the goods to the buyer and paying the sellers — is
   * enqueued on the outbox and driven by `WigglypopSagaService`, because it is the
   * genuinely remote, retryable half: running it inline would leave the buyer's
   * HTTP request hanging on the game server, and a failure there would surface as
   * a 500 on an order that was already fully paid for.
   *
   * Every phase writes an INTENT marker before the call it names (see DELIVERY in
   * `_shared/custody-state.ts`). That is what makes recovery deterministic rather
   * than a guess:
   *
   *   • A call that RETURNS an error did not land. The marker is rolled back and
   *     the step is retried — by the outbox, with backoff.
   *   • A call that never returned (crash, OOM kill) leaves its intent marker
   *     behind. The sweeper finds it and escalates to `revision`, because the API
   *     genuinely cannot tell whether it landed, and both guesses are expensive:
   *     re-giving mints a second Pokémon, re-paying pays a seller twice.
   *
   * The one asymmetry worth knowing: TAKES are safely retryable and GIVES are
   * not. A take is guarded by the `pokemonKey` recorded at listing time, so the
   * plugin refuses a second take of a slot that no longer matches. A give carries
   * no such key, so the saga never retries one it is not certain failed.
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
        if (line.deliveryStatus !== DELIVERY.PENDING) continue; // replay guard
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
      await this.restore(taken);
      await this.cancelUntouchedLines(order);
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
      await this.cancelUntouchedLines(order);
      await this.ordersRepository.setStatus(order.id, 'cancelado');
      await this.releaseListings(order);
      throw new BadRequestException(
        `Payment failed, so nothing left the sellers: ${error?.message}`,
      );
    }

    // Phase C — handed to the saga. The order parks at `transferido`: goods with
    // the market, money in escrow, delivery owed.
    //
    // The enqueue is what makes the hand-off durable. If this process dies on the
    // next line, the row is already on the queue and the dispatcher picks it up;
    // if the enqueue itself fails, the sweeper still finds the order stalled in
    // `transferido` and resumes it. Two independent paths to the same place,
    // because losing delivery entirely is the failure that costs a Pokémon.
    await this.ordersRepository.setStatus(order.id, 'transferido');
    try {
      await this.outbox.enqueue(
        'wigglypop:deliver-order',
        { orderId: order.id },
        `wigglypop:deliver:${order.id}`,
      );
    } catch (error: any) {
      // A duplicate key here means delivery is ALREADY queued — that is success,
      // not failure. Anything else is left to the sweeper.
      this.logger.warn(
        `Wigglypop ${order.code}: delivery enqueue did not take (${error?.message}); ` +
          `the sweeper will pick the order up.`,
      );
    }

    return (await this.ordersRepository.findById(order.id)) as OrderWithLines;
  }

  private async takeLine(
    lineId: number,
    sellerUuid: string,
    listing: ListingWithContents,
  ): Promise<TakenLine> {
    // Intent first: if the process dies inside the plugin call below, this marker
    // is the only evidence that a take may have happened.
    const claimed = await this.ordersRepository.setLineDeliveryIf(
      lineId,
      DELIVERY.PENDING,
      DELIVERY.TAKING,
    );
    if (!claimed) {
      throw new BadRequestException(
        `Line #${lineId} is no longer takeable — another attempt owns it`,
      );
    }

    try {
      if (isItemsKind(listing.kind)) {
        const { taken } = await this.wingull.takeItems(
          sellerUuid,
          listing.items.map((i) => ({ id: i.itemId, amount: i.qty })),
        );
        await this.ordersRepository.setLineDeliveryIf(
          lineId,
          DELIVERY.TAKING,
          DELIVERY.TAKEN,
          { takenPayload: { taken } as unknown },
        );
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
      await this.ordersRepository.setLineDeliveryIf(
        lineId,
        DELIVERY.TAKING,
        DELIVERY.TAKEN,
        { takenPayload: { specs } as unknown },
      );
      return { lineId, sellerUuid, kind: listing.kind, pokespec };
    } catch (error) {
      // The call came back and said no, so nothing left the seller's PC. Roll the
      // intent marker back so this line is cleanly retryable.
      //
      // A multi-mon bundle is the exception and is NOT rolled back: earlier mons in
      // the loop may already be out of the PC with no payload recorded for them, so
      // it goes to review rather than pretending the line is untouched.
      const partial = !isItemsKind(listing.kind) && listing.mons.length > 1;
      await this.ordersRepository.setLineDeliveryIf(
        lineId,
        DELIVERY.TAKING,
        partial ? DELIVERY.REVIEW : DELIVERY.PENDING,
      );
      if (partial) {
        this.logger.error(
          `Wigglypop line #${lineId}: a bundle take failed part-way through. Some Pokémon may ` +
            `already have left ${sellerUuid}'s PC with no payload recorded — sent to review.`,
        );
      }
      throw error;
    }
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
   * Rebuilds the take payload a line recorded, so a resumed saga gives the buyer
   * what actually left the seller's PC rather than what the listing said it would.
   */
  takenFromLine(line: WigglypopOrderLine): TakenLine | null {
    const payload = line.takenPayload as {
      taken?: Array<{ id: string; amount: number }>;
      specs?: string[];
    } | null;
    if (!payload) return null;
    if (isItemsKind(line.kind)) {
      return payload.taken
        ? {
            lineId: line.id,
            sellerUuid: line.sellerUuid,
            kind: line.kind,
            items: payload.taken,
          }
        : null;
    }
    return payload.specs?.length
      ? {
          lineId: line.id,
          sellerUuid: line.sellerUuid,
          kind: line.kind,
          pokespec: payload.specs.join('\n'),
        }
      : null;
  }

  /**
   * Give one taken line to the buyer. Claims the line first, so a dispatcher and
   * a retry cannot both hand the same Pokémon over.
   *
   * Returns false when another attempt owns the line — a normal outcome, not an
   * error. Throws only when the give itself failed, having first rolled the marker
   * back to `tomado` so the outbox can retry it safely.
   */
  async deliverLine(
    buyerUuid: string,
    line: WigglypopOrderLine,
    t: TakenLine,
  ): Promise<boolean> {
    const claimed = await this.ordersRepository.setLineDeliveryIf(
      line.id,
      DELIVERY.TAKEN,
      DELIVERY.GIVING,
    );
    if (!claimed) return false;

    try {
      await this.giveLine(buyerUuid, t);
    } catch (error) {
      // The give came back as a failure, so the buyer received nothing. Back to
      // `tomado`, which is retryable. This is the ONLY path that makes a give
      // retryable: an INTERRUPTED give stays in `entregando` and is escalated by
      // the sweeper instead of being tried again.
      await this.ordersRepository.setLineDeliveryIf(
        line.id,
        DELIVERY.GIVING,
        DELIVERY.TAKEN,
      );
      throw error;
    }

    await this.ordersRepository.setLineDeliveryIf(
      line.id,
      DELIVERY.GIVING,
      DELIVERY.GIVEN,
    );
    return true;
  }

  /**
   * Closes off the lines a failed sale never got to.
   *
   * Conditional on `pendiente` and not a blanket write, because a blanket one
   * would also flip any line already sent to `revision` — quietly erasing the
   * single flag telling a human that goods are unaccounted for.
   */
  private async cancelUntouchedLines(order: OrderWithLines): Promise<void> {
    for (const line of order.lines) {
      await this.ordersRepository.setLineDeliveryIf(
        line.id,
        DELIVERY.PENDING,
        DELIVERY.CANCELLED,
      );
    }
  }

  /**
   * Hands taken goods back to the sellers they came from. Best-effort per line: one seller's
   * restore failing must not abandon the rest, so each is escalated and the loop continues.
   */
  private async restore(taken: TakenLine[]): Promise<void> {
    for (const t of taken) {
      await this.restoreLine(t);
    }
  }

  /**
   * One seller's goods, handed back. A restore that FAILS goes to review rather
   * than being logged and forgotten: the goods are out of the seller's PC and the
   * market is holding them, which is exactly the state nobody notices until the
   * seller complains.
   */
  async restoreLine(t: TakenLine): Promise<void> {
    const claimed = await this.ordersRepository.setLineDeliveryIf(
      t.lineId,
      [DELIVERY.TAKEN, DELIVERY.GIVEN],
      DELIVERY.RESTORING,
    );
    if (!claimed) return;

    try {
      await this.giveLine(t.sellerUuid, t);
      await this.ordersRepository.setLineDeliveryIf(
        t.lineId,
        DELIVERY.RESTORING,
        DELIVERY.CANCELLED,
      );
    } catch (error: any) {
      await this.ordersRepository.setLineDeliveryIf(
        t.lineId,
        DELIVERY.RESTORING,
        DELIVERY.REVIEW,
      );
      this.logger.error(
        `Wigglypop rollback FAILED for line #${t.lineId}: could not return the goods to ` +
          `seller ${t.sellerUuid} (${error?.message}). Sent to review. Payload: ${JSON.stringify(t)}`,
      );
    }
  }

  // ─── Shared ─────────────────────────────────────────────────────────────────

  /**
   * Escrow → seller for one taken line, on the atomic path.
   *
   * Split from `payOutLine` because the guard is different. The manual path can
   * lean on `settleTxId` alone: nothing else is in flight, so "already has a tx
   * id" fully answers "already paid". Here a crash between `escrow.release` and
   * the row write would leave a paid seller with no tx id recorded, and a naive
   * retry would pay them a second time — so the intent marker goes down FIRST and
   * an interrupted payout is escalated by the sweeper rather than retried.
   *
   * Returns false when another attempt owns the line.
   */
  async payOutTakenLine(
    order: OrderWithLines,
    line: WigglypopOrderLine,
  ): Promise<boolean> {
    if (line.settleTxId) return false; // already paid out

    const claimed = await this.ordersRepository.setLineDeliveryIf(
      line.id,
      DELIVERY.GIVEN,
      DELIVERY.PAYING,
    );
    if (!claimed) return false;

    let txId: number;
    try {
      txId = await this.escrow.release(
        line.sellerUuid,
        line.lineTotal,
        `Wigglypop ${order.code} — venta`,
      );
    } catch (error) {
      // The release refused, so no money moved. Back to `entregado`, retryable.
      await this.ordersRepository.setLineDeliveryIf(
        line.id,
        DELIVERY.PAYING,
        DELIVERY.GIVEN,
      );
      throw error;
    }

    await this.ordersRepository.setLineDeliveryIf(
      line.id,
      DELIVERY.PAYING,
      DELIVERY.CONFIRMED,
      { settleTxId: txId, confirmedAt: new Date() },
    );
    return true;
  }

  /**
   * Park a line where only a human can move it, and say why on the way.
   *
   * Reaching this is not a bug in itself — it is the saga refusing to guess about
   * goods or money it cannot account for. What matters is that it is loud and
   * that the payload survives, because the recovery is manual and someone has to
   * be able to see what left whose PC.
   */
  async escalate(
    line: WigglypopOrderLine,
    reason: string,
    detail?: string,
  ): Promise<void> {
    const moved = await this.ordersRepository.setLineDeliveryIf(
      line.id,
      line.deliveryStatus,
      DELIVERY.REVIEW,
    );
    if (!moved) return;
    this.logger.error(
      `Wigglypop line #${line.id} (order ${line.orderId}, seller ${line.sellerUuid}) needs manual ` +
        `review — ${reason}. It was interrupted in '${line.deliveryStatus}'. ` +
        `takenPayload: ${JSON.stringify(line.takenPayload ?? null)}` +
        (detail ? ` — ${detail}` : ''),
    );
  }

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

  /**
   * Re-reads an atomic order and settles it into whatever terminal state its
   * lines now justify.
   *
   * `revision` wins over `completado` even when every other line is paid: an
   * order that needed a human on one line is not a finished order, and marking it
   * complete would hide the one thing somebody has to act on. Listings are only
   * marked sold when the whole order landed — a half-delivered order leaves them
   * reserved, because releasing them would let a second buyer purchase goods that
   * are already out of the seller's PC.
   */
  async finalizeAtomicOrder(orderId: number): Promise<OrderWithLines> {
    const settled = (await this.ordersRepository.findById(
      orderId,
    )) as OrderWithLines;

    const needsReview = settled.lines.some(
      (l) => l.deliveryStatus === DELIVERY.REVIEW,
    );
    const allDone = settled.lines.every(
      (l) => l.deliveryStatus === DELIVERY.CONFIRMED,
    );
    const allCancelled = settled.lines.every(
      (l) => l.deliveryStatus === DELIVERY.CANCELLED,
    );

    const status = needsReview
      ? 'revision'
      : allDone
        ? 'completado'
        : allCancelled
          ? 'cancelado'
          : 'transferido';

    await this.ordersRepository.setStatus(orderId, status);
    if (allDone) await this.markListingsSold(settled);
    if (allCancelled) await this.releaseListings(settled);

    return (await this.ordersRepository.findById(orderId)) as OrderWithLines;
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
