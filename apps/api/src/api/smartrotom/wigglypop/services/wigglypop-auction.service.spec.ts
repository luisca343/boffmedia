import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from 'nestjs-pino';
import { WigglypopAuctionService } from './wigglypop-auction.service';
import { WigglypopListingsRepository } from '../repositories/wigglypop-listings.repository';
import { WigglypopTradingRepository } from '../repositories/wigglypop-trading.repository';
import { WigglypopOrdersService } from './wigglypop-orders.service';
import { WigglypopNotifyService } from './wigglypop-notify.service';

const SELLER = 'seller-uuid';
const WINNER = 'winner-uuid';

const makeAuction = (overrides: Record<string, any> = {}): any => ({
  id: 101,
  code: 'LST-AUCTION',
  sellerUuid: SELLER,
  title: 'Shiny Garchomp',
  format: 'auction',
  status: 'activo',
  price: 5000,
  currentBid: 8000,
  endsAt: new Date(Date.now() - 60_000), // a minute past its end
  ...overrides,
});

const makeBid = (overrides: Record<string, any> = {}): any => ({
  id: 1,
  listingId: 101,
  bidderUuid: WINNER,
  amount: 8000,
  createdAt: new Date(),
  ...overrides,
});

describe('WigglypopAuctionService', () => {
  let service: WigglypopAuctionService;

  const listingsRepository = {
    findExpiredAuctions: jest.fn(),
    update: jest.fn(),
    setStatus: jest.fn(),
  };
  const tradingRepository = {
    findTopBid: jest.fn(),
    findLosingBidders: jest.fn(),
  };
  const ordersService = { create: jest.fn() };
  const notify = {
    auctionWon: jest.fn(),
    auctionLost: jest.fn(),
    auctionNoBids: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    listingsRepository.findExpiredAuctions.mockResolvedValue([]);
    tradingRepository.findLosingBidders.mockResolvedValue([]);
    ordersService.create.mockResolvedValue({ id: 77 });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WigglypopAuctionService,
        { provide: Logger, useValue: { log: jest.fn(), error: jest.fn() } },
        { provide: WigglypopListingsRepository, useValue: listingsRepository },
        { provide: WigglypopTradingRepository, useValue: tradingRepository },
        { provide: WigglypopOrdersService, useValue: ordersService },
        { provide: WigglypopNotifyService, useValue: notify },
      ],
    }).compile();

    service = module.get(WigglypopAuctionService);
  });

  it('does nothing when no auction has expired', async () => {
    const result = await service.sweep();

    expect(result).toEqual({ closed: 0, sold: 0, cancelled: 0, failed: 0 });
    expect(ordersService.create).not.toHaveBeenCalled();
  });

  describe('an auction that got bids', () => {
    beforeEach(() => {
      listingsRepository.findExpiredAuctions.mockResolvedValue([makeAuction()]);
      tradingRepository.findTopBid.mockResolvedValue(makeBid());
    });

    it('sells to the top bidder, at their winning bid, through the ordinary order path', async () => {
      const result = await service.sweep();

      // The listing is repriced to the winning bid before the order is built from it, so the
      // winner is charged what they actually promised — not the starting price.
      expect(listingsRepository.update).toHaveBeenCalledWith(101, {
        price: 8000,
      });
      expect(ordersService.create).toHaveBeenCalledWith(
        { buyerUuid: WINNER, lines: [{ listingId: 101, qty: 1 }] },
        { closingAuction: true },
      );
      expect(result).toMatchObject({ closed: 1, sold: 1, cancelled: 0 });
    });

    it('notifies the winner', async () => {
      await service.sweep();

      expect(notify.auctionWon).toHaveBeenCalledWith(
        WINNER,
        77,
        'Shiny Garchomp',
        8000,
      );
    });

    it('notifies every losing bidder', async () => {
      tradingRepository.findLosingBidders.mockResolvedValue([
        'loser-a',
        'loser-b',
      ]);

      await service.sweep();

      expect(notify.auctionLost).toHaveBeenCalledTimes(2);
      expect(notify.auctionLost).toHaveBeenCalledWith(
        'loser-a',
        101,
        'Shiny Garchomp',
      );
      expect(notify.auctionLost).toHaveBeenCalledWith(
        'loser-b',
        101,
        'Shiny Garchomp',
      );
      // The winner is never told they lost.
      expect(notify.auctionLost).not.toHaveBeenCalledWith(
        WINNER,
        expect.anything(),
        expect.anything(),
      );
    });

    // The order path is what marks the listing sold, once custody settles. Doing it here as
    // well would race it.
    it('does not mark the listing sold itself', async () => {
      await service.sweep();

      expect(listingsRepository.setStatus).not.toHaveBeenCalledWith(
        101,
        'vendido',
      );
    });

    it('closes the auction unsold — and charges nobody — when the winner cannot pay', async () => {
      ordersService.create.mockRejectedValue(new Error('insufficient funds'));

      const result = await service.sweep();

      expect(listingsRepository.setStatus).toHaveBeenCalledWith(
        101,
        'cancelado',
      );
      expect(listingsRepository.setStatus).not.toHaveBeenCalledWith(
        101,
        'vendido',
      );
      expect(notify.auctionWon).not.toHaveBeenCalled();
      expect(result).toMatchObject({ closed: 1, sold: 0, cancelled: 1 });
    });
  });

  describe('an auction that got no bids', () => {
    beforeEach(() => {
      listingsRepository.findExpiredAuctions.mockResolvedValue([makeAuction()]);
      tradingRepository.findTopBid.mockResolvedValue(null);
    });

    it('cancels it — there is no winner to invent', async () => {
      const result = await service.sweep();

      expect(listingsRepository.setStatus).toHaveBeenCalledWith(
        101,
        'cancelado',
      );
      expect(ordersService.create).not.toHaveBeenCalled();
      expect(notify.auctionNoBids).toHaveBeenCalledWith(
        SELLER,
        101,
        'Shiny Garchomp',
      );
      expect(result).toMatchObject({ closed: 1, sold: 0, cancelled: 1 });
    });
  });

  it('keeps sweeping when one auction blows up', async () => {
    listingsRepository.findExpiredAuctions.mockResolvedValue([
      makeAuction({ id: 101 }),
      makeAuction({ id: 102 }),
    ]);
    tradingRepository.findTopBid
      .mockRejectedValueOnce(new Error('db exploded'))
      .mockResolvedValueOnce(makeBid({ listingId: 102 }));

    const result = await service.sweep();

    // The second auction still closed, despite the first one failing.
    expect(result).toMatchObject({ failed: 1, closed: 1, sold: 1 });
    expect(ordersService.create).toHaveBeenCalledTimes(1);
  });
});
