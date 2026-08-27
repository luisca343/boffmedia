import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import {
  NewOrderLine,
  OrderWithLines,
  WigglypopOrdersRepository,
} from '../repositories/wigglypop-orders.repository';
import {
  ListingWithContents,
  WigglypopListingsRepository,
} from '../repositories/wigglypop-listings.repository';
import { WigglypopTradingRepository } from '../repositories/wigglypop-trading.repository';
import {
  WigglypopCustodyService,
  computeFee,
} from './wigglypop-custody.service';
import { WigglypopNotifyService } from './wigglypop-notify.service';
import { OutboxRepository } from '@api/outbox/repositories/outbox.repository';
import { generateWpCode } from '../_shared/code.util';
import { CreateOrderDto, isItemsKind } from '../dto/wigglypop.dto';
import {
  WigglypopOrderEntity,
  WigglypopReviewEntity,
} from '../entities/wigglypop.entity';
import { WigglypopListingsService } from './wigglypop-listings.service';

@Injectable()
export class WigglypopOrdersService {
  constructor(
    private readonly logger: Logger,
    private readonly ordersRepository: WigglypopOrdersRepository,
    private readonly listingsRepository: WigglypopListingsRepository,
    private readonly tradingRepository: WigglypopTradingRepository,
    private readonly listingsService: WigglypopListingsService,
    private readonly custody: WigglypopCustodyService,
    private readonly notify: WigglypopNotifyService,
    private readonly outbox: OutboxRepository,
  ) {}

  // ─── Entity mapping ─────────────────────────────────────────────────────────

