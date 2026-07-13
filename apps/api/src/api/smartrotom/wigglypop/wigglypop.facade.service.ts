import { Injectable } from '@nestjs/common';
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

  listListings(query: ListListingsQueryDto): Promise<WigglypopListingListEntity> {
    return this.listings.list(query);
  }

  getListing(id: number): Promise<WigglypopListingEntity> {
    return this.listings.get(id);
  }

  createListing(dto: CreateListingDto): Promise<WigglypopListingEntity> {
    return this.listings.create(dto);
  }

  updateListing(
    id: number,
    dto: UpdateListingDto,
  ): Promise<WigglypopListingEntity> {
    return this.listings.update(id, dto);
  }

  deleteListing(id: number, actorUuid?: string): Promise<{ success: boolean }> {
    return this.listings.remove(id, actorUuid);
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

  setWatching(dto: WatchlistDto): Promise<{ watching: boolean }> {
    return this.listings.setWatching(dto.userUuid, dto.listingId, dto.watching);
  }

  // ─── Orders ─────────────────────────────────────────────────────────────────

  createOrder(dto: CreateOrderDto): Promise<WigglypopOrderEntity> {
    return this.orders.create(dto);
  }

  getUserOrders(uuid: string): Promise<WigglypopOrderEntity[]> {
    return this.orders.findByUser(uuid);
  }

  markTransferred(
    id: number,
    actorUuid?: string,
  ): Promise<WigglypopOrderEntity> {
    return this.orders.markTransferred(id, actorUuid);
  }

  confirmOrder(id: number, actorUuid?: string): Promise<WigglypopOrderEntity> {
    return this.orders.confirm(id, actorUuid);
  }

  cancelOrder(id: number, actorUuid?: string): Promise<WigglypopOrderEntity> {
    return this.orders.cancel(id, actorUuid);
  }

  createReview(dto: CreateReviewDto): Promise<WigglypopReviewEntity> {
    return this.orders.createReview(dto);
  }

  // ─── Bids / offers / trades ─────────────────────────────────────────────────

  listBids(listingId: number): Promise<WigglypopBidEntity[]> {
    return this.trading.listBids(listingId);
  }

  createBid(dto: CreateBidDto): Promise<WigglypopBidEntity> {
    return this.trading.placeBid(dto);
  }

  createOffer(dto: CreateOfferDto): Promise<WigglypopOfferEntity> {
    return this.trading.createOffer(dto);
  }

  getSellerOffers(uuid: string): Promise<WigglypopOfferEntity[]> {
    return this.trading.listOffersForSeller(uuid);
  }

  acceptOffer(id: number, actorUuid?: string): Promise<WigglypopOrderEntity> {
    return this.trading.acceptOffer(id, actorUuid);
  }

  rejectOffer(id: number, actorUuid?: string): Promise<WigglypopOfferEntity> {
    return this.trading.rejectOffer(id, actorUuid);
  }

  createTrade(dto: CreateTradeDto): Promise<WigglypopTradeOfferEntity> {
    return this.trading.createTrade(dto);
  }

  getSellerTrades(uuid: string): Promise<WigglypopTradeOfferEntity[]> {
    return this.trading.listTradesForSeller(uuid);
  }

  acceptTrade(
    id: number,
    actorUuid?: string,
  ): Promise<WigglypopTradeOfferEntity> {
    return this.trading.acceptTrade(id, actorUuid);
  }

  rejectTrade(
    id: number,
    actorUuid?: string,
  ): Promise<WigglypopTradeOfferEntity> {
    return this.trading.rejectTrade(id, actorUuid);
  }

  /** Which custody path is live. The UI copy differs completely between the two. */
  isAtomicCustody(): boolean {
    return this.custody.isAtomic();
  }
}
