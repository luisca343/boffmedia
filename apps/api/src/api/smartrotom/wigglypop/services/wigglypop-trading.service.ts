import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { WigglypopTradingRepository } from '../repositories/wigglypop-trading.repository';
import {
  ListingWithContents,
  WigglypopListingsRepository,
} from '../repositories/wigglypop-listings.repository';
import { WigglypopListingsService } from './wigglypop-listings.service';
import { WigglypopOrdersService } from './wigglypop-orders.service';
import { WigglypopNotifyService } from './wigglypop-notify.service';
import {
  CreateBidDto,
  CreateOfferDto,
  CreateTradeDto,
} from '../dto/wigglypop.dto';
import {
  WigglypopBidEntity,
  WigglypopOfferEntity,
  WigglypopOrderEntity,
  WigglypopTradeOfferEntity,
} from '../entities/wigglypop.entity';

@Injectable()
export class WigglypopTradingService {
  constructor(
    private readonly logger: Logger,
    private readonly tradingRepository: WigglypopTradingRepository,
    private readonly listingsRepository: WigglypopListingsRepository,
    private readonly listingsService: WigglypopListingsService,
    private readonly ordersService: WigglypopOrdersService,
    private readonly notify: WigglypopNotifyService,
  ) {}

  private async loadListing(id: number): Promise<ListingWithContents> {
    const listing = await this.listingsRepository.findById(id);
    if (!listing) throw new NotFoundException(`Listing ${id} not found`);
    return listing;
  }

  private async name(uuid: string): Promise<string | null> {
    return this.listingsRepository.findSellerUsername(uuid);
  }

  // ─── Bids ───────────────────────────────────────────────────────────────────

  /**
   * Places a bid on a live auction. No money moves here — a bid is a promise, and it is the
   * auction closer that turns the winning one into a real, escrowed order. (Which means a
   * bidder can in principle win an auction they can no longer afford; the closer treats that
   * as a failed sale rather than letting the account go negative.)
   */
  async placeBid(dto: CreateBidDto): Promise<WigglypopBidEntity> {
    const listing = await this.loadListing(dto.listingId);

    if (listing.format !== 'auction') {
      throw new BadRequestException(`"${listing.title}" is not an auction`);
    }
    if (listing.status !== 'activo') {
      throw new BadRequestException(
        `"${listing.title}" is no longer accepting bids (${listing.status})`,
      );
    }
    if (listing.sellerUuid === dto.bidderUuid) {
      throw new BadRequestException('You cannot bid on your own auction');
    }
    if (listing.endsAt && listing.endsAt.getTime() <= Date.now()) {
      throw new BadRequestException('This auction has already ended');
    }

    // The first bid must at least meet the asking price (which the auction seeded currentBid
    // with); every later one must clear the current bid by the seller's minimum increment.
    const floor =
      listing.bids === 0
        ? listing.currentBid
        : listing.currentBid + listing.minIncrement;
    if (dto.amount < floor) {
      throw new BadRequestException(
        `Your bid must be at least ${floor} (current ${listing.currentBid}, minimum increment ${listing.minIncrement})`,
      );
    }

    // Everyone already bidding is about to be outbid — captured BEFORE this bid lands, so the
    // new bidder is not told they outbid themselves.
    const outbid = await this.tradingRepository.findOtherBidders(
      dto.listingId,
      dto.bidderUuid,
    );

    const bid = await this.tradingRepository.createBid(
      dto.listingId,
      dto.bidderUuid,
      dto.amount,
    );
    await this.listingsRepository.bumpBid(dto.listingId, dto.amount);

    for (const uuid of outbid) {
      await this.notify.outbid(uuid, listing.id, listing.title, dto.amount);
    }

    return {
      id: bid.id,
      listingId: bid.listingId,
      bidder: {
        uuid: bid.bidderUuid,
        username: await this.name(bid.bidderUuid),
      },
      amount: bid.amount,
      createdAt: bid.createdAt,
    };
  }

  async listBids(listingId: number): Promise<WigglypopBidEntity[]> {
    const bids = await this.tradingRepository.listBids(listingId);

    const names = new Map<string, string | null>();
    for (const uuid of new Set(bids.map((b) => b.bidderUuid))) {
      names.set(uuid, await this.name(uuid));
    }

    return bids.map((b) => ({
      id: b.id,
      listingId: b.listingId,
      bidder: { uuid: b.bidderUuid, username: names.get(b.bidderUuid) ?? null },
      amount: b.amount,
      createdAt: b.createdAt,
    }));
  }

  // ─── Offers ─────────────────────────────────────────────────────────────────

  async createOffer(dto: CreateOfferDto): Promise<WigglypopOfferEntity> {
    const listing = await this.loadListing(dto.listingId);

    if (listing.status !== 'activo') {
      throw new BadRequestException(
        `"${listing.title}" is no longer available (${listing.status})`,
      );
    }
    if (listing.sellerUuid === dto.buyerUuid) {
      throw new BadRequestException(
        'You cannot make an offer on your own listing',
      );
    }
    if (listing.format === 'auction') {
      throw new BadRequestException(
        'This is an auction — place a bid instead of an offer',
      );
    }

    const offer = await this.tradingRepository.createOffer({
      listingId: dto.listingId,
      buyerUuid: dto.buyerUuid,
      amount: dto.amount,
      qty: dto.qty ?? 1,
    });

    await this.notify.offerReceived(
      listing.sellerUuid,
      listing.id,
      listing.title,
      dto.amount,
    );

    return this.toOfferEntity(offer, listing);
  }