  private async toEntity(order: OrderWithLines): Promise<WigglypopOrderEntity> {
    const listings = await this.listingsRepository.findManyByIds(
      order.lines.map((l) => l.listingId),
    );
    const entities = await this.listingsService.toEntities(listings);
    const entityById = new Map(entities.map((e) => [e.id, e]));

    const names = new Map<string, string | null>();
    for (const uuid of new Set([
      order.buyerUuid,
      ...order.lines.map((l) => l.sellerUuid),
    ])) {
      names.set(uuid, await this.listingsRepository.findSellerUsername(uuid));
    }

    return {
      id: order.id,
      code: order.code,
      buyer: {
        uuid: order.buyerUuid,
        username: names.get(order.buyerUuid) ?? null,
      },
      subtotal: order.subtotal,
      fee: order.fee,
      total: order.total,
      status: order.status,
      escrowTxId: order.escrowTxId,
      lines: order.lines.map((l) => ({
        id: l.id,
        listingId: l.listingId,
        seller: {
          uuid: l.sellerUuid,
          username: names.get(l.sellerUuid) ?? null,
        },
        kind: l.kind,
        qty: l.qty,
        unitPrice: l.unitPrice,
        lineTotal: l.lineTotal,
        deliveryStatus: l.deliveryStatus,
        settleTxId: l.settleTxId,
        confirmedAt: l.confirmedAt,
        listing: entityById.get(l.listingId) ?? undefined,
      })),
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }

  // ─── The buy ────────────────────────────────────────────────────────────────

  /**
   * THE BUY. Validates every line against the live listing, prices it, reserves the listings,
   * writes the order, and hands it to the custody service to settle — which is the only place
   * money or Pokémon ever move.
   *
   * `closingAuction` is an INTERNAL escape hatch, reachable only from WigglypopAuctionService.
   * A public POST /orders can never set it, because it is not on CreateOrderDto — an auction is
   * otherwise unbuyable at its asking price, which is what stops a bidder from simply paying the
   * starting bid and skipping the auction entirely.
   *
   * If an idempotency key is provided, the order is idempotent: a retry with the same key
   * returns the original order without creating a duplicate.
   */
  async create(
    dto: CreateOrderDto,
    opts: { closingAuction?: boolean; idempotencyKey?: string } = {},
  ): Promise<WigglypopOrderEntity> {
    const listingIds = dto.lines.map((l) => l.listingId);
    if (new Set(listingIds).size !== listingIds.length) {
      throw new BadRequestException(
        'The same listing appears twice in this order',
      );
    }

    const listings = await this.listingsRepository.findManyByIds(listingIds);
    const byId = new Map(listings.map((l) => [l.id, l]));

    const lines: NewOrderLine[] = [];
    for (const input of dto.lines) {
      const listing = byId.get(input.listingId);
      if (!listing) {
        throw new NotFoundException(`Listing ${input.listingId} not found`);
      }
      lines.push(
        this.priceLine(
          listing,
          dto.buyerUuid,
          input.qty ?? 1,
          opts.closingAuction ?? false,
        ),
      );
    }

    const subtotal = lines.reduce((acc, l) => acc + l.lineTotal, 0);
    const fee = computeFee(subtotal);

    const order = await this.ordersRepository.create(
      {
        code: generateWpCode('ORD'),
        buyerUuid: dto.buyerUuid,
        subtotal,
        fee,
        total: subtotal + fee,
        status: 'escrow',
        idempotencyKey: opts.idempotencyKey,
      },
      lines,
      // Off the shelf while the order is in flight, in the SAME transaction as
      // the order itself. If custody cancels the order it puts them back; if it
      // completes, they go to `vendido`.
      lines.map((l) => l.listingId),
    );

    // Settlement stays SYNCHRONOUS and deliberately so.
    //
    // `settleNewOrder` is what actually charges the buyer into escrow. Moving it
    // to the outbox made `create` return an order with no `escrowTxId` and skip
    // `notifySale`, so the buyer walked away with a confirmed order they had not
    // paid for and money moved up to a dispatcher tick later — or never, if the
    // enqueue itself failed after the order had committed.
    //
    // The outbox earns its keep on the genuinely remote, retryable half: the
    // game-server take/give calls behind WIGGLYPOP_ATOMIC_CUSTODY (currently
    // off). Its `wigglypop:settle-order` handler stays registered for that, and
    // must not be wired here without also making the buyer's charge part of it.
    const settled = await this.custody.settleNewOrder(order);
    await this.notifySale(settled, byId);

    return this.toEntity(settled);
  }

  /**
   * Turns a listing into a priced order line, refusing everything that must not be bought this
   * way. An auction is NOT purchasable at its asking price — that would sidestep the bidding —
   * unless the seller set an explicit buy-now.
   *
   * The status check here is a cheap fast-fail; the REAL guard against overselling is in
   * the ordersRepository.create() transaction, which atomically claims each listing with a
   * conditional UPDATE `WHERE status = 'activo'`. Never delete this check to "avoid duplication" —
   * it catches races early.
   */
  private priceLine(
    listing: ListingWithContents,
    buyerUuid: string,
    qty: number,
    closingAuction: boolean,
  ): NewOrderLine {
    if (listing.sellerUuid === buyerUuid) {
      throw new BadRequestException('You cannot buy your own listing');
    }
    if (listing.status !== 'activo') {
      throw new BadRequestException(
        `"${listing.title}" is no longer available (${listing.status})`,
      );
    }
    if (listing.format === 'trade') {
      throw new BadRequestException(
        `"${listing.title}" is a trade listing — propose a trade instead of buying it`,
      );
    }

    let unitPrice = listing.price;
    if (listing.format === 'auction' && !closingAuction) {
      // Buying an auction outright is only possible when the seller offered a buy-now price.
      if (!listing.buyNow) {
        throw new BadRequestException(
          `"${listing.title}" is an auction — place a bid instead of buying it`,
        );
      }
      unitPrice = listing.buyNow;
    }
    // When the closer is settling a won auction, `price` has already been set to the winning
    // bid, so `unitPrice` is exactly what the winner promised to pay.

    // Only an item listing has a meaningful quantity. A Pokémon is one specific individual;
    // buying "2" of it is meaningless and would double-charge for a single mon.
    const isItems = isItemsKind(listing.kind);
    const lineQty = isItems ? qty : 1;
    if (!isItems && qty > 1) {
      throw new BadRequestException(
        'A Pokémon listing is a single individual — quantity must be 1',
      );
    }

    return {
      listingId: listing.id,
      sellerUuid: listing.sellerUuid,
      kind: listing.kind,
      qty: lineQty,
      unitPrice,
      lineTotal: unitPrice * lineQty,
    };
  }

  private async notifySale(
    order: OrderWithLines,
    byId: Map<number, ListingWithContents>,
  ): Promise<void> {
    for (const line of order.lines) {
      const listing = byId.get(line.listingId);
      await this.notify.sale(
        line.sellerUuid,
        order.id,
        listing?.title ?? `Listing #${line.listingId}`,
        line.lineTotal,
      );
    }
  }

  // ─── Lifecycle ──────────────────────────────────────────────────────────────

  async findByUser(uuid: string): Promise<WigglypopOrderEntity[]> {
    // A player's orders are the ones they BOUGHT plus the ones they SOLD into — the app shows
    // both sides on one screen.
    const [bought, sold] = await Promise.all([
      this.ordersRepository.findByBuyer(uuid),
      this.ordersRepository.findBySeller(uuid),
    ]);
    const merged = new Map<number, OrderWithLines>();
    for (const o of [...bought, ...sold]) merged.set(o.id, o);

    return Promise.all(
      Array.from(merged.values())
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .map((o) => this.toEntity(o)),
    );
  }

  private async load(id: number): Promise<OrderWithLines> {
    const order = await this.ordersRepository.findById(id);
    if (!order) throw new NotFoundException(`Order ${id} not found`);
    return order;
  }

  /** The seller marks the in-game hand-off done. Money does not move. */
  async markTransferred(
    id: number,
    actorUuid?: string,
  ): Promise<WigglypopOrderEntity> {
    const order = await this.load(id);

    if (actorUuid && !order.lines.some((l) => l.sellerUuid === actorUuid)) {
      throw new ForbiddenException(
        'Only a seller on this order can mark it transferred',
      );
    }

    await this.custody.markTransferred(order);
    await this.notify.orderTransferred(order.buyerUuid, order.id, order.code);
    return this.toEntity(await this.load(id));
  }

  /** The buyer confirms receipt. THIS is what pays the sellers. */
  async confirm(id: number, actorUuid?: string): Promise<WigglypopOrderEntity> {
    const order = await this.load(id);

    if (actorUuid && actorUuid !== order.buyerUuid) {
      throw new ForbiddenException('Only the buyer can confirm this order');
    }

    await this.custody.confirmOrder(order);

    const settled = await this.load(id);
    for (const line of settled.lines) {
      await this.notify.orderConfirmed(
        line.sellerUuid,
        order.id,
        order.code,
        line.lineTotal,
      );
    }
    return this.toEntity(settled);
  }

  /** Refund the escrow back to the buyer and put the listings back on the shelf. */
  async cancel(id: number, actorUuid?: string): Promise<WigglypopOrderEntity> {
    const order = await this.load(id);

    // Either side can walk away while the goods are still in limbo.
    const isParty =
      actorUuid === order.buyerUuid ||
      order.lines.some((l) => l.sellerUuid === actorUuid);
    if (actorUuid && !isParty) {
      throw new ForbiddenException(
        'Only the buyer or a seller on this order can cancel it',
      );
    }

    await this.custody.cancelOrder(order);
    await this.notify.orderCancelled(
      order.buyerUuid,
      order.id,
      order.code,
      order.total,
    );
    return this.toEntity(await this.load(id));
  }

  // ─── Reviews ────────────────────────────────────────────────────────────────

  /**
   * Only a real buyer of a real, completed order may review, and only once. The seller is taken
   * from the order line, never from the request — otherwise anyone could review anyone.
   */
  async createReview(dto: {
    orderId: number;
    reviewerUuid: string;
    rating: number;
    body?: string;
  }): Promise<WigglypopReviewEntity> {
    const order = await this.load(dto.orderId);

    if (order.buyerUuid !== dto.reviewerUuid) {
      throw new ForbiddenException(
        'Only the buyer of this order can review it',
      );
    }
    if (order.status !== 'completado') {
      throw new BadRequestException(
        'You can only review an order once it is completed',
      );
    }

    const existing = await this.tradingRepository.findExistingReview(
      dto.orderId,
      dto.reviewerUuid,
    );
    if (existing) {
      throw new BadRequestException('You have already reviewed this order');
    }

    const sellerUuid = order.lines[0]?.sellerUuid;
    if (!sellerUuid) {
      throw new BadRequestException('This order has no seller to review');
    }

    const review = await this.tradingRepository.createReview({
      orderId: dto.orderId,
      reviewerUuid: dto.reviewerUuid,
      sellerUuid,
      rating: dto.rating,
      body: dto.body ?? null,
    });

    const username = await this.listingsRepository.findSellerUsername(
      dto.reviewerUuid,
    );
    return {
      id: review.id,
      orderId: review.orderId,
      reviewer: { uuid: review.reviewerUuid, username },
      rating: review.rating,
      body: review.body,
      createdAt: review.createdAt,
    };
  }
}
