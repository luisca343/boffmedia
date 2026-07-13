import { Inject, Injectable } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { and, desc, eq, inArray, ne, sql } from 'drizzle-orm';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import {
  wigglypopBids,
  wigglypopListings,
  wigglypopOffers,
  wigglypopReviews,
  wigglypopTradeOffers,
  wigglypopWatchlist,
  WigglypopBid,
  WigglypopOffer,
  WigglypopReview,
  WigglypopTradeOffer,
} from '@/_db/schema/SmartRotomWigglypop';

@Injectable()
export class WigglypopTradingRepository {
  constructor(
    @Inject(DRIZZLE) private readonly db: MySql2Database<Record<string, never>>,
  ) {}

  // ─── Bids ───────────────────────────────────────────────────────────────────

  async createBid(
    listingId: number,
    bidderUuid: string,
    amount: number,
  ): Promise<WigglypopBid> {
    const inserted = await this.db
      .insert(wigglypopBids)
      .values({ listingId, bidderUuid, amount });
    const rows = await this.db
      .select()
      .from(wigglypopBids)
      .where(eq(wigglypopBids.id, inserted[0].insertId));
    return rows[0];
  }

  async listBids(listingId: number): Promise<WigglypopBid[]> {
    return this.db
      .select()
      .from(wigglypopBids)
      .where(eq(wigglypopBids.listingId, listingId))
      .orderBy(desc(wigglypopBids.amount), desc(wigglypopBids.createdAt));
  }

  /** The winner: the single highest bid, oldest first on a tie. */
  async findTopBid(listingId: number): Promise<WigglypopBid | null> {
    const rows = await this.db
      .select()
      .from(wigglypopBids)
      .where(eq(wigglypopBids.listingId, listingId))
      .orderBy(desc(wigglypopBids.amount), wigglypopBids.createdAt)
      .limit(1);
    return rows[0] ?? null;
  }

  /** Everyone who bid and did NOT win — one row each, for the outbid/lost notifications. */
  async findLosingBidders(
    listingId: number,
    winnerUuid: string,
  ): Promise<string[]> {
    const rows = await this.db
      .selectDistinct({ bidderUuid: wigglypopBids.bidderUuid })
      .from(wigglypopBids)
      .where(
        and(
          eq(wigglypopBids.listingId, listingId),
          ne(wigglypopBids.bidderUuid, winnerUuid),
        ),
      );
    return rows.map((r) => r.bidderUuid);
  }

  /** Everyone bidding on a listing other than the player who just bid — the outbid crowd. */
  async findOtherBidders(
    listingId: number,
    exceptUuid: string,
  ): Promise<string[]> {
    return this.findLosingBidders(listingId, exceptUuid);
  }

  // ─── Offers ─────────────────────────────────────────────────────────────────

  async createOffer(data: {
    listingId: number;
    buyerUuid: string;
    amount: number;
    qty: number;
  }): Promise<WigglypopOffer> {
    const inserted = await this.db.insert(wigglypopOffers).values(data);
    return (await this.findOffer(inserted[0].insertId)) as WigglypopOffer;
  }

  async findOffer(id: number): Promise<WigglypopOffer | null> {
    const rows = await this.db
      .select()
      .from(wigglypopOffers)
      .where(eq(wigglypopOffers.id, id));
    return rows[0] ?? null;
  }

  /** Offers waiting on a given SELLER — joined through the listing, which owns the seller. */
  async findOffersForSeller(sellerUuid: string): Promise<WigglypopOffer[]> {
    const rows = await this.db
      .select({ offer: wigglypopOffers })
      .from(wigglypopOffers)
      .innerJoin(
        wigglypopListings,
        eq(wigglypopOffers.listingId, wigglypopListings.id),
      )
      .where(eq(wigglypopListings.sellerUuid, sellerUuid))
      .orderBy(desc(wigglypopOffers.createdAt));
    return rows.map((r) => r.offer);
  }

  async setOfferStatus(id: number, status: string): Promise<WigglypopOffer> {
    await this.db
      .update(wigglypopOffers)
      .set({ status, respondedAt: new Date() })
      .where(eq(wigglypopOffers.id, id));
    return (await this.findOffer(id)) as WigglypopOffer;
  }

  /** When a listing sells, every other pending offer on it is dead. */
  async rejectOtherPendingOffers(
    listingId: number,
    exceptOfferId: number,
  ): Promise<WigglypopOffer[]> {
    const pending = await this.db
      .select()
      .from(wigglypopOffers)
      .where(
        and(
          eq(wigglypopOffers.listingId, listingId),
          eq(wigglypopOffers.status, 'pendiente'),
          ne(wigglypopOffers.id, exceptOfferId),
        ),
      );
    if (pending.length === 0) return [];

    await this.db
      .update(wigglypopOffers)
      .set({ status: 'rechazada', respondedAt: new Date() })
      .where(
        inArray(
          wigglypopOffers.id,
          pending.map((o) => o.id),
        ),
      );
    return pending;
  }

  // ─── Trade offers ───────────────────────────────────────────────────────────