  async listOffersForSeller(uuid: string): Promise<WigglypopOfferEntity[]> {
    const offers = await this.tradingRepository.findOffersForSeller(uuid);
    const listings = await this.listingsRepository.findManyByIds(
      offers.map((o) => o.listingId),
    );
    const byId = new Map(listings.map((l) => [l.id, l]));

    return Promise.all(
      offers.map((o) => this.toOfferEntity(o, byId.get(o.listingId))),
    );
  }

  /**
   * Accepting an offer IS a purchase — it creates a real order at the offered price and runs it
   * through the same custody path as any other buy. There is no second settlement code path.
   */
  async acceptOffer(
    id: number,
    actorUuid?: string,
  ): Promise<WigglypopOrderEntity> {
    const offer = await this.tradingRepository.findOffer(id);
    if (!offer) throw new NotFoundException(`Offer ${id} not found`);

    const listing = await this.loadListing(offer.listingId);
    if (actorUuid && actorUuid !== listing.sellerUuid) {
      throw new ForbiddenException('Only the seller can accept this offer');
    }
    if (offer.status !== 'pendiente') {
      throw new BadRequestException(`This offer is already ${offer.status}`);
    }
    if (listing.status !== 'activo') {
      throw new BadRequestException(
        `"${listing.title}" is no longer available (${listing.status})`,
      );
    }

    // The offered price is what the buyer pays, so the listing is temporarily repriced to it
    // and the order is built from the listing exactly like any other buy. Doing it this way
    // means an accepted offer cannot drift away from what a normal purchase would charge.
    const originalPrice = listing.price;
    await this.listingsRepository.update(listing.id, { price: offer.amount });

    let order: WigglypopOrderEntity;
    try {
      order = await this.ordersService.create({
        buyerUuid: offer.buyerUuid,
        lines: [{ listingId: listing.id, qty: offer.qty }],
      } as any);
    } catch (error) {
      // The sale did not happen — put the asking price back rather than leaving the listing
      // silently repriced to a rejected offer.
      await this.listingsRepository.update(listing.id, {
        price: originalPrice,
      });
      throw error;
    }

    await this.tradingRepository.setOfferStatus(id, 'aceptada');
    await this.notify.offerAccepted(
      offer.buyerUuid,
      listing.id,
      listing.title,
      offer.amount,
    );

    // The listing is gone; every other offer on it is dead.
    const rejected = await this.tradingRepository.rejectOtherPendingOffers(
      listing.id,
      id,
    );
    for (const other of rejected) {
      await this.notify.offerRejected(
        other.buyerUuid,
        listing.id,
        listing.title,
      );
    }

    return order;
  }

  async rejectOffer(
    id: number,
    actorUuid?: string,
  ): Promise<WigglypopOfferEntity> {
    const offer = await this.tradingRepository.findOffer(id);
    if (!offer) throw new NotFoundException(`Offer ${id} not found`);

    const listing = await this.loadListing(offer.listingId);
    if (actorUuid && actorUuid !== listing.sellerUuid) {
      throw new ForbiddenException('Only the seller can reject this offer');
    }
    if (offer.status !== 'pendiente') {
      throw new BadRequestException(`This offer is already ${offer.status}`);
    }

    const updated = await this.tradingRepository.setOfferStatus(
      id,
      'rechazada',
    );
    await this.notify.offerRejected(offer.buyerUuid, listing.id, listing.title);
    return this.toOfferEntity(updated, listing);
  }

  private async toOfferEntity(
    offer: {
      id: number;
      listingId: number;
      buyerUuid: string;
      amount: number;
      qty: number;
      status: string;
      createdAt: Date;
      respondedAt: Date | null;
    },
    listing?: ListingWithContents,
  ): Promise<WigglypopOfferEntity> {
    return {
      id: offer.id,
      listingId: offer.listingId,
      buyer: {
        uuid: offer.buyerUuid,
        username: await this.name(offer.buyerUuid),
      },
      amount: offer.amount,
      qty: offer.qty,
      status: offer.status,
      createdAt: offer.createdAt,
      respondedAt: offer.respondedAt,
      listing: listing
        ? (await this.listingsService.toEntities([listing]))[0]
        : undefined,
    };
  }

  // ─── Trades ─────────────────────────────────────────────────────────────────

