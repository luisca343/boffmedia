import { Injectable } from '@nestjs/common';
import {
  ActorContext,
  actingUuid,
  assertActsAsSelf,
} from '@api/_utils/auth/actor';
import { WigglypopListingsService } from './services/wigglypop-listings.service';
import { WigglypopOrdersService } from './services/wigglypop-orders.service';
import { WigglypopTradingService } from './services/wigglypop-trading.service';
import { WigglypopCustodyService } from './services/wigglypop-custody.service';
import {
  CreateBidDto,
  CreateListingDto,
  CreateOfferDto,
  CreateOrderDto,
  CreateReviewDto,
  CreateTradeDto,
  ListListingsQueryDto,
  UpdateListingDto,
  ValuateDto,
  WatchlistDto,
} from './dto/wigglypop.dto';
import {
  WigglypopBidEntity,
  WigglypopItemCatalogEntity,
  WigglypopListingEntity,
  WigglypopListingListEntity,
  WigglypopOfferEntity,
  WigglypopOrderEntity,
  WigglypopReviewEntity,
  WigglypopSellerEntity,
  WigglypopTradeOfferEntity,
  WigglypopValuationEntity,
  WigglypopWatchlistEntity,
} from './entities/wigglypop.entity';

// The controller's single collaborator. Mirrors WingullFacadeService: the HTTP layer talks to
// one thing, and the four domain services below it stay free to call each other without the
// routes knowing which one owns what.
@Injectable()
export class WigglypopFacadeService {
  constructor(
    private readonly listings: WigglypopListingsService,
    private readonly orders: WigglypopOrdersService,
    private readonly trading: WigglypopTradingService,
    private readonly custody: WigglypopCustodyService,
  ) {}

  // ─── Listings ───────────────────────────────────────────────────────────────

  listListings(
    query: ListListingsQueryDto,
  ): Promise<WigglypopListingListEntity> {
    return this.listings.list(query);
  }

  getListing(id: number): Promise<WigglypopListingEntity> {
    return this.listings.get(id);
  }

  createListing(
    dto: CreateListingDto,
    actor?: ActorContext,
  ): Promise<WigglypopListingEntity> {
    assertActsAsSelf(dto.sellerUuid, actor);
    return this.listings.create(dto);
  }

  updateListing(
    id: number,
    dto: UpdateListingDto,
    actor?: ActorContext,
  ): Promise<WigglypopListingEntity> {
    return this.listings.update(id, {
      ...dto,
      actorUuid: actingUuid(dto.actorUuid, actor),
    });
  }

  deleteListing(
    id: number,
    actorUuid?: string,
    actor?: ActorContext,
  ): Promise<{ success: boolean }> {
    return this.listings.remove(id, actingUuid(actorUuid, actor));
  }

  // ─── Market data ────────────────────────────────────────────────────────────

  listItemCatalog(): Promise<WigglypopItemCatalogEntity[]> {
    return this.listings.listCatalog();
  }

  priceHistory(dex: number): Promise<number[]> {
    return this.listings.priceHistory(dex);
  }

  valuate(dto: ValuateDto): Promise<WigglypopValuationEntity> {
    return this.listings.valuate(dto);
  }

  getSeller(uuid: string): Promise<WigglypopSellerEntity> {
    return this.listings.getSeller(uuid);
  }

  // ─── Watchlist ──────────────────────────────────────────────────────────────

  getWatchlist(uuid: string): Promise<WigglypopWatchlistEntity> {
    return this.listings.getWatchlist(uuid);
  }

  setWatching(
    dto: WatchlistDto,
    actor?: ActorContext,
  ): Promise<{ watching: boolean }> {
    assertActsAsSelf(dto.userUuid, actor);
    return this.listings.setWatching(dto.userUuid, dto.listingId, dto.watching);
  }

  // ─── Orders ─────────────────────────────────────────────────────────────────

  createOrder(
    dto: CreateOrderDto,
    actor?: ActorContext,
  ): Promise<WigglypopOrderEntity> {
    assertActsAsSelf(dto.buyerUuid, actor);
    return this.orders.create(dto);
  }

  getUserOrders(uuid: string): Promise<WigglypopOrderEntity[]> {
    return this.orders.findByUser(uuid);
  }

  markTransferred(
    id: number,
    actorUuid?: string,
    actor?: ActorContext,
  ): Promise<WigglypopOrderEntity> {
    return this.orders.markTransferred(id, actingUuid(actorUuid, actor));
  }

  confirmOrder(
    id: number,
    actorUuid?: string,
    actor?: ActorContext,
  ): Promise<WigglypopOrderEntity> {
    return this.orders.confirm(id, actingUuid(actorUuid, actor));
  }

  cancelOrder(
    id: number,
    actorUuid?: string,
    actor?: ActorContext,
  ): Promise<WigglypopOrderEntity> {
    return this.orders.cancel(id, actingUuid(actorUuid, actor));
  }

  createReview(
    dto: CreateReviewDto,
    actor?: ActorContext,
  ): Promise<WigglypopReviewEntity> {
    assertActsAsSelf(dto.reviewerUuid, actor);
    return this.orders.createReview(dto);
  }

  // ─── Bids / offers / trades ─────────────────────────────────────────────────

  listBids(listingId: number): Promise<WigglypopBidEntity[]> {
    return this.trading.listBids(listingId);
  }

  createBid(
    dto: CreateBidDto,
    actor?: ActorContext,
  ): Promise<WigglypopBidEntity> {
    assertActsAsSelf(dto.bidderUuid, actor);
    return this.trading.placeBid(dto);
  }

  createOffer(
    dto: CreateOfferDto,
    actor?: ActorContext,
  ): Promise<WigglypopOfferEntity> {
    assertActsAsSelf(dto.buyerUuid, actor);
    return this.trading.createOffer(dto);
  }

  getSellerOffers(uuid: string): Promise<WigglypopOfferEntity[]> {
    return this.trading.listOffersForSeller(uuid);
  }

  acceptOffer(
    id: number,
    actorUuid?: string,
    actor?: ActorContext,
  ): Promise<WigglypopOrderEntity> {
    return this.trading.acceptOffer(id, actingUuid(actorUuid, actor));
  }

  rejectOffer(
    id: number,
    actorUuid?: string,
    actor?: ActorContext,
  ): Promise<WigglypopOfferEntity> {
    return this.trading.rejectOffer(id, actingUuid(actorUuid, actor));
  }

  createTrade(
    dto: CreateTradeDto,
    actor?: ActorContext,
  ): Promise<WigglypopTradeOfferEntity> {
    assertActsAsSelf(dto.proposerUuid, actor);
    return this.trading.createTrade(dto);
  }

  getSellerTrades(uuid: string): Promise<WigglypopTradeOfferEntity[]> {
    return this.trading.listTradesForSeller(uuid);
  }

  acceptTrade(
    id: number,
    actorUuid?: string,
    actor?: ActorContext,
  ): Promise<WigglypopTradeOfferEntity> {
    return this.trading.acceptTrade(id, actingUuid(actorUuid, actor));
  }

  rejectTrade(
    id: number,
    actorUuid?: string,
    actor?: ActorContext,
  ): Promise<WigglypopTradeOfferEntity> {
    return this.trading.rejectTrade(id, actingUuid(actorUuid, actor));
  }

  /** Which custody path is live. The UI copy differs completely between the two. */
  isAtomicCustody(): boolean {
    return this.custody.isAtomic();
  }
}