  async createTrade(data: {
    listingId: number;
    proposerUuid: string;
    offeredPokemonKey: string;
    offeredSnapshot: unknown;
  }): Promise<WigglypopTradeOffer> {
    const inserted = await this.db.insert(wigglypopTradeOffers).values(data);
    return (await this.findTrade(inserted[0].insertId)) as WigglypopTradeOffer;
  }

  async findTrade(id: number): Promise<WigglypopTradeOffer | null> {
    const rows = await this.db
      .select()
      .from(wigglypopTradeOffers)
      .where(eq(wigglypopTradeOffers.id, id));
    return rows[0] ?? null;
  }

  async findTradesForSeller(sellerUuid: string): Promise<WigglypopTradeOffer[]> {
    const rows = await this.db
      .select({ trade: wigglypopTradeOffers })
      .from(wigglypopTradeOffers)
      .innerJoin(
        wigglypopListings,
        eq(wigglypopTradeOffers.listingId, wigglypopListings.id),
      )
      .where(eq(wigglypopListings.sellerUuid, sellerUuid))
      .orderBy(desc(wigglypopTradeOffers.createdAt));
    return rows.map((r) => r.trade);
  }

  async setTradeStatus(
    id: number,
    status: string,
  ): Promise<WigglypopTradeOffer> {
    await this.db
      .update(wigglypopTradeOffers)
      .set({ status, respondedAt: new Date() })
      .where(eq(wigglypopTradeOffers.id, id));
    return (await this.findTrade(id)) as WigglypopTradeOffer;
  }

  // ─── Watchlist ──────────────────────────────────────────────────────────────

  async setWatching(
    userUuid: string,
    listingId: number,
    watching: boolean,
  ): Promise<boolean> {
    if (!watching) {
      await this.db
        .delete(wigglypopWatchlist)
        .where(
          and(
            eq(wigglypopWatchlist.userUuid, userUuid),
            eq(wigglypopWatchlist.listingId, listingId),
          ),
        );
      return false;
    }

    // Leans on the (user_uuid, listing_id) UNIQUE index: two concurrent watch clicks race to
    // the same row and the loser is a no-op rather than a duplicate.
    await this.db
      .insert(wigglypopWatchlist)
      .values({ userUuid, listingId })
      .onDuplicateKeyUpdate({ set: { listingId } });
    return true;
  }

  async findWatchedListingIds(userUuid: string): Promise<number[]> {
    const rows = await this.db
      .select({ listingId: wigglypopWatchlist.listingId })
      .from(wigglypopWatchlist)
      .where(eq(wigglypopWatchlist.userUuid, userUuid))
      .orderBy(desc(wigglypopWatchlist.createdAt));
    return rows.map((r) => r.listingId);
  }

  /** Who is watching a listing — used to tell them when it sells or an auction is closing. */
  async findWatchers(listingId: number): Promise<string[]> {
    const rows = await this.db
      .select({ userUuid: wigglypopWatchlist.userUuid })
      .from(wigglypopWatchlist)
      .where(eq(wigglypopWatchlist.listingId, listingId));
    return rows.map((r) => r.userUuid);
  }

  // ─── Reviews ────────────────────────────────────────────────────────────────

  async createReview(data: {
    orderId: number;
    reviewerUuid: string;
    sellerUuid: string;
    rating: number;
    body?: string | null;
  }): Promise<WigglypopReview> {
    const inserted = await this.db.insert(wigglypopReviews).values(data);
    const rows = await this.db
      .select()
      .from(wigglypopReviews)
      .where(eq(wigglypopReviews.id, inserted[0].insertId));
    return rows[0];
  }

  async findReviewsForSeller(sellerUuid: string): Promise<WigglypopReview[]> {
    return this.db
      .select()
      .from(wigglypopReviews)
      .where(eq(wigglypopReviews.sellerUuid, sellerUuid))
      .orderBy(desc(wigglypopReviews.createdAt));
  }

  async findExistingReview(
    orderId: number,
    reviewerUuid: string,
  ): Promise<WigglypopReview | null> {
    const rows = await this.db
      .select()
      .from(wigglypopReviews)
      .where(
        and(
          eq(wigglypopReviews.orderId, orderId),
          eq(wigglypopReviews.reviewerUuid, reviewerUuid),
        ),
      );
    return rows[0] ?? null;
  }

  /**
   * Mean rating over real reviews, or null when there are none. Deliberately NOT defaulted to
   * 5 or 0 — a seller nobody has reviewed has no rating, and the API must say so.
   */
  async sellerRating(
    sellerUuid: string,
  ): Promise<{ rating: number | null; count: number }> {
    const rows = await this.db
      .select({
        avg: sql<string | null>`AVG(${wigglypopReviews.rating})`,
        count: sql<number>`count(*)`,
      })
      .from(wigglypopReviews)
      .where(eq(wigglypopReviews.sellerUuid, sellerUuid));

    const count = Number(rows[0]?.count ?? 0);
    if (count === 0) return { rating: null, count: 0 };
    return {
      rating: Math.round(Number(rows[0].avg) * 10) / 10,
      count,
    };
  }
}