  /**
   * A trade proposal. The offered Pokémon is verified against the PROPOSER's live PC exactly
   * like a listed one — otherwise anyone could offer a mon they do not own.
   */
  async createTrade(dto: CreateTradeDto): Promise<WigglypopTradeOfferEntity> {
    const listing = await this.loadListing(dto.listingId);

    if (listing.format !== 'trade') {
      throw new BadRequestException(`"${listing.title}" is not open to trades`);
    }
    if (listing.status !== 'activo') {
      throw new BadRequestException(
        `"${listing.title}" is no longer available (${listing.status})`,
      );
    }
    if (listing.sellerUuid === dto.proposerUuid) {
      throw new BadRequestException('You cannot trade with yourself');
    }

    const verified = await this.listingsService.verifyMonInPc(
      dto.proposerUuid,
      dto.offered,
    );

    const trade = await this.tradingRepository.createTrade({
      listingId: dto.listingId,
      proposerUuid: dto.proposerUuid,
      offeredPokemonKey: dto.offered.pokemonKey,
      // The snapshot carries the live mon plus the slot it sat in, so the seller sees exactly
      // what they are being offered and a later custody take has a box/index to aim at.
      offeredSnapshot: {
        ...verified.raw,
        sourceBox: dto.offered.box,
        sourceIndex: dto.offered.index,
      },
    });

    await this.notify.tradeReceived(
      listing.sellerUuid,
      listing.id,
      listing.title,
    );

    return this.toTradeEntity(trade, listing);
  }

  async listTradesForSeller(
    uuid: string,
  ): Promise<WigglypopTradeOfferEntity[]> {
    const trades = await this.tradingRepository.findTradesForSeller(uuid);
    const listings = await this.listingsRepository.findManyByIds(
      trades.map((t) => t.listingId),
    );
    const byId = new Map(listings.map((l) => [l.id, l]));

    return Promise.all(
      trades.map((t) => this.toTradeEntity(t, byId.get(t.listingId))),
    );
  }

  /**
   * Accepting a trade marks it agreed and takes the listing off the shelf.
   *
   * DEFERRED, HONESTLY: a two-sided swap needs BOTH mons taken and BOTH given, so it cannot be
   * executed automatically until /takepokemon exists — and unlike a sale there is no money leg
   * to escrow in the meantime, so there is nothing partial to do. The two players swap in-game
   * themselves, exactly as they do today. Nothing here calls givePokemon: doing so with no
   * matching take would hand the seller's mon to the proposer while the seller kept it.
   *
   * Two concurrent acceptTrade calls on different trade offers on the SAME listing will race —
   * the atomic transaction ensures only one succeeds. The loser sees "no longer available".
   */
  async acceptTrade(
    id: number,
    actorUuid?: string,
  ): Promise<WigglypopTradeOfferEntity> {
    const trade = await this.tradingRepository.findTrade(id);
    if (!trade) throw new NotFoundException(`Trade offer ${id} not found`);

    const listing = await this.loadListing(trade.listingId);
    if (actorUuid && actorUuid !== listing.sellerUuid) {
      throw new ForbiddenException('Only the seller can accept this trade');
    }
    if (trade.status !== 'pendiente') {
      throw new BadRequestException(`This trade is already ${trade.status}`);
    }
    if (listing.status !== 'activo') {
      throw new BadRequestException(
        `"${listing.title}" is no longer available (${listing.status})`,
      );
    }

    // Atomic claim: accept the trade AND mark the listing sold in one transaction.
    // If the listing was already claimed by another concurrent trade acceptance, this throws.
    const updated = await this.tradingRepository.acceptTradeAtomic(
      id,
      listing.id,
    );
    await this.notify.tradeAccepted(
      trade.proposerUuid,
      listing.id,
      listing.title,
    );
    return this.toTradeEntity(updated, listing);
  }

  async rejectTrade(
    id: number,
    actorUuid?: string,
  ): Promise<WigglypopTradeOfferEntity> {
    const trade = await this.tradingRepository.findTrade(id);
    if (!trade) throw new NotFoundException(`Trade offer ${id} not found`);

    const listing = await this.loadListing(trade.listingId);
    if (actorUuid && actorUuid !== listing.sellerUuid) {
      throw new ForbiddenException('Only the seller can reject this trade');
    }
    if (trade.status !== 'pendiente') {
      throw new BadRequestException(`This trade is already ${trade.status}`);
    }

    const updated = await this.tradingRepository.setTradeStatus(
      id,
      'rechazada',
    );
    await this.notify.tradeRejected(
      trade.proposerUuid,
      listing.id,
      listing.title,
    );
    return this.toTradeEntity(updated, listing);
  }

  private async toTradeEntity(
    trade: {
      id: number;
      listingId: number;
      proposerUuid: string;
      offeredPokemonKey: string;
      offeredSnapshot: unknown;
      status: string;
      createdAt: Date;
      respondedAt: Date | null;
    },
    listing?: ListingWithContents,
  ): Promise<WigglypopTradeOfferEntity> {
    return {
      id: trade.id,
      listingId: trade.listingId,
      proposer: {
        uuid: trade.proposerUuid,
        username: await this.name(trade.proposerUuid),
      },
      offeredPokemonKey: trade.offeredPokemonKey,
      offeredSnapshot: trade.offeredSnapshot,
      status: trade.status,
      createdAt: trade.createdAt,
      respondedAt: trade.respondedAt,
      listing: listing
        ? (await this.listingsService.toEntities([listing]))[0]
        : undefined,
    };
  }
}
