import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Logger } from 'nestjs-pino';
import { WigglypopListingsRepository } from '../repositories/wigglypop-listings.repository';
import { WigglypopTradingRepository } from '../repositories/wigglypop-trading.repository';
import { WigglypopOrdersService } from './wigglypop-orders.service';
import { WigglypopNotifyService } from './wigglypop-notify.service';
import { WigglypopListing } from '@/_db/schema/SmartRotomWigglypop';

export interface AuctionSweepResult {
  closed: number;
  sold: number;
  cancelled: number;
  failed: number;
}

// Closes auctions whose time is up. Runs every minute, which is as precise as an auction end
// needs to be and cheap: the query is indexed on (status, kind, format) and only ever matches
// auctions that are BOTH live and already past their end.
@Injectable()
export class WigglypopAuctionService {
  constructor(
    private readonly logger: Logger,
    private readonly listingsRepository: WigglypopListingsRepository,
    private readonly tradingRepository: WigglypopTradingRepository,
    private readonly ordersService: WigglypopOrdersService,
    private readonly notify: WigglypopNotifyService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async sweep(): Promise<AuctionSweepResult> {
    const expired = await this.listingsRepository.findExpiredAuctions(
      new Date(),
    );
    const result: AuctionSweepResult = {
      closed: 0,
      sold: 0,
      cancelled: 0,
      failed: 0,
    };
    if (expired.length === 0) return result;

    this.logger.log(`Wigglypop: closing ${expired.length} expired auction(s)`);

    for (const listing of expired) {
      try {
        const sold = await this.close(listing);
        result.closed++;
        if (sold) result.sold++;
        else result.cancelled++;
      } catch (error: any) {
        // One bad auction must never stall the sweep for every other one.
        result.failed++;
        this.logger.error(
          `Wigglypop: failed to close auction ${listing.code}: ${error?.message}`,
        );
      }
    }

    return result;
  }

  /** Returns true when the auction produced a sale. */
  private async close(listing: WigglypopListing): Promise<boolean> {
    const top = await this.tradingRepository.findTopBid(listing.id);

    // Nobody bid. There is no winner to invent — the listing is simply cancelled.
    if (!top) {
      await this.listingsRepository.setStatus(listing.id, 'cancelado');
      await this.notify.auctionNoBids(
        listing.sellerUuid,
        listing.id,
        listing.title,
      );
      return false;
    }

    // The winner buys at their winning bid. The listing is repriced to it and the order is
    // created through the ordinary purchase path, so an auction settles through exactly the
    // same custody code (and the same escrow, and the same fee) as a buy-it-now.
    await this.listingsRepository.update(listing.id, { price: top.amount });

    let orderId: number;
    try {
      const order = await this.ordersService.create(
        {
          buyerUuid: top.bidderUuid,
          lines: [{ listingId: listing.id, qty: 1 }],
        } as any,
        { closingAuction: true },
      );
      orderId = order.id;
    } catch (error: any) {
      // The winner could not actually pay (or custody refused the take). The auction is closed
      // as cancelled rather than left live forever — but the listing is NOT marked sold, and
      // nobody is charged.
      this.logger.error(
        `Wigglypop: auction ${listing.code} was won by ${top.bidderUuid} for ${top.amount} ` +
          `but the order failed (${error?.message}). Closing it unsold.`,
      );
      await this.listingsRepository.setStatus(listing.id, 'cancelado');
      await this.notify.auctionNoBids(
        listing.sellerUuid,
        listing.id,
        listing.title,
      );
      return false;
    }

    // `ordersService.create` already reserved the listing and notified the seller of the sale;
    // custody moves it to `vendido` when the order settles. Marking it here as well is what
    // would race the custody path, so it is deliberately not done.
    await this.notify.auctionWon(
      top.bidderUuid,
      orderId,
      listing.title,
      top.amount,
    );

    const losers = await this.tradingRepository.findLosingBidders(
      listing.id,
      top.bidderUuid,
    );
    for (const uuid of losers) {
      await this.notify.auctionLost(uuid, listing.id, listing.title);
    }

    return true;
  }
}
